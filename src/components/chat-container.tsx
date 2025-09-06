"use client";

import { useRef, useEffect } from "react";
import { MessageItem } from "@/components/message-item";
import { InputBar } from "@/components/input-bar";
import { useChatStore } from "@/hooks/use-chat-store";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatContainer({ searchparam }: { searchparam: string | null }) {
  const {
    currentConversation,
    filteredMessages,
    createNewConversation,
    switchConversation,
    conversations,
    loadFromURL,
  } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle URL search parameter for conversation loading
  useEffect(() => {
    if (searchparam) {
      // Check if the conversation exists in our store
      const targetConversation = conversations.find(
        (conv) => conv.id === searchparam
      );

      if (targetConversation) {
        // If conversation exists and it's not already current, switch to it
        if (currentConversation?.id !== searchparam) {
          switchConversation(searchparam);
        }
      } else {
        // If conversation doesn't exist, create a new one
        // This handles cases where URL has invalid conversation ID
        createNewConversation();
      }
    } else {
      // If no search param, load from URL (in case there's a ?chat= param)
      loadFromURL();

      // If still no current conversation after loading from URL, create new one
      if (!currentConversation) {
        createNewConversation();
      }
    }
  }, [
    searchparam,
    conversations,
    currentConversation,
    switchConversation,
    createNewConversation,
    loadFromURL,
  ]);

  // Fallback: Create new conversation if none exists
  useEffect(() => {
    if (!currentConversation && conversations.length === 0) {
      createNewConversation();
    }
  }, [currentConversation, conversations.length, createNewConversation]);

  const messages = currentConversation?.messages || [];
  const displayMessages =
    filteredMessages.length > 0 ? filteredMessages : messages;

  useScrollToBottom(messagesEndRef, displayMessages);

  if (!currentConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex justify-center flex-1 px-4">
        <ScrollArea className="w-full max-w-4xl">
          <div className="space-y-4 py-4">
            {displayMessages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>
      <InputBar />
    </div>
  );
}
