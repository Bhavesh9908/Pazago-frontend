"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { MessageStatus } from "@/types/chat";
import { useChatStore } from "@/hooks/use-chat-store";

interface MessageItemProps {
  message: {
    id: string;
    content: string;
    sender: "user" | "agent";
    timestamp: Date;
    status: MessageStatus;
  };
}

export const MessageItem = memo(function MessageItem({
  message,
}: MessageItemProps) {
  const { isLoading, streamingMessageId } = useChatStore();

  const isUser = message.sender === "user";
  const isCurrentlyStreaming = streamingMessageId === message.id;

  return (
    <div
      className={cn(
        "flex w-full animate-in slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] sm:max-w-[70%] rounded-lg rounded-tr-xs px-4 py-2",
          isUser ? "bg-muted text-primary ml-4 border" : "mr-4"
        )}
      >
        <div className="break-words whitespace-pre-wrap">
          {message.content}
          {!isUser && isCurrentlyStreaming && isLoading && (
            <span className="inline-block w-0.5 h-4 bg-primary rounded-full ml-1 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
});
