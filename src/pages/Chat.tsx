import { Button } from "@/components/ui/button";
import ChatMessageContainer from "@/components/ChatMessageContainer";
import { Input } from "@/components/ui/input";
import { ArrowUp, Search } from "lucide-react";
import { useRef, useState } from "react";
import ChatMessage from "@/interface/ChatMessage";
import { askAgent } from "@/api/chat";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import byteLogo from "@/assets/byte.png";

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchInput, setSearchInput] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const conversationIdRef = useRef<string | undefined>(undefined);

  const hasMessages = messages.length > 0;

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
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />

      <div className="relative flex-1 overflow-hidden">

        {/* ── Empty / new-chat state ── */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
          style={{
            opacity: hasMessages ? 0 : 1,
            transform: hasMessages ? "translateY(-16px)" : "translateY(0)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
            pointerEvents: hasMessages ? "none" : "auto",
          }}
        >
          {/* Gradient background */}
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              height: "50%",
              background: "linear-gradient(to bottom, #ffffff, #0078E8)",
            }}
          />

          {/* Greeting + input, centered */}
          <div className="relative flex flex-col items-center gap-6 px-8 py-6">
            <div
              className="flex flex-row items-center gap-3"
              style={{ width: "min(862px, 90vw)" }}
            >
              <img
                src={byteLogo}
                alt="Byte"
                style={{ width: "80px", height: "80px", objectFit: "contain" }}
              />
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontStyle: "normal",
                  fontWeight: 400,
                  fontSize: "24px",
                  lineHeight: "29px",
                  color: "#000000",
                }}
              >
                Hello{" "}
                <span style={{ color: "#0078E8", fontSize: "28px", fontWeight: 800 }}>
                  {user?.firstName ?? "there"}
                </span>
                , how are you today?
              </p>
            </div>

            <div
              className="rounded-2xl flex flex-row gap-2 p-4 bg-white border border-gray-300 shadow-md"
              style={{ width: "min(862px, 90vw)" }}
            >
              <Input
                placeholder="Ask Anything..."
                onKeyDown={handleKeyDown}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                disabled={isSearching}
              />
              <Button
                className="bg-white hover:bg-gray-100 flex-shrink-0"
                style={{ width: "48px", height: "48px", padding: 0 }}
                onClick={() => { if (searchInput) handleSubmit(); }}
                disabled={isSearching}
              >
                <ArrowUp size={20} color="#333333" />
              </Button>
            </div>
          </div>
        </div>

        {/* ── Active chat state ── */}
        <div
          className="absolute inset-0 flex flex-col items-center gap-4 p-4 overflow-hidden"
          style={{
            opacity: hasMessages ? 1 : 0,
            transform: hasMessages ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s",
            pointerEvents: hasMessages ? "auto" : "none",
          }}
        >
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
              className="bg-blueprint-blue-primary flex-shrink-0"
              onClick={() => { if (searchInput) handleSubmit(); }}
              disabled={isSearching}
            >
              <Search />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Chat;
