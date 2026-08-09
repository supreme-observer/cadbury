import {
  BedrockClient,
  ListFoundationModelsCommand,
  FoundationModelSummary,
} from '@aws-sdk/client-bedrock';

export interface DiscoveredBedrockModel {
  id: string; // Registry ID (e.g., 'bedrock-llama-3-70b')
  bedrockModelId: string; // AWS Bedrock model ID (e.g., 'meta.llama3-70b-instruct-v1:0')
  provider: string;
  displayName: string;
  modelName: string;
  supportsStreaming: boolean;
  inputModalities: string[];
  outputModalities: string[];
}

interface BedrockCatalogCache {
  models: DiscoveredBedrockModel[];
  fetchedAt: number;
  ttl: number;
}

let catalogCache: BedrockCatalogCache | null = null;
const DEFAULT_TTL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

/**
 * Fetches available Bedrock models from AWS
 * Uses caching to avoid repeated API calls
 */
export async function listBedrockModels(config?: {
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forceRefresh?: boolean;
}): Promise<DiscoveredBedrockModel[]> {
  const {
    region = 'us-east-1',
    accessKeyId,
    secretAccessKey,
    forceRefresh = false,
  } = config || {};

  // Check cache (unless force refresh)
  if (!forceRefresh && catalogCache && Date.now() - catalogCache.fetchedAt < catalogCache.ttl) {
    return catalogCache.models;
  }

  // Skip discovery if no credentials provided
  if (!accessKeyId || !secretAccessKey) {
    return [];
  }

  try {
    const client = new BedrockClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new ListFoundationModelsCommand({});
    const response = await client.send(command);

    const models = (response.modelSummaries || [])
      .filter(model => {
        // Filter for inference models only (not embeddings)
        if (!model.modelId || !model.providerName) return false;
        if (model.modelId.includes('embed')) return false; // Skip embedding models
        if (model.modelId.includes('pegasus')) return false; // Skip video models
        
        // Model needs to support text generation
        const hasTextInput = model.inputModalities?.includes('TEXT' as any);
        const hasTextOutput = model.outputModalities?.includes('TEXT' as any);
        
        return hasTextInput && hasTextOutput;
      })
      .map((model: FoundationModelSummary): DiscoveredBedrockModel => {
        const bedrockModelId = model.modelId!;

        // Generate registry ID from Bedrock model ID
        const id = generateRegistryId(bedrockModelId);
        
        return {
          id,
          bedrockModelId,
          provider: 'bedrock',
          displayName: model.modelName || cleanModelName(bedrockModelId),
          modelName: model.modelName || cleanModelName(bedrockModelId),
          supportsStreaming: model.responseStreamingSupported ?? true,
          inputModalities: model.inputModalities || ['TEXT'],
          outputModalities: model.outputModalities || ['TEXT'],
        };
      });

    // Update cache
    catalogCache = {
      models,
      fetchedAt: Date.now(),
      ttl: DEFAULT_TTL,
    };

    return models;
  } catch (error: any) {
    console.error('[BedrockCatalog] Failed to fetch models:', error.message);
    
    // Return stale cache if available
    if (catalogCache) {
      return catalogCache.models;
    }
    
    return [];
  }
}

/**
 * Generates a stable registry ID from Bedrock model ID
 * Example: 'meta.llama3-70b-instruct-v1:0' → 'bedrock-llama-3-70b'
 */
function generateRegistryId(bedrockModelId: string): string {
  const parts = bedrockModelId.split('.');
  const provider = parts[0];
  const modelParts = parts.slice(1).join('').split(':').slice(0, 1)[0];
  
  // Clean up version suffixes
  const cleanedModel = modelParts
    .replace(/-v\d+$/, '') // Remove version like -v1
    .replace(/-instruct$/, '') // Remove '-instruct'
    .replace(/-\d+:\d+$/, '') // Remove AWS version like -1:0
    
    // Normalize provider names in model ID
    .replace(/llama3/g, 'llama-3')
    .replace(/mistral-/g, 'mistral-');
  
  // Extract key model identifier
  const modelId = `${provider}-${cleanedModel}`.toLowerCase();
  
  // Ensure starts with 'bedrock-'
  return modelId.startsWith('bedrock-') ? modelId : `bedrock-${modelId}`;
}

/**
 * Cleans model ID to human-readable name
 * Example: 'meta.llama3-70b-instruct-v1:0' → 'Llama 3 70B'
 */
function cleanModelName(bedrockModelId: string): string {
  const parts = bedrockModelId.split('.');
  if (parts.length < 2) return bedrockModelId.toUpperCase();

  const provider = parts[0];
  const model = parts[1].split(':')[0]; // Remove version

  // Convert to human-readable
  let displayName = model
    .replace(/-/g, ' ')
    .replace(/(\d)b/gi, '$1B')
    .replace(/(\d+)x(\d+)/g, '$1x$2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  // Add provider prefix if not the model name
  if (!displayName.toLowerCase().includes(provider.toLowerCase())) {
    displayName = `${provider.charAt(0).toUpperCase() + provider.slice(1)} ${displayName}`;
  }

  return displayName.trim();
}

export function clearCatalogCache(): void {
  catalogCache = null;
}
