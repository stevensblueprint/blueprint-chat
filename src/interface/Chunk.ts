export interface ExtendedMetadata {
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    cacheReadInputTokens?: number;
    cacheWriteInputTokens?: number;
  };
  additionalModelResponseFields?: {
    thinkingResponse?: {
      reasoning?: Array<{
        type: string;
        text?: string;
        signature?: string;
      }>;
    };
  };
}

export interface ContentBlockStart {
  contentBlockIndex?: number;
  start?: {
    type?: string;
    thinking?: string;
  };
  contentBlock?: {
    type?: string;
    thinking?: string;
  };
  type?: string;
  thinking?: string;
}

export interface ContentBlockDelta {
  contentBlockIndex?: number;
  delta?: {
    type?: string;
    thinking?: string;
    text?: string;
    reasoningContent?: {
      text?: string;
    };
  };
}
