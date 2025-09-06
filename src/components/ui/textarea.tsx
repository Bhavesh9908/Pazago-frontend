import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-none placeholder:text-muted-foreground focus:outline-none outline-none focus:ring-0 ring-0 focus:border-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent dark:bg-input/30 px-3 py-2 text-base shadow-none transition-[color,box-shadow] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus:outline-none focus:ring-0 focus:border-transparent shadow-none transition-none",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
