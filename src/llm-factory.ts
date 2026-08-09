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
  const provider =
    registryEntry?.provider ??
    (modelName.startsWith("claude-") ? "anthropic" : "openai");

  if (provider === "bedrock") {
    if (!config.awsAccessKeyId || !config.awsSecretAccessKey) {
      throw new Error(
        `Model "${modelName}" requires awsAccessKeyId and awsSecretAccessKey in CadburyConfig`
      );
    }
    return new ChatBedrockConverse({
      model: registryEntry?.bedrockModelId || modelName,
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
