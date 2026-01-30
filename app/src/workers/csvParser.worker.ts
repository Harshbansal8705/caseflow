import Papa from "papaparse";

interface ParseMessage {
  type: "parse";
  file: File;
}

interface ParseResult {
  type: "progress" | "complete" | "error";
  progress?: number;
  data?: Record<string, string>[];
  headers?: string[];
  error?: string;
}

self.onmessage = async (event: MessageEvent<ParseMessage>) => {
  const { type, file } = event.data;

  if (type === "parse") {
    const results: Record<string, string>[] = [];
    let headers: string[] = [];
    let rowCount = 0;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      chunk: (chunk) => {
        if (headers.length === 0 && chunk.meta.fields) {
          headers = chunk.meta.fields;
        }

        results.push(...(chunk.data as Record<string, string>[]));
        rowCount += chunk.data.length;

        // Send progress updates every 1000 rows
        if (rowCount % 1000 === 0) {
          const progress = Math.min((rowCount / 50000) * 100, 99);
          self.postMessage({
            type: "progress",
            progress,
          } as ParseResult);
        }
      },
      complete: () => {
        self.postMessage({
          type: "complete",
          data: results,
          headers,
        } as ParseResult);
      },
      error: (error) => {
        self.postMessage({
          type: "error",
          error: error.message,
        } as ParseResult);
      },
    });
  }
};

export { };
