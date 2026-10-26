import { parseAgentEvent, type AgentEvent } from "@/domain/agent-event";

const MAX_LINE_BYTES = 256 * 1024;

export async function* readAgentEvents(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<AgentEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      if (new TextEncoder().encode(buffer).byteLength > MAX_LINE_BYTES) {
        throw new Error("ArcLens event exceeded the 256 KB line limit.");
      }

      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        const line = buffer.slice(0, newline).replace(/\r$/, "");
        buffer = buffer.slice(newline + 1);
        if (line.trim()) yield parseAgentEvent(JSON.parse(line));
        newline = buffer.indexOf("\n");
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      throw new Error("ArcLens stream ended with a truncated event.");
    }
  } finally {
    reader.releaseLock();
  }
}
