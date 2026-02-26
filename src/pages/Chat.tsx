import { Button } from "@/components/ui/button";
import ChatMessageContainer from "@/components/ChatMessageContainer";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import ChatMessage from "@/interface/ChatMessage";
import { useApi } from "@/api/useApi";
import { executeConverseStream } from "@/api/chat";
import { Navbar } from "@/components/Navbar";

const Chat = () => {
  const { withAuthStream } = useApi();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchInput, setSearchInput] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput) {
      handleSubmit();
    }
  };

  const addUserMessage = () => {
    const userMessage: ChatMessage = {
      role: "user",
      content: [{ text: searchInput }],
    };
    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: "assistant", content: [{ text: "" }] },
    ]);
  };

  const handleSubmit = () => {
    addUserMessage();
    handleSearch();
    setSearchInput("");
  };

  const handleSearch = async () => {
    setIsSearching(true);

    const command = {
      modelId: "anthropic.claude-3-haiku-20240307-v1:0",
      messages: [
        ...messages,
        { role: "user", content: [{ text: searchInput }] },
      ],
      system: [
        {
          text: "You are a conversational AI agent to assist the user.",
        },
      ],
      inferenceConfig: {
        maxTokens: 4096,
        temperature: 0.5,
      },
      additionalModelRequestFields: {},
    };

    try {
      const stream = withAuthStream(() => executeConverseStream(command));

      for await (const chunk of stream) {
        setMessages((prev) =>
          prev.map((m, i) => {
            if (i !== prev.length - 1) return m;

            const newText =
              chunk.type === "text" ? chunk.text : chunk.reasoning;

            const updatedContent =
              m.content?.length > 0
                ? m.content.map((c, idx) =>
                    idx === 0 ? { ...c, text: c.text + newText } : c,
                  )
                : [{ text: newText }];

            return { ...m, content: updatedContent };
          }),
        );
      }
    } catch (error) {
      console.log(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: [{ text: "An error occurred. Please try again." }],
        },
      ]);
    }
    setIsSearching(false);
  };

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden">
        <Navbar />

        <div className="flex flex-col flex-1 justify-end items-center gap-4 p-4 overflow-hidden">
          <ChatMessageContainer messages={messages} />

          <div className="w-1/2 rounded-2xl flex flex-row gap-2 p-4 bg-sky-100 flex-shrink-0">
            <Input
              placeholder="Ask Anything..."
              onKeyDown={handleKeyDown}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={isSearching}
            />
            <Button
              className="bg-blueprint-blue-primary"
              onClick={() => {
                if (searchInput) {
                  handleSubmit();
                }
              }}
              disabled={isSearching}
            >
              <Search />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;
