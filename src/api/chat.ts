import { fetchAuthSession } from "aws-amplify/auth";
import {
  ContentBlockDelta,
  ContentBlockStart,
  ExtendedMetadata,
} from "@/interface/Chunk";
import { ApiStream } from "@/interface/Stream";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AGENT_API_URL = import.meta.env.VITE_AGENT_API_URL;

async function* streamChunks(response: Response) {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (line) yield JSON.parse(line);
    }
  }

  if (buffer.trim()) yield JSON.parse(buffer);
}

function* handleBedrockStreamError(
  chunk: any,
): Generator<{ type: "text"; text: string }> {
  if (chunk.internalServerException) {
    yield {
      type: "text",
      text: `[ERROR] Internal server error: ${chunk.internalServerException.message}`,
    };
  } else if (chunk.modelStreamErrorException) {
    yield {
      type: "text",
      text: `[ERROR] Model stream error: ${chunk.modelStreamErrorException.message}`,
    };
  } else if (chunk.validationException) {
    yield {
      type: "text",
      text: `[ERROR] Validation error: ${chunk.validationException.message}`,
    };
  } else if (chunk.throttlingException) {
    yield {
      type: "text",
      text: `[ERROR] Throttling error: ${chunk.throttlingException.message}`,
    };
  } else if (chunk.serviceUnavailableException) {
    yield {
      type: "text",
      text: `[ERROR] Service unavailable: ${chunk.serviceUnavailableException.message}`,
    };
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const session = await fetchAuthSession();

    const idToken = session.tokens?.idToken?.toString();
    const accessToken = session.tokens?.accessToken?.toString();

    // Send both (safe + compatible with your current implementation)
    return {
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      ...(accessToken ? { "x-cognito-access-token": accessToken } : {}),
    };
  } catch (e) {
    console.error("Failed to fetch auth session:", e);
    return {};
  }
}

export interface AgentRequest {
  prompt: string;
  conversationId?: string;
}

export interface AgentResponse {
  response: string;
  conversationId: string;
}

export async function askAgent(req: AgentRequest): Promise<AgentResponse> {
  const res = await fetch(AGENT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function* executeConverseStream(data: any): ApiStream {
  try {
    const authHeaders = await getAuthHeaders();

    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(data),
    });

    // Optional but strongly recommended: fail fast on non-2xx
    if (!response.ok) {
      const msg = `[ERROR] Request failed: ${response.status} ${response.statusText}`;
      yield { type: "text", text: msg };
      return;
    }

    if (!response.body) {
      yield { type: "text", text: "[ERROR] Response has no body to stream." };
      return;
    }

    const contentBuffers: Record<number, string> = {};
    const blockTypes = new Map<number, "reasoning" | "text">();

    for await (const chunk of streamChunks(response)) {
      const metadata = chunk.metadata as ExtendedMetadata | undefined;

      if (metadata?.additionalModelResponseFields?.thinkingResponse) {
        const thinkingResponse =
          metadata.additionalModelResponseFields.thinkingResponse;

        if (
          thinkingResponse.reasoning &&
          Array.isArray(thinkingResponse.reasoning)
        ) {
          for (const reasoningBlock of thinkingResponse.reasoning) {
            if (reasoningBlock.type === "text" && reasoningBlock.text) {
              yield { type: "reasoning", reasoning: reasoningBlock.text };
            }
          }
        }
      }

      if (chunk.contentBlockStart) {
        const blockStart = chunk.contentBlockStart as ContentBlockStart;
        const blockIndex = chunk.contentBlockStart.contentBlockIndex;

        if (
          blockStart.start?.type === "thinking" ||
          blockStart.contentBlock?.type === "thinking" ||
          blockStart.type === "thinking"
        ) {
          if (blockIndex !== undefined) {
            blockTypes.set(blockIndex, "reasoning");
            const initialContent =
              blockStart.start?.thinking ||
              blockStart.contentBlock?.thinking ||
              blockStart.thinking ||
              "";

            if (initialContent) {
              yield { type: "reasoning", reasoning: initialContent };
            }
          }
        }
      }

      if (chunk.contentBlockDelta) {
        const blockIndex = chunk.contentBlockDelta.contentBlockIndex;

        if (blockIndex !== undefined) {
          if (!(blockIndex in contentBuffers)) contentBuffers[blockIndex] = "";

          const blockType = blockTypes.get(blockIndex);
          const delta = chunk.contentBlockDelta
            .delta as ContentBlockDelta["delta"];

          if (delta?.type === "thinking_delta" || (delta as any)?.thinking) {
            const thinkingContent =
              (delta as any).thinking || (delta as any).text || "";
            if (thinkingContent)
              yield { type: "reasoning", reasoning: thinkingContent };
          } else if ((delta as any)?.reasoningContent?.text) {
            const reasoningText = (delta as any).reasoningContent.text;
            if (reasoningText)
              yield { type: "reasoning", reasoning: reasoningText };
          } else if (chunk.contentBlockDelta.delta?.text) {
            const textContent = chunk.contentBlockDelta.delta.text;
            contentBuffers[blockIndex] += textContent;

            if (blockType === "reasoning") {
              yield { type: "reasoning", reasoning: textContent };
            } else {
              yield { type: "text", text: textContent };
            }
          }
        }
      }

      if (chunk.contentBlockStop) {
        const blockIndex = chunk.contentBlockStop.contentBlockIndex;
        if (blockIndex !== undefined) {
          delete contentBuffers[blockIndex];
          blockTypes.delete(blockIndex);
        }
      }

      yield* handleBedrockStreamError(chunk);
    }
  } catch (error) {
    console.error("Error processing Converse API response:", error);
    yield {
      type: "text",
      text: `[ERROR] Failed to process response: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}
