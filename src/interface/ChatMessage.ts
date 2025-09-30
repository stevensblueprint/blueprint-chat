interface ChatMessage {
  role: "user" | "assistant";
  content: { text: string }[];
}

export default ChatMessage;
