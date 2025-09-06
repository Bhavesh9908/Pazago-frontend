"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Message, MessageStatus } from "@/types/chat";

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  currentConversation: Conversation | null;
  filteredMessages: Message[];
  isLoading: boolean;
  streamingMessageId: string | null;

  // Conversation management
  createNewConversation: () => void;
  switchConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  renameConversation: (conversationId: string, newTitle: string) => void;
  searchConversations: (query: string) => Conversation[];

  // Message management
  sendMessage: (content: string) => Promise<void>;
  searchMessages: (query: string) => void;
  exportCurrentChat: (format: "txt" | "json") => void;

  // URL management
  updateURL: (conversationId: string | null) => void;
  loadFromURL: () => void;
}

const generateConversationTitle = (firstMessage: string): string => {
  const words = firstMessage.split(" ").slice(0, 6);
  return words.join(" ") + (firstMessage.split(" ").length > 6 ? "..." : "");
};

const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const updateURLSearchParams = (conversationId: string | null) => {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);

  if (conversationId) {
    url.searchParams.set("chat", conversationId);
  } else {
    url.searchParams.delete("chat");
  }

  window.history.replaceState({}, "", url.toString());
};

const getConversationIdFromURL = (): string | null => {
  if (typeof window === "undefined") return null;

  const url = new URL(window.location.href);
  return url.searchParams.get("chat");
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      currentConversation: null,
      filteredMessages: [],
      isLoading: false,
      streamingMessageId: null,

      createNewConversation: () => {
        const state = get();

        // Check if there's already an empty "New Chat" conversation
        const existingNewChat = state.conversations.find(
          (conv) => conv.title === "New Chat" && conv.messages.length === 0
        );

        if (existingNewChat) {
          // Switch to existing empty conversation instead of creating a new one
          set({
            currentConversationId: existingNewChat.id,
            currentConversation: existingNewChat,
            filteredMessages: [],
          });
          // Update URL with existing conversation ID
          updateURLSearchParams(existingNewChat.id);
          return;
        }

        const newConversation: Conversation = {
          id: generateUniqueId(),
          title: "New Chat",
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: newConversation.id,
          currentConversation: newConversation,
          filteredMessages: [],
        }));

        // Update URL with new conversation ID
        updateURLSearchParams(newConversation.id);
      },

      switchConversation: (conversationId: string) => {
        const conversation = get().conversations.find(
          (c) => c.id === conversationId
        );
        if (conversation) {
          set({
            currentConversationId: conversationId,
            currentConversation: conversation,
            filteredMessages: [],
            isLoading: false,
            streamingMessageId: null,
          });
          // Update URL with new conversation ID
          updateURLSearchParams(conversationId);
        }
      },

      deleteConversation: (conversationId: string) => {
        const state = get();
        const updatedConversations = state.conversations.filter(
          (c) => c.id !== conversationId
        );

        let newCurrentConversation = null;
        let newCurrentConversationId = null;

        if (state.currentConversationId === conversationId) {
          // If deleting current conversation, switch to the most recent one
          if (updatedConversations.length > 0) {
            newCurrentConversation = updatedConversations[0];
            newCurrentConversationId = newCurrentConversation.id;
          }
        } else {
          // Keep current conversation if it's not the one being deleted
          newCurrentConversation = state.currentConversation;
          newCurrentConversationId = state.currentConversationId;
        }

        set({
          conversations: updatedConversations,
          currentConversationId: newCurrentConversationId,
          currentConversation: newCurrentConversation,
          filteredMessages: [],
        });

        // Update URL - remove chat param if no conversations left, otherwise update with new current
        updateURLSearchParams(newCurrentConversationId);
      },

      renameConversation: (conversationId: string, newTitle: string) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, title: newTitle, updatedAt: new Date() }
              : conv
          ),
          currentConversation:
            state.currentConversationId === conversationId
              ? {
                  ...state.currentConversation!,
                  title: newTitle,
                  updatedAt: new Date(),
                }
              : state.currentConversation,
        }));
      },

      searchConversations: (query: string) => {
        const { conversations } = get();
        return conversations.filter(
          (conv) =>
            conv.title.toLowerCase().includes(query.toLowerCase()) ||
            conv.messages.some((msg) =>
              msg.content.toLowerCase().includes(query.toLowerCase())
            )
        );
      },

      sendMessage: async (content: string) => {
        let { currentConversation, currentConversationId } = get();

        // Create new conversation if none exists
        if (!currentConversation) {
          get().createNewConversation();
          const state = get();
          currentConversation = state.currentConversation!;
          currentConversationId = state.currentConversationId!;
        }

        const userMessage: Message = {
          id: generateUniqueId(),
          content,
          sender: "user",
          timestamp: new Date(),
          status: "sent",
        };

        const agentMessageId = generateUniqueId();
        const agentMessage: Message = {
          id: agentMessageId,
          content: "",
          sender: "agent",
          timestamp: new Date(),
          status: "delivered",
        };

        // Update conversation with new messages
        const updatedMessages = [
          ...currentConversation.messages,
          userMessage,
          agentMessage,
        ];
        const updatedConversation = {
          ...currentConversation,
          messages: updatedMessages,
          title:
            currentConversation.title === "New Chat"
              ? generateConversationTitle(content)
              : currentConversation.title,
          updatedAt: new Date(),
        };

        // Update state with atomic operation to prevent race conditions
        set((state) => {
          // Double-check that the conversation still exists
          const conversationExists = state.conversations.some(
            (conv) => conv.id === currentConversationId
          );

          if (!conversationExists) {
            console.warn("Conversation no longer exists, skipping update");
            return state;
          }

          return {
            conversations: state.conversations.map((conv) =>
              conv.id === currentConversationId ? updatedConversation : conv
            ),
            currentConversation: updatedConversation,
            isLoading: true,
            streamingMessageId: agentMessageId,
          };
        });

        try {
          // Update user message status to delivered
          set((state) => {
            const updatedConv = {
              ...state.currentConversation!,
              messages: state.currentConversation!.messages.map((msg) =>
                msg.id === userMessage.id
                  ? { ...msg, status: "delivered" as MessageStatus }
                  : msg
              ),
            };
            return {
              conversations: state.conversations.map((conv) =>
                conv.id === currentConversationId ? updatedConv : conv
              ),
              currentConversation: updatedConv,
            };
          });

          // Start streaming response
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: content }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("ReadableStream not supported");
          }

          const decoder = new TextDecoder();
          let accumulatedContent = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === "chunk" && data.content) {
                    accumulatedContent += data.content;

                    // Update the agent message with accumulated content
                    set((state) => {
                      // Ensure conversation still exists before updating
                      const conversation = state.conversations.find(
                        (conv) => conv.id === currentConversationId
                      );

                      if (!conversation) {
                        console.warn(
                          "Conversation no longer exists during streaming"
                        );
                        return state;
                      }

                      const updatedConv = {
                        ...state.currentConversation!,
                        messages: state.currentConversation!.messages.map(
                          (msg) =>
                            msg.id === agentMessageId
                              ? { ...msg, content: accumulatedContent }
                              : msg
                        ),
                        updatedAt: new Date(),
                      };
                      return {
                        conversations: state.conversations.map((conv) =>
                          conv.id === currentConversationId ? updatedConv : conv
                        ),
                        currentConversation: updatedConv,
                      };
                    });
                  } else if (data.type === "complete") {
                    set({
                      isLoading: false,
                      streamingMessageId: null,
                    });
                  } else if (data.type === "error") {
                    set((state) => {
                      const updatedConv = {
                        ...state.currentConversation!,
                        messages: state.currentConversation!.messages.map(
                          (msg) =>
                            msg.id === agentMessageId
                              ? { ...msg, content: data.content }
                              : msg
                        ),
                        updatedAt: new Date(),
                      };
                      return {
                        conversations: state.conversations.map((conv) =>
                          conv.id === currentConversationId ? updatedConv : conv
                        ),
                        currentConversation: updatedConv,
                        isLoading: false,
                        streamingMessageId: null,
                      };
                    });
                  }
                } catch (parseError) {
                  console.error("Failed to parse streaming data:", parseError);
                }
              }
            }
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          console.error("Failed to send message:", error);

          // Update agent message with error
          set((state) => {
            const updatedConv = {
              ...state.currentConversation!,
              messages: state.currentConversation!.messages.map((msg) =>
                msg.id === agentMessageId
                  ? {
                      ...msg,
                      content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
                    }
                  : msg
              ),
              updatedAt: new Date(),
            };
            return {
              conversations: state.conversations.map((conv) =>
                conv.id === currentConversationId ? updatedConv : conv
              ),
              currentConversation: updatedConv,
              isLoading: false,
              streamingMessageId: null,
            };
          });

          // Update user message status to failed
          set((state) => {
            const updatedConv = {
              ...state.currentConversation!,
              messages: state.currentConversation!.messages.map((msg) =>
                msg.id === userMessage.id
                  ? { ...msg, status: "failed" as MessageStatus }
                  : msg
              ),
            };
            return {
              conversations: state.conversations.map((conv) =>
                conv.id === currentConversationId ? updatedConv : conv
              ),
              currentConversation: updatedConv,
            };
          });
        }
      },

      searchMessages: (query: string) => {
        const { currentConversation } = get();
        if (!currentConversation) {
          set({ filteredMessages: [] });
          return;
        }

        if (!query.trim()) {
          set({ filteredMessages: [] });
          return;
        }

        const filtered = currentConversation.messages.filter((message) =>
          message.content.toLowerCase().includes(query.toLowerCase())
        );

        set({ filteredMessages: filtered });
      },

      exportCurrentChat: (format: "txt" | "json") => {
        const { currentConversation } = get();
        if (!currentConversation) return;

        if (format === "txt") {
          const content = currentConversation.messages
            .map(
              (msg) =>
                `[${msg.timestamp.toLocaleString()}] ${msg.sender}: ${
                  msg.content
                }`
            )
            .join("\n");

          downloadFile(
            content,
            `${currentConversation.title}.txt`,
            "text/plain"
          );
        } else {
          const content = JSON.stringify(currentConversation, null, 2);
          downloadFile(
            content,
            `${currentConversation.title}.json`,
            "application/json"
          );
        }
      },

      // URL management functions
      updateURL: (conversationId: string | null) => {
        updateURLSearchParams(conversationId);
      },

      loadFromURL: () => {
        const urlConversationId = getConversationIdFromURL();
        if (urlConversationId) {
          const state = get();
          const conversation = state.conversations.find(
            (c) => c.id === urlConversationId
          );
          if (
            conversation &&
            state.currentConversationId !== urlConversationId
          ) {
            // Switch to the conversation from URL if it exists and isn't already current
            get().switchConversation(urlConversationId);
          }
        }
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
      }),

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: (persistedState: any) => {
        if (persistedState?.conversations) {
          // Remove duplicate conversations based on title and creation time
          const uniqueConversations = persistedState.conversations.filter(
            (conv: Conversation, index: number, arr: Conversation[]) => {
              return (
                arr.findIndex(
                  (c) =>
                    c.title === conv.title &&
                    Math.abs(
                      new Date(c.createdAt).getTime() -
                        new Date(conv.createdAt).getTime()
                    ) < 1000
                ) === index
              );
            }
          );

          return {
            ...persistedState,
            conversations: uniqueConversations,
          };
        }
        return persistedState;
      },
    }
  )
);

function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
