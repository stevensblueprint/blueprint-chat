import { Button } from "@/components/ui/button";
import ChatMessageContainer from "@/components/ChatMessageContainer";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useRef, useState } from "react";
import ChatMessage from "@/interface/ChatMessage";
import { askAgent } from "@/api/chat";
import { Navbar } from "@/components/Navbar";

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchInput, setSearchInput] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const conversationIdRef = useRef<string | undefined>(undefined);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const prompt = searchInput;
    setSearchInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: [{ text: prompt }] },
      { role: "assistant", content: [{ text: "" }] },
    ]);
    handleSearch(prompt);
  };

  const handleSearch = async (prompt: string) => {
    setIsSearching(true);

    try {
      const { response, conversationId } = await askAgent({
        prompt,
        conversationId: conversationIdRef.current,
      });

      conversationIdRef.current = conversationId;

      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1
            ? { ...m, content: [{ text: response }] }
            : m,
        ),
      );
    } catch (error) {
      console.log(error);
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1
            ? { ...m, content: [{ text: "An error occurred. Please try again." }] }
            : m,
        ),
      );
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
