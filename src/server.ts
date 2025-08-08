import { FastMCP } from "fastmcp";
import { z } from "zod";

import { performSearch } from "./search.js";

const server = new FastMCP({
  name: "Web Search",
  version: "1.0.0",
});

server.addTool({
  description: "Search the web using Google (no API key required)",
  execute: async (args) => {
    const results = await performSearch(args.query, args.limit ?? 5);
    return JSON.stringify(results, null, 2);
  },
  name: "search",
  parameters: z.object({
    limit: z
      .number()
      .min(1)
      .max(10)
      .optional()
      .default(5)
      .describe("Maximum number of results to return (default: 5)"),
    query: z.string().describe("Search query"),
  }),
});

server.start({
  transportType: "stdio",
});
