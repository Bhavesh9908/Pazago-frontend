"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  MoreHorizontal,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/hooks/use-chat-store";
import { cn } from "@/lib/utils";

export function ChatSidebar() {
  const {
    conversations,
    currentConversationId,
    createNewConversation,
    switchConversation,
    deleteConversation,
    renameConversation,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const filteredConversations = searchQuery
    ? conversations.filter(
        (conv) =>
          conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.messages.some((msg) =>
            msg.content.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : conversations;

  const handleRename = (conversationId: string, newTitle: string) => {
    if (newTitle.trim()) {
      renameConversation(conversationId, newTitle.trim());
    }
    setEditingId(null);
    setEditingName("");
  };

  const startEditing = (conversationId: string, currentTitle: string) => {
    setEditingId(conversationId);
    setEditingName(currentTitle);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getConversationPreview = (conversation: any) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (!lastMessage) return "New conversation";
    return lastMessage.content.length > 50
      ? lastMessage.content.substring(0, 36) + "..."
      : lastMessage.content;
  };

  return (
    <Sidebar variant="inset">
      {/* Header */}
      <SidebarHeader className="border-b p-4 flex flex-col gap-3">
        <Button
          onClick={createNewConversation}
          className="w-full justify-center rounded-full font-medium"
          size="sm"
        >
          <Plus className="mr-2 size-4" />
          Start New Chat
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 rounded-full"
          />
        </div>
      </SidebarHeader>

      {/* Conversation List */}
      <SidebarContent className="p-2">
        <ScrollArea className="h-full">
          <SidebarMenu className="space-y-2">
            {filteredConversations.map((conversation) => (
              <SidebarMenuItem key={conversation.id} className="list-none">
                <div
                  className={cn(
                    "relative p-3 rounded-lg border shadow-sm cursor-pointer transition hover:shadow-md hover:bg-accent/50",
                    currentConversationId === conversation.id &&
                      "bg-accent border-accent"
                  )}
                  onClick={() => switchConversation(conversation.id)}
                >
                  {editingId === conversation.id ? (
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleRename(conversation.id, editingName)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRename(conversation.id, editingName);
                        } else if (e.key === "Escape") {
                          setEditingId(null);
                          setEditingName("");
                        }
                      }}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <h5 className="font-medium text-sm truncate flex-1">
                          {conversation.title}
                        </h5>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {getConversationPreview(conversation)}
                      </p>

                      {/* Dropdown Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              startEditing(conversation.id, conversation.title)
                            }
                          >
                            <Edit3 className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteConversation(conversation.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4 border-t">
        <div className="text-xs text-muted-foreground text-center bg-accent/30 rounded-full py-1 px-3 inline-block">
          {conversations.length} Conversation
          {conversations.length !== 1 ? "s" : ""}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
