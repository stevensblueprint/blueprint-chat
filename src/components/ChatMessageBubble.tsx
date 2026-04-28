import ChatMessage from "@/interface/ChatMessage";
import React from "react";
import ReactMarkdown from "react-markdown";

const ChatMessageBubble = React.memo(
  ({ message }: { message: ChatMessage }) => {
    const isAssistantLoadingDots = message.role === "assistant" && message.content[0]?.text === "";

    return (
      <div
        className={`max-w-[800px] rounded-[20px] font-body text-sm leading-normal min-h-[44px] flex items-center ${
          message.role === "user"
            ? "bg-[#0078e8] text-white self-end py-3 px-4"
            : "bg-gray-200 text-gray-900 self-start py-3 px-4"
        }`}
      >
        {isAssistantLoadingDots ? (
          <div
            className="flex gap-1"
            role="status"
            aria-live="polite"
            aria-label="Assistant is responding"
          >
            <span className="sr-only">Assistant is responding</span>
            <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce"></div>
            <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
            <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
          </div>
        ) : (
          <ReactMarkdown>
            {message.content.map((text) => text.text).join(" ")}
          </ReactMarkdown>
        )}
      </div>
    );
  }
);

export default ChatMessageBubble;
