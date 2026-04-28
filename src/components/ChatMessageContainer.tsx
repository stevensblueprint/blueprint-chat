import { useEffect, useRef } from "react";
import ChatMessageBubble from "./ChatMessageBubble";
import ChatMessage from "@/interface/ChatMessage";

const ChatMessageContainer = ({ messages }: { messages: ChatMessage[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto w-full flex flex-col gap-4 p-6"
      style={{ width: "100%", maxWidth: "1800px", alignItems: "flex-start" }}
    >
      {messages.map((msg, index) => (
        <ChatMessageBubble key={index} message={msg} />
      ))}
    </div>
  );
};

export default ChatMessageContainer;
