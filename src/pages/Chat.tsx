import { Button } from "@/components/ui/button";
import ChatMessageContainer from "@/components/ChatMessageContainer";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

const Chat = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSearch = () => {
    setIsSearching(true);
  };

  return (
    <>
      <div className="flex flex-col h-screen">
        <div className="flex flex-row gap-3 items-center p-4">
          <img src="/src/assets/bp_logo.png" className="size-8" />
          <p className="text-3xl font-medium">Chat</p>
        </div>
        <div className="flex-1 flex flex-col items-center gap-4 h-full pb-8">
          <ChatMessageContainer />
          <div className="w-1/2 rounded-2xl flex flex-row gap-2 p-4 bg-sky-100">
            <Input
              placeholder="Ask Anything..."
              onKeyDown={handleKeyDown}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={isSearching}
            />
            <Button
              className="bg-blueprint-blue-primary"
              onClick={handleSearch}
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
