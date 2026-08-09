/**
 * Static metadata overlay for Bedrock models
 * Keys are AWS Bedrock model IDs (e.g., 'meta.llama3-70b-instruct-v1:0')
 * 
 * This provides human-readable descriptions, use-case recommendations, and pricing
 * that aren't available from AWS's API.
 */

export interface BedrockModelMetadata {
  displayName: string;
  description: string;
  bestFor: string[];
  costTier: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  pricing: {
    input: number; // USD per 1K tokens
    output: number; // USD per 1K tokens
  };
  maxTokens?: number;
  recommended?: boolean;
}

/**
 * Metadata overlay for Bedrock models
 * Pricing based on AWS Bedrock ap-south-1 (Mumbai) on-demand pricing
 * Last updated: 2026-08-10
 */
export const BEDROCK_METADATA: Record<string, BedrockModelMetadata> = {
  // Meta Llama models
  'meta.llama3-70b-instruct-v1:0': {
    displayName: 'Llama 3 70B',
    description: 'Fast, efficient model for screening, classification, and routing tasks. Excellent balance of performance and cost.',
    bestFor: ['screening', 'classification', 'routing', 'decision-making', 'tool-calling'],
    costTier: 'low',
    pricing: { input: 0.00026, output: 0.00061 }, // $0.26/$0.61 per 1M tokens
    maxTokens: 8192,
    recommended: true,
  },
  'meta.llama3-8b-instruct-v1:0': {
    displayName: 'Llama 3 8B',
    description: 'Ultra-fast, cost-efficient model for simple tasks. Great for routing and quick decisions.',
    bestFor: ['routing', 'classification', 'simple-decisions'],
    costTier: 'very-low',
    pricing: { input: 0.00003, output: 0.00006 }, // $0.03/$0.06 per 1M tokens
    maxTokens: 8192,
  },

  // Mistral AI models
  'mistral.mistral-large-2402-v1:0': {
    displayName: 'Mistral Large',
    description: 'Powerful model for complex reasoning, analysis, and sophisticated tasks.',
    bestFor: ['complex-reasoning', 'analysis', 'research', 'synthesis', 'planning'],
    costTier: 'moderate',
    pricing: { input: 0.002, output: 0.006 }, // $2.00/$6.00 per 1M tokens
    maxTokens: 32768,
    recommended: true,
  },
  'mistral.mistral-large-3-675b-instruct': {
    displayName: 'Mistral Large 3',
    description: 'Latest and most powerful Mistral model. Exceptional for complex reasoning and analysis.',
    bestFor: ['complex-reasoning', 'analysis', 'research', 'synthesis', 'advanced-planning'],
    costTier: 'high',
    pricing: { input: 0.002, output: 0.006 }, // Estimate based on previous generation
    maxTokens: 32768,
  },
  'mistral.mistral-small-2402-v1:0': {
    displayName: 'Mistral Small',
    description: 'Cost-effective Mistral model for quick tasks and light analysis.',
    bestFor: ['quick-tasks', 'light-analysis', 'monitoring'],
    costTier: 'low',
    pricing: { input: 0.0001, output: 0.0003 }, // $0.10/$0.30 per 1M tokens
    maxTokens: 8192,
  },

  // Amazon Nova models
  'amazon.nova-pro-v1:0': {
    displayName: 'Amazon Nova Pro',
    description: 'Balanced general-purpose model. Good for a wide range of tasks.',
    bestFor: ['general-purpose', 'balanced-tasks', 'multi-purpose'],
    costTier: 'low',
    pricing: { input: 0.0008, output: 0.0032 }, // $0.80/$3.20 per 1M tokens
    maxTokens: 300000,
    recommended: true,
  },
  'amazon.nova-lite-v1:0': {
    displayName: 'Amazon Nova Lite',
    description: 'Cost-effective model for monitoring and simple tasks. Excellent for periodic operations.',
    bestFor: ['monitoring', 'periodic-tasks', 'simple-operations'],
    costTier: 'very-low',
    pricing: { input: 0.00006, output: 0.00024 }, // $0.06/$0.24 per 1M tokens
    maxTokens: 300000,
    recommended: true,
  },
  'amazon.nova-micro-v1:0': {
    displayName: 'Amazon Nova Micro',
    description: 'Ultra-lightweight model for the simplest tasks. Most cost-effective.',
    bestFor: ['simple-tasks', 'routing', 'classification'],
    costTier: 'very-low',
    pricing: { input: 0.00003, output: 0.00015 }, // $0.03/$0.15 per 1M tokens
    maxTokens: 128000,
  },

  // DeepSeek models
  'deepseek.v3.2': {
    displayName: 'DeepSeek v3.2',
    description: 'Efficient model with strong performance for coding and reasoning.',
    bestFor: ['coding', 'reasoning', 'technical-tasks'],
    costTier: 'moderate',
    pricing: { input: 0.00027, output: 0.00107 }, // Estimate
    maxTokens: 64000,
  },

  // Qwen models
  'qwen.qwen3-32b-v1:0': {
    displayName: 'Qwen 3 32B',
    description: 'Balanced model from Qwen. Good for general tasks.',
    bestFor: ['general-purpose', 'balanced-tasks'],
    costTier: 'low',
    pricing: { input: 0.00018, output: 0.0006 }, // Estimate
    maxTokens: 32768,
  },

  // Mistral Devstral (if available)
  'mistral.devstral-2-123b': {
    displayName: 'Mistral Devstral',
    description: 'Advanced reasoning model from Mistral. Excellent for complex analysis.',
    bestFor: ['complex-reasoning', 'advanced-analysis', 'research'],
    costTier: 'high',
    pricing: { input: 0.002, output: 0.006 }, // Estimate
    maxTokens: 32768,
  },
};

/**
 * Get metadata for a Bedrock model, or return default
 */
export function getBedrockMetadata(bedrockModelId: string): BedrockModelMetadata {
  if (BEDROCK_METADATA[bedrockModelId]) {
    return BEDROCK_METADATA[bedrockModelId];
  }

  // Default metadata for unknown models
  return {
    displayName: cleanModelName(bedrockModelId),
    description: 'Model available via AWS Bedrock',
    bestFor: ['general-purpose'],
    costTier: 'moderate',
    pricing: { input: 0.001, output: 0.003 }, // Default pricing
    maxTokens: 8192,
  };
}

function cleanModelName(bedrockModelId: string): string {
  const parts = bedrockModelId.split('.');
  if (parts.length < 2) return bedrockModelId.toUpperCase();

  const model = parts[1].split(':')[0];
  return model
    .replace(/-/g, ' ')
    .replace(/(\d)b/gi, '$1B')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
