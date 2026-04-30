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
      className="overflow-y-auto w-full p-6"
      style={{ flex: "1 1 0", minHeight: 0 }}
    >
      <div className="flex flex-col gap-4">
        {messages.map((msg, index) => (
          <ChatMessageBubble key={index} message={msg} />
        ))}
      </div>
    </div>
  );
};

export default ChatMessageContainer;