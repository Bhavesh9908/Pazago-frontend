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

async function callWeatherAgent(message: string) {
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
    threadId: 2,
    resourceId: "weatherAgent",
  };

  try {
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // If needed: live output (Node only)
      // process.stdout.write(chunk);
    }

    buffer += decoder.decode();

    const parsed = parseMastraStream(buffer);

    console.log(parsed.text);
  } catch (err: any) {
    console.error("❌ Stream error:", err.message || err);
  }
}

function parseMastraStream(raw: string) {
  const lines = raw.trim().split("\n");
  const messages: Record<string, any>[] = [];
  const finalTextTokens: string[] = [];

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const prefix = line.slice(0, colonIndex);
    const data = line.slice(colonIndex + 1);

    try {
      const parsed = JSON.parse(data);

      if (prefix === "0") {
        finalTextTokens.push(parsed);
      } else if (prefix === "a") {
        messages.push({ type: "tool-result", data: parsed.result });
      } else if (["f", "e", "d"].includes(prefix)) {
        messages.push({ type: "meta", data: parsed });
      } else if (prefix === "9") {
        messages.push({ type: "tool-call", data: parsed });
      }
    } catch (err) {
      console.error("❌ Failed to parse line:", line, err);
    }
  }

  const finalText = finalTextTokens.join("");

  return {
    messages,
    text: finalText,
  };
}

// ✅ Run it
callWeatherAgent("what is the weather in Mumbai");
