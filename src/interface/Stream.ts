export type ApiStream = AsyncGenerator<ApiStreamChunk>;
export type ApiStreamChunk = ApiStreamTextChunk | ApiStreamReasoningChunk;

export interface ApiStreamTextChunk {
  type: "text";
  text: string;
}

export interface ApiStreamReasoningChunk {
  type: "reasoning";
  reasoning: string;
}
