import ChatMessage from "@/interface/ChatMessage";
import React from "react";
import ReactMarkdown from "react-markdown";

const ChatMessageBubble = React.memo(
  ({ message }: { message: ChatMessage }) => {
    return (
      <div
        className={`max-w-md py-2 px-4 rounded-lg ${
          message.role === "user"
            ? "bg-blue-500 text-white self-end"
            : "bg-gray-200 text-black self-start"
        }`}
      >
        <ReactMarkdown>
          {message.content.map((text) => text.text).join(" ")}
        </ReactMarkdown>
      </div>
    );
  }
);

export default ChatMessageBubble;
