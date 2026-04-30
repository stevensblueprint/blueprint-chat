import ChatMessage from "@/interface/ChatMessage";
import React from "react";
import ReactMarkdown from "react-markdown";
import byteLogo from "@/assets/byte.png";

const ChatMessageBubble = React.memo(
  ({ message }: { message: ChatMessage }) => {
    const isAssistantLoadingDots = message.role === "assistant" && message.content[0]?.text === "";

    return (
      <div
        className={`flex items-start gap-3 max-w-[850px] ${
          message.role === "user" ? "flex-row-reverse self-end" : "flex-row self-start"
        }`}
      >
        {message.role === "assistant" && (
          <img
            src={byteLogo}
            alt="Byte Logo"
            className="w-10 h-10 rounded-full flex-shrink-0 object-contain mt-1"
          />
        )}

        <div
          className={`max-w-[800px] rounded-[20px] font-body text-sm leading-normal min-h-[44px] py-3 px-4 ${
            message.role === "user"
              ? "bg-[#0078e8] text-white"
              : "bg-gray-200 text-gray-900"
          }`}
        >
          {isAssistantLoadingDots ? (
            <div className="flex gap-1" role="status" aria-live="polite" aria-label="Assistant is responding">
              <span className="sr-only">Assistant is responding</span>
              <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce"></div>
              <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></div>
              <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
            </div>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p style={{ marginBottom: "0.5rem" }}>{children}</p>,
                ul: ({ children }) => <ul style={{ listStyleType: "disc", paddingLeft: "1.5rem", marginBottom: "0.5rem" }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ listStyleType: "decimal", paddingLeft: "1.5rem", marginBottom: "0.5rem" }}>{children}</ol>,
                li: ({ children }) => <li style={{ marginBottom: "0.25rem" }}>{children}</li>,
                strong: ({ children }) => <strong style={{ fontWeight: "600" }}>{children}</strong>,
              }}
            >
              {message.content.map((text) => text.text).join(" ")}
            </ReactMarkdown>
          )}
        </div>
      </div>
    );
  }
);

export default ChatMessageBubble;