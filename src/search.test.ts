import { expect, it } from "vitest";

import { performSearch } from "./search.js";

it("should return search results", async () => {
  const results = await performSearch("fastmcp", 5);
  expect(results.length).toBeGreaterThan(0);
  expect(results[0]).toHaveProperty("title");
  expect(results[0]).toHaveProperty("url");
  expect(results[0]).toHaveProperty("description");
}, 10000);