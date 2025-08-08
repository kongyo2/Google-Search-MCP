import { FastMCP } from "fastmcp";
import { z } from "zod";

import { performSearch, SearchOptions } from "./search.js";

const server = new FastMCP({
  name: "Enhanced Web Search",
  version: "2.0.0",
  instructions: `This server provides enhanced Google search capabilities with advanced anonymization and anti-detection features.

Key features:
- Realistic browser fingerprinting with rotating user agents
- Advanced request anonymization to avoid detection
- Multiple result parsing strategies for reliability
- Configurable search parameters (language, region, time range, safe search)
- Built-in rate limiting and retry logic
- Error handling for various Google response scenarios

The search tool is designed to be robust and avoid common blocking mechanisms used by search engines.`,
});

server.addTool({
  name: "search",
  description: "Search the web using Google with enhanced anonymization and anti-detection features. Supports advanced filtering options.",
  parameters: z.object({
    query: z.string().describe("Search query to execute"),
    limit: z
      .number()
      .min(1)
      .max(10)
      .optional()
      .default(5)
      .describe("Maximum number of results to return (1-10, default: 5)"),
    language: z
      .string()
      .optional()
      .describe("Language code for results (e.g., 'en', 'es', 'fr', 'de', 'ja')"),
    region: z
      .string()
      .optional()
      .describe("Region code for localized results (e.g., 'us', 'uk', 'ca', 'au')"),
    safeSearch: z
      .enum(["off", "moderate", "strict"])
      .optional()
      .describe("Safe search filter level"),
    timeRange: z
      .enum(["hour", "day", "week", "month", "year"])
      .optional()
      .describe("Time range filter for recent results"),
  }),
  annotations: {
    title: "Enhanced Web Search",
    readOnlyHint: true,
    openWorldHint: true,
  },
  execute: async (args, { log }) => {
    try {
      log.info("Starting enhanced web search", {
        query: args.query,
        limit: args.limit,
        options: {
          language: args.language,
          region: args.region,
          safeSearch: args.safeSearch,
          timeRange: args.timeRange,
        },
      });

      const searchOptions: SearchOptions = {
        limit: args.limit,
        language: args.language,
        region: args.region,
        safeSearch: args.safeSearch,
        timeRange: args.timeRange,
      };

      const results = await performSearch(args.query, searchOptions);

      log.info("Search completed successfully", {
        resultCount: results.length,
        query: args.query,
      });

      if (results.length === 0) {
        return "No search results found. This could be due to:\n" +
               "- Very specific or uncommon search terms\n" +
               "- Temporary blocking by Google (try again later)\n" +
               "- Network connectivity issues\n" +
               "- Search filters being too restrictive";
      }

      // Format results in a readable way
      const formattedResults = results.map((result, index) => {
        return `${index + 1}. **${result.title}**\n` +
               `   URL: ${result.url}\n` +
               `   Description: ${result.description || "No description available"}\n`;
      }).join("\n");

      return `Found ${results.length} search results for "${args.query}":\n\n${formattedResults}`;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      log.error("Search failed", {
        query: args.query,
        error: errorMessage,
      });

      // Provide helpful error messages to users
      if (errorMessage.includes("Rate limited")) {
        return `Search temporarily unavailable due to rate limiting. Please try again in a few minutes.\n\nQuery: "${args.query}"`;
      } else if (errorMessage.includes("Access denied") || errorMessage.includes("blocked")) {
        return `Search request was blocked by Google. This can happen with frequent requests. Please try again later.\n\nQuery: "${args.query}"`;
      } else if (errorMessage.includes("timeout")) {
        return `Search request timed out. Please check your internet connection and try again.\n\nQuery: "${args.query}"`;
      } else {
        return `Search failed: ${errorMessage}\n\nQuery: "${args.query}"\n\nTip: Try rephrasing your search query or try again later.`;
      }
    }
  },
});

server.start({
  transportType: "stdio",
});
