import { Link, useLocation } from "react-router-dom";
import { Plus, LogOut, PanelLeft, SquarePen, MoreVertical, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";

interface Conversation {
  conversationId: string;
  title: string;
  updatedAt: string;
}

interface SidebarProps {
  conversations: Conversation[];
  onNewChat: () => void;
  onToggleSidebar: () => void;
  onDeleteConversation?: (conversationId: string) => void;
  isCollapsed?: boolean;
}

export function Sidebar({
  conversations,
  onNewChat,
  onToggleSidebar,
  onDeleteConversation,
  isCollapsed = false,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const currentConversationId = location.pathname.includes("/conversations/")
    ? location.pathname.split("/conversations/")[1]
    : null;

  const CHAT_HISTORY_API_URL = import.meta.env.VITE_CHAT_HISTORY_API_URL;

  const handleDeleteConversation = async (convId: string) => {
    if (!user?.id) return;

    try {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();

      await axios.delete(
        `${CHAT_HISTORY_API_URL}/conversations/${convId}?userId=${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      setMenuOpen(null);

      // Call the callback to update parent state
      if (onDeleteConversation) {
        onDeleteConversation(convId);
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  return (
    <div
      className="bg-[#0078e8] flex flex-col overflow-hidden relative transition-all duration-300 ease-out h-screen"
      style={{
        width: isCollapsed ? "70px" : "229px",
        minWidth: isCollapsed ? "60px" : "229px",
      }}
    >
      {/* Header with Logo and Close Button */}
      <div className="flex items-center justify-between p-4">
        {/* Logo - hidden when collapsed */}
        {!isCollapsed && (
          <img
            src="/static/white_bp_logo.png"
            alt="Blueprint"
            className="w-6 h-6"
          />
        )}
        
        {/* Sidebar Menu Button */}
        <Button
          variant="link"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="text-white hover:bg-white/20"
        >
          <PanelLeft size={18}/>
        </Button>
      </div>

      {/* Content - hidden when collapsed */}
      {isCollapsed ? (
        <div className="p-3 space-y-4 flex flex-col items-center">
          {/* New Chat Icon Button */}
          <Button
            onClick={onNewChat}
            aria-label="New chat"
            className="text-white bg-transparent hover:bg-white hover:text-[#0078e8] hover:border-[#0078e8] p-0 transition-all"
            size="icon"
          >
            <SquarePen size={18} />
          </Button>
        </div>
      ) : (
        <>
          {/* New Chat Button */}
          <div className="p-4 space-y-4">
            <Button
              onClick={onNewChat}
              className="w-full bg-white text-[#0078e8] hover:bg-gray-100 text-sm font-medium flex items-center gap-2 justify-start"
            >
              <Plus size={18} />
              <span>New chat</span>
            </Button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <p className="text-caption font-medium text-white/70 mb-3 uppercase">
              Your chats
            </p>
            <div className="space-y-2">
              {conversations.length > 0 ? (
                conversations.map((conv) => (
                  <div
                    key={conv.conversationId}
                    className="relative group"
                    onMouseLeave={() => setMenuOpen(null)}
                  >
                    <Link
                      to={`/conversations/${conv.conversationId}`}
                      className={`block p-2 rounded-md text-body-sm text-white truncate transition-colors ${
                        currentConversationId === conv.conversationId
                          ? "bg-white/10"
                          : "hover:bg-white/10"
                      }`}
                    >
                      <span className="group-hover:opacity-50 transition-opacity">
                        {conv.title}
                      </span>
                    </Link>

                    {/* Menu Button - visible on hover */}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Conversation actions for ${conv.title}`}
                      aria-expanded={menuOpen === conv.conversationId}
                      onClick={(e) => {
                        e.preventDefault();
                        setMenuOpen(menuOpen === conv.conversationId ? null : conv.conversationId);
                      }}
                      className="absolute right-2 top-2 h-6 w-6 hidden group-hover:flex group-focus-within:flex text-white hover:bg-white/20"
                    >
                      <MoreVertical size={16} />
                    </Button>

                    {/* Delete Menu - shows when menu button clicked */}
                    {menuOpen === conv.conversationId && (
                      <div className="absolute right-0 top-8 bg-white rounded-md shadow-lg z-50">
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteConversation(conv.conversationId);
                          }}
                          className="w-full justify-start px-3 py-2 text-red-500 hover:bg-red-50 text-sm flex items-center gap-2 rounded-md"
                          variant="ghost"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-caption text-white/50 italic">No conversations yet</p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="mx-2 h-px bg-white/20" />

          {/* User Profile */}
          <div className="p-4 space-y-3">
            <div className="space-y-1">
              <p className="text-body-md font-medium text-white">
                {user?.firstName || "User"}
              </p>
              <p className="text-caption text-white/70">
                {user?.email || ""}
              </p>
            </div>

            {/* Logout Button */}
            <Button
              onClick={() => logout()}
              aria-label="Sign out"
              className="w-full bg-white/10 text-white hover:bg-white/20 text-xs flex items-center gap-2 justify-center"
            >
              <LogOut size={14} />
              <span>Sign out</span>
            </Button>
          </div>
        </>
      )}

      {/* Collapsed state - logout icon button at bottom */}
      {isCollapsed && (
        <div className="mt-auto p-3 flex justify-center">
          <Button
            onClick={() => logout()}
            className="text-white bg-transparent hover:bg-white hover:text-red-500 hover:border-red-500 p-0 transition-all"
            size="icon"
          >
            <LogOut size={18} />
          </Button>
        </div>
      )}
    </div>
  );
}
