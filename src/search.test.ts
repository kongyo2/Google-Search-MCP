import { describe, expect, it } from "vitest";

import { performSearch } from "./search.js";

describe("Enhanced Google Search", () => {
  it("should return search results for basic query", async () => {
    const results = await performSearch("fastmcp");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("title");
    expect(results[0]).toHaveProperty("url");
    expect(results[0]).toHaveProperty("description");
    expect(results[0].url).toMatch(/^https?:\/\//);
    expect(results[0].title.length).toBeGreaterThan(0);
  }, 15000);

  it("should respect limit parameter", async () => {
    const results = await performSearch("javascript", { limit: 3 });
    expect(results.length).toBeLessThanOrEqual(3);
    expect(results.length).toBeGreaterThan(0);
  }, 15000);

  it("should handle language parameter", async () => {
    const results = await performSearch("hello world", { 
      limit: 2, 
      language: "en" 
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("title");
    expect(results[0]).toHaveProperty("url");
  }, 15000);

  it("should handle region parameter", async () => {
    const results = await performSearch("weather", { 
      limit: 2, 
      region: "us" 
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("title");
    expect(results[0]).toHaveProperty("url");
  }, 15000);

  it("should handle safe search parameter", async () => {
    const results = await performSearch("family friendly content", { 
      limit: 2, 
      safeSearch: "strict" 
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("title");
    expect(results[0]).toHaveProperty("url");
  }, 15000);

  it("should handle time range parameter", async () => {
    const results = await performSearch("news today", { 
      limit: 2, 
      timeRange: "day" 
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty("title");
    expect(results[0]).toHaveProperty("url");
  }, 15000);

  it("should handle complex search queries", async () => {
    const results = await performSearch("\"Model Context Protocol\" MCP", { limit: 3 });
    expect(results.length).toBeGreaterThan(0);
    results.forEach(result => {
      expect(result.title).toBeTruthy();
      expect(result.url).toMatch(/^https?:\/\//);
    });
  }, 15000);

  it("should handle empty results gracefully", async () => {
    // Use a very specific query that's unlikely to return results
    const results = await performSearch("xyzabc123nonexistentquery456def", { limit: 5 });
    expect(Array.isArray(results)).toBe(true);
    // Results might be empty or contain some results, both are acceptable
  }, 15000);

  it("should validate URL format in results", async () => {
    const results = await performSearch("github", { limit: 3 });
    expect(results.length).toBeGreaterThan(0);
    
    results.forEach(result => {
      expect(result.url).toMatch(/^https?:\/\/[^\s]+/);
      expect(result.title.trim().length).toBeGreaterThan(0);
      // Description can be empty, so we just check it's a string
      expect(typeof result.description).toBe("string");
    });
  }, 15000);
});