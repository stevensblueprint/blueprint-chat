import { Button } from "@/components/ui/button";
import ChatMessageContainer from "@/components/ChatMessageContainer";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { sendMessage } from "@/api/chat";
import ChatMessage from "@/interface/ChatMessage";

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchInput, setSearchInput] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const addUserMessage = () => {
    const userMessage: ChatMessage = { role: "user", message: searchInput };
    setMessages((prev) => [...prev, userMessage]);
  };

  const handleSubmit = () => {
    addUserMessage();
    handleSearch();
    setSearchInput("");
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const response = await sendMessage(searchInput);
      const responseMessage = response.data.response;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", message: responseMessage },
      ]);
    } catch (error) {
      console.log(error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", message: "An error occurred. Please try again." },
      ]);
    }
    setIsSearching(false);
  };

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="flex flex-row gap-3 items-center p-4 flex-shrink-0">
          <img src="/src/assets/bp_logo.png" className="h-8 w-8" />
          <p className="text-3xl font-medium">Chat</p>
        </div>

        {/* Messages and Input */}
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
              onClick={handleSubmit}
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
