"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Loader2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChatStore } from "@/hooks/use-chat-store";

interface InputBarProps {
  suggestedText?: string;
  onSuggestedTextUsed?: () => void;
}

export function InputBar({
  suggestedText,
  onSuggestedTextUsed,
}: InputBarProps = {}) {
  const [input, setInput] = useState("");
  const { sendMessage, isLoading } = useChatStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle suggested text
  useEffect(() => {
    if (suggestedText) {
      setInput(suggestedText);
      onSuggestedTextUsed?.();

      // Focus and move cursor to end
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          suggestedText.length,
          suggestedText.length
        );
      }
    }
  }, [suggestedText, onSuggestedTextUsed]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await sendMessage(message);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="bg-transparent sticky bottom-0 z-10">
      <div className="flex items-end bg-background rounded-lg max-w-4xl mx-auto border p-2">
        <Textarea
          name="search-input"
          ref={textareaRef}
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about weather..."
          disabled={isLoading}
          className="flex-1 min-h-[44px] max-h-36 p-3 resize-none border-0 focus:ring-0 focus:outline-none"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          size="icon"
          className="ml-2 cursor-pointer size-10 rounded-full flex items-center justify-center"
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ArrowUpRight className="size-6" />
          )}
        </Button>
      </div>
      <div className="h-4 w-full bg-background"></div>
    </div>
  );
}
