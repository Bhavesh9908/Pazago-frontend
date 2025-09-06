"use client";

import { ChatContainer } from "@/components/chat-container";
import { Header } from "@/components/header";
import { SidebarInset } from "@/components/ui/sidebar";
import { use } from "react";

type PageProps = {
  searchParams: Promise<{ chat: string }>;
};

export default function Home(props: PageProps) {
  const searchParams = use(props.searchParams);

  return (
    <div className="flex h-screen w-full bg-background">
      <SidebarInset className="">
        <Header />
        <ChatContainer searchparam={searchParams.chat} />
      </SidebarInset>
    </div>
  );
}
