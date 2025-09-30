import {
  ContentBlockDelta,
  ContentBlockStart,
  ExtendedMetadata,
} from "@/interface/Chunk";
import { ApiStream } from "@/interface/Stream";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function* streamChunks(response: Response) {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    let newlineIndex;

    while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (line) {
        yield JSON.parse(line);
      }
    }
  }

  if (buffer.trim()) {
    yield JSON.parse(buffer);
  }
}

function* handleBedrockStreamError(
  chunk: any
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

export async function* executeConverseStream(
  data: any,
  accessToken: string
): ApiStream {
  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cognito-access-token": accessToken ?? "",
      },
      body: JSON.stringify(data),
    });

    if (response) {
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
                yield {
                  type: "reasoning",
                  reasoning: reasoningBlock.text,
                };
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
                yield {
                  type: "reasoning",
                  reasoning: initialContent,
                };
              }
            }
          }
        }

        if (chunk.contentBlockDelta) {
          const blockIndex = chunk.contentBlockDelta.contentBlockIndex;

          if (blockIndex !== undefined) {
            if (!(blockIndex in contentBuffers)) {
              contentBuffers[blockIndex] = "";
            }

            const blockType = blockTypes.get(blockIndex);
            const delta = chunk.contentBlockDelta
              .delta as ContentBlockDelta["delta"];

            if (delta?.type === "thinking_delta" || delta?.thinking) {
              const thinkingContent = delta.thinking || delta.text || "";
              if (thinkingContent) {
                yield {
                  type: "reasoning",
                  reasoning: thinkingContent,
                };
              }
            } else if (delta?.reasoningContent?.text) {
              const reasoningText = delta.reasoningContent.text;
              if (reasoningText) {
                yield {
                  type: "reasoning",
                  reasoning: reasoningText,
                };
              }
            } else if (chunk.contentBlockDelta.delta?.text) {
              const textContent = chunk.contentBlockDelta.delta.text;
              contentBuffers[blockIndex] += textContent;

              if (blockType === "reasoning") {
                yield {
                  type: "reasoning",
                  reasoning: textContent,
                };
              } else {
                yield {
                  type: "text",
                  text: textContent,
                };
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
