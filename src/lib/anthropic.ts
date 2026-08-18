import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages";

let client: Anthropic | null = null;

/**
 * Lazily construct the Anthropic client so that a missing API key only
 * fails the specific request that needs it, instead of crashing the whole
 * app at import time (e.g. the knowledge-base CRUD pages don't need it).
 */
export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AnthropicConfigError(
      "ANTHROPIC_API_KEY が設定されていません。.env に設定してください。"
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export class AnthropicConfigError extends Error {}

export const COACH_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

/** Concatenates the text blocks of a Messages API response into one string. */
export function extractResponseText(response: Message): string {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}
