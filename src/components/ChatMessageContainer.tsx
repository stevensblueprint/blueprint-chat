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
      className="w-1/2 h-full overflow-y-auto flex flex-col gap-2 p-2"
    >
      {messages.map((msg, index) => (
        <ChatMessageBubble key={index} message={msg} />
      ))}
    </div>
  );
};

export default ChatMessageContainer;
