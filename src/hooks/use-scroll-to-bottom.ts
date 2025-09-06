"use client";

import type React from "react";

import { useEffect } from "react";
import type { Message } from "@/types/chat";

export function useScrollToBottom(
  ref: React.RefObject<HTMLElement | null>,
  dependency: Message[]
) {
  useEffect(() => {
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [dependency, ref]);
}
