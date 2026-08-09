import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatBedrockConverse } from "@langchain/aws";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { CadburyConfig } from "./types";
import { MODEL_REGISTRY } from "./models";

/** Returns the appropriate LLM instance based on the model name in config. */
export function createLLM(config: CadburyConfig): BaseChatModel {
  const modelName = config.modelName || "gpt-3.5-turbo";
  const registryEntry = MODEL_REGISTRY.find((m) => m.id === modelName);
  
  // Detect provider: registry -> Bedrock pattern -> Anthropic -> OpenAI
  const bedrockPattern = /^(amazon|meta|mistral|cohere|ai21|stability|deepseek|qwen|nvidia|minimax|zai|moonshot|google)\.[a-z0-9-]+:\d+$|^(bedrock-)/i;
  const isBedrockModel = bedrockPattern.test(modelName);
  
  const provider =
    registryEntry?.provider ??
    (isBedrockModel ? "bedrock" :modelName.startsWith("claude-") ? "anthropic" : "openai");

  if (provider === "bedrock") {
    if (!config.awsAccessKeyId || !config.awsSecretAccessKey) {
      throw new Error(
        `Model "${modelName}" requires awsAccessKeyId and awsSecretAccessKey in CadburyConfig`
      );
    }
    
    // Use bedrockModelId from registry if present, otherwise use modelName directly
    // This allows dynamic Bedrock models to work without registry lookup
    const bedrockModelId = registryEntry?.bedrockModelId || modelName;
    
    return new ChatBedrockConverse({
      model: bedrockModelId,
      region: config.awsRegion || "us-east-1",
      credentials: {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
        sessionToken: config.awsSessionToken,
      },
      temperature: config.temperature ?? 0,
    });
  }

  if (provider === "anthropic") {
    if (!config.anthropicApiKey) {
      throw new Error(
        `Model "${modelName}" requires anthropicApiKey in CadburyConfig`
      );
    }
    return new ChatAnthropic({
      apiKey: config.anthropicApiKey,
      model: modelName,
      temperature: config.temperature ?? 0,
    });
  }

  if (!config.openaiApiKey) {
    throw new Error(
      `Model "${modelName}" requires openaiApiKey in CadburyConfig`
    );
  }
  return new ChatOpenAI({
    apiKey: config.openaiApiKey,
    modelName,
    temperature: config.temperature ?? 0,
  });
}
