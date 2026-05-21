import { Button } from "@/components/ui/button";
import ChatMessageContainer from "@/components/ChatMessageContainer";
import { Input } from "@/components/ui/input";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ChatMessage from "@/interface/ChatMessage";
import { streamAgent } from "@/api/chat";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import byteLogo from "@/assets/byte.png";
import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";

interface Conversation {
  conversationId: string;
  title: string;
  updatedAt: string;
}

const Chat = () => {
  const { user } = useAuth();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchInput, setSearchInput] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLoadingConversations, setIsLoadingConversations] =
    useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [sidebarState, setSidebarState] = useState<"full" | "collapsed">("full");
  const currentConversationIdRef = useRef<string | undefined>(conversationId);

  const hasActiveConversation = Boolean(
    conversationId ?? currentConversationIdRef.current
  );
  const CHAT_HISTORY_API_URL = import.meta.env.VITE_CHAT_HISTORY_API_URL;

  // Load conversations on mount
  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id]);

  // Load conversation messages when conversationId changes
  useEffect(() => {
    if (conversationId && user?.id) {
      loadConversationMessages(conversationId);
      currentConversationIdRef.current = conversationId;
    } else if (!conversationId) {
      setMessages([]);
      currentConversationIdRef.current = undefined;
    }
  }, [conversationId, user?.id]);

  const loadConversations = async () => {
    if (!user?.id) return;

    setIsLoadingConversations(true);
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();

      const response = await axios.get(
        `${CHAT_HISTORY_API_URL}/conversations?userId=${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      const convs = (response.data || []).sort(
        (a: Conversation, b: Conversation) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setConversations(convs);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadConversationMessages = async (convId: string) => {
    if (!user?.id) return;

    setIsLoadingMessages(true);
    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      const response = await axios.get(
        `${CHAT_HISTORY_API_URL}/conversations/${convId}?userId=${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      const thread = response.data;

      // Parse turns into messages
      const msgs: ChatMessage[] = [];
      if (thread.turns && Array.isArray(thread.turns)) {
        for (const turn of thread.turns) {
          if (turn.messages?.user?.content) {
            msgs.push({
              role: "user",
              content: [{ text: turn.messages.user.content }],
            });
          }
          if (turn.messages?.assistant?.content) {
            msgs.push({
              role: "assistant",
              content: [{ text: turn.messages.assistant.content }],
            });
          }
        }
      }
      if (currentConversationIdRef.current === convId) {
        setMessages(msgs);
      }
    } catch (error) {
      console.error("Failed to load conversation messages:", error);
      if (currentConversationIdRef.current === convId) {
        setMessages([]);
      }
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const createNewConversation = async (initialMessage: string) => {
    if (!user?.id || !initialMessage.trim()) return;

    try {
      setIsSearching(true);
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      const response = await axios.post(
        `${CHAT_HISTORY_API_URL}/conversations?userId=${user.id}`,
        {
          initialMessage,
          title: initialMessage.substring(0, 50) || "New Conversation",
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      const newConv = response.data;
      currentConversationIdRef.current = newConv.conversationId;

      setMessages([
        { role: "user", content: [{ text: initialMessage }] },
        { role: "assistant", content: [{ text: "" }] },
      ]);

      // Stream response first to persist the turn, then navigate
      await streamResponse(initialMessage, newConv.conversationId, user.id);
      await loadConversations();

      // Navigate after turn is persisted so useEffect loads the correct messages
      navigate(`/conversations/${newConv.conversationId}`);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      setSearchInput("");
      setIsSearching(false);
    }
  };

  const addMessageToConversation = async (prompt: string) => {
    if (!user?.id || !currentConversationIdRef.current || !prompt.trim()) return;

    try {
      setIsSearching(true);

      setMessages((prev) => [
        ...prev,
        { role: "user", content: [{ text: prompt }] },
        { role: "assistant", content: [{ text: "" }] },
      ]);

      await streamResponse(prompt, currentConversationIdRef.current, user.id);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) =>
        prev.map((m, i) =>
          i === prev.length - 1
            ? { ...m, content: [{ text: "An error occurred. Please try again." }] }
            : m
        )
      );
      setIsSearching(false);
    }
  };

  const streamResponse = async (prompt: string, convId: string, uid: string) => {
    try {
      let assistantContent = "";

      for await (const event of streamAgent({
        prompt,
        conversationId: convId,
        userId: uid,
      })) {
        if (event.type === "token") {
          assistantContent += event.text;
          if (currentConversationIdRef.current === convId) {
            setMessages((prev) =>
              prev.map((m, i) =>
                i === prev.length - 1
                  ? { ...m, content: [{ text: assistantContent }] }
                  : m
              )
            );
          }
        }
      }

      if (currentConversationIdRef.current === convId) {
        await loadConversations();
      }
    } catch (error) {
      console.error("Stream error:", error);
      if (currentConversationIdRef.current === convId) {
        setMessages((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1
              ? { ...m, content: [{ text: "An error occurred. Please try again." }] }
              : m
          )
        );
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchInput && !isSearching) {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const prompt = searchInput;
    setSearchInput("");

    if (!hasActiveConversation) {
      createNewConversation(prompt);
    } else {
      addMessageToConversation(prompt);
    }
  };

  const handleDeleteConversation = (deletedConvId: string) => {
    setConversations((prevConvs) =>
      prevConvs.filter((c) => c.conversationId !== deletedConvId)
    );

    if (currentConversationIdRef.current === deletedConvId) {
      navigate("/");
      setMessages([]);
      setSearchInput("");
    }
  };

  const handleNewChat = () => {
    navigate("/");
    setMessages([]);
    setSearchInput("");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        onNewChat={handleNewChat}
        onToggleSidebar={() => setSidebarState(sidebarState === "full" ? "collapsed" : "full")}
        onDeleteConversation={handleDeleteConversation}
        isCollapsed={sidebarState === "collapsed"}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <div className="relative flex-1 overflow-hidden">
          {/* Welcome Screen */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
            style={{
              opacity: hasActiveConversation ? 0 : 1,
              transform: hasActiveConversation ? "translateY(-16px)" : "translateY(0)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
              pointerEvents: hasActiveConversation ? "none" : "auto",
            }}
          >
            <div
              className="absolute bottom-0 left-0 right-0 pointer-events-none"
              style={{
                height: "50%",
                background: "linear-gradient(to bottom, #ffffff, #0078E8)",
              }}
            />
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
                <p className="font-body text-2xl font-normal leading-relaxed text-black">
                  Hi{" "}
                  <span className="text-[#0078e8] font-bold text-3xl">
                    {user?.firstName ?? "there"}
                  </span>
                  , how are you today?
                </p>
              </div>

              <div
                className="rounded-[20px] flex flex-row gap-2 p-4 bg-white shadow-[2px_4px_10px_rgba(0,0,0,0.38)] w-full max-w-[804px]"
                style={{ width: "100%", minWidth: "320px", maxWidth: "700px", height: "88px", marginBottom: "24px" }}
              >
                <Input
                  placeholder="Ask Anything..."
                  onKeyDown={handleKeyDown}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  disabled={isSearching || isLoadingConversations}
                  className="border-0 focus-visible:ring-0"
                />
                <Button
                  className="bg-white hover:bg-white flex-shrink-0 text-black"
                  style={{ width: "48px", height: "48px", padding: 0 }}
                  onClick={() => {
                    if (searchInput) handleSubmit();
                  }}
                  disabled={isSearching || isLoadingConversations}
                >
                  <ArrowUp size={20} />
                </Button>
              </div>
            </div>
          </div>

          {/* Chat Screen */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-between gap-4 p-4 overflow-hidden"
            style={{
              opacity: hasActiveConversation ? 1 : 0,
              transform: hasActiveConversation ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s",
              pointerEvents: hasActiveConversation ? "auto" : "none",
            }}
          >
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full w-full">
                <p className="text-body-md text-gray-500">Loading conversation...</p>
              </div>
            ) : (
              <>
                <ChatMessageContainer messages={messages} />

                <div className="rounded-[20px] flex flex-row gap-2 p-4 bg-white shadow-[2px_4px_10px_rgba(0,0,0,0.38)] flex-shrink-0 full-w max-w-[800px]" style={{ width: "100%", minWidth: "320px", maxWidth: "800px", height: "88px", marginBottom: "24px" }}>
                  <Input
                    placeholder="Ask Anything..."
                    onKeyDown={handleKeyDown}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    disabled={isSearching}
                    className="border-0 focus-visible:ring-0"
                  />
                  <Button
                    className="bg-[#0078e8] hover:bg-blue-700 text-white flex-shrink-0"
                    onClick={() => {
                      if (searchInput) handleSubmit();
                    }}
                    disabled={isSearching}
                  >
                    <ArrowUp size={20} />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
