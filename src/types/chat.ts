export type MessageStatus = "sending" | "sent" | "delivered" | "failed";

export interface Message {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
  status: MessageStatus;
}
