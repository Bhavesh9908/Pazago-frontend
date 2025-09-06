"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Download,
  Sun,
  Moon,
  MoreVertical,
  CloudSun,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/hooks/use-chat-store";
import { SidebarTrigger } from "./ui/sidebar";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const { searchMessages, exportCurrentChat } = useChatStore();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchMessages(query);
  };

  const handleExport = (format: "txt" | "json") => {
    exportCurrentChat(format);
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-gradient-to-r from-sky-500/80 via-blue-600/80 to-indigo-700/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left: Sidebar + App Title */}
        <div className="flex items-center space-x-3">
          <SidebarTrigger />
          <div className="flex items-center space-x-2 text-white font-semibold text-lg tracking-wide">
            <CloudSun className="h-6 w-6 text-yellow-300" />
            <span>Weather AI</span>
          </div>
        </div>

        {/* Right: Search + Theme Toggle + Menu */}
        <div className="flex items-center space-x-3">
          <div className="relative w-64 hidden sm:block">
            <Search className="absolute left-3 top-3 size-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 rounded-full bg-white/90 dark:bg-gray-900/70 shadow-sm focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="hover:bg-white/20 rounded-full"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-yellow-400" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-300" />
          </Button>

          {/* More options dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-white/20 rounded-full"
              >
                <MoreVertical className="h-5 w-5 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-lg shadow-lg bg-white dark:bg-gray-900"
            >
              <DropdownMenuItem onClick={() => handleExport("txt")}>
                <Download className="mr-2 h-4 w-4 text-sky-500" />
                Export as TXT
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")}>
                <Download className="mr-2 h-4 w-4 text-indigo-500" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
