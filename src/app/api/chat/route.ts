import type { NextRequest } from "next/server";

interface Message {
  role: "user" | "system" | "assistant";
  content: string;
}

interface RequestBody {
  messages: Message[];
  runId: string;
  maxRetries: number;
  maxSteps: number;
  temperature: number;
  topP: number;
  runtimeContext: Record<string, any>;
  threadId: number;
  resourceId: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    // Create a ReadableStream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamWeatherAgent(message, controller);
        } catch (error: any) {
          console.error("Stream error:", error);
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: "error",
                content: `Sorry, I encountered an error: ${error.message}`,
                timestamp: new Date().toISOString(),
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return Response.json(
      { error: "Failed to process message", details: error.message },
      { status: 500 }
    );
  }
}

async function streamWeatherAgent(
  message: string,
  controller: ReadableStreamDefaultController
) {
  const payload: RequestBody = {
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
    runId: "weatherAgent",
    maxRetries: 2,
    maxSteps: 5,
    temperature: 0.5,
    topP: 1,
    runtimeContext: {},
    threadId: Vu4f2122023,
    resourceId: "weatherAgent",
  };

  const response = await fetch(
    "https://millions-screeching-vultur.mastra.cloud/api/agents/weatherAgent/stream",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-mastra-dev-playground": "true",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("ReadableStream not supported.");

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  // Send initial message to indicate streaming started
  controller.enqueue(
    new TextEncoder().encode(
      `data: ${JSON.stringify({
        type: "start",
        content: "",
        timestamp: new Date().toISOString(),
      })}\n\n`
    )
  );

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    // Process complete lines from buffer
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        const parsedChunk = parseMastraStreamLine(line);
        if (parsedChunk) {
          // Stream each token/chunk to the client
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                type: "chunk",
                content: parsedChunk,
                timestamp: new Date().toISOString(),
              })}\n\n`
            )
          );
        }
      }
    }
  }

  // Process any remaining buffer
  if (buffer.trim()) {
    const parsedChunk = parseMastraStreamLine(buffer);
    if (parsedChunk) {
      controller.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({
            type: "chunk",
            content: parsedChunk,
            timestamp: new Date().toISOString(),
          })}\n\n`
        )
      );
    }
  }

  // Send completion message
  controller.enqueue(
    new TextEncoder().encode(
      `data: ${JSON.stringify({
        type: "complete",
        content: "",
        timestamp: new Date().toISOString(),
      })}\n\n`
    )
  );
}

function parseMastraStreamLine(line: string): string | null {
  const colonIndex = line.indexOf(":");
  if (colonIndex === -1) return null;

  const prefix = line.slice(0, colonIndex);
  const data = line.slice(colonIndex + 1);

  try {
    const parsed = JSON.parse(data);

    // Only return text tokens (prefix "0")
    if (prefix === "0") {
      return parsed;
    }

    // You can handle other prefixes here if needed
    // "a" = tool-result, "f"/"e"/"d" = meta, "9" = tool-call

    return null;
  } catch (err) {
    console.error("❌ Failed to parse line:", line, err);
    return null;
  }
}
