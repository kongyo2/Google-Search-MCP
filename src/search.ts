import axios from "axios";
import * as cheerio from "cheerio";

export interface SearchResult {
  description: string;
  title: string;
  url: string;
}

export async function performSearch(
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  const response = await axios.get("https://www.google.com/search", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
    },
    params: { q: query },
  });

  const $ = cheerio.load(response.data);
  const results: SearchResult[] = [];

  $("div.g").each((i, element) => {
    if (i >= limit) return false;

    const titleElement = $(element).find("h3");
    const linkElement = $(element).find("a");
    const snippetElement = $(element).find(".VwiC3b");

    if (titleElement.length && linkElement.length) {
      const url = linkElement.attr("href");
      if (url && url.startsWith("http")) {
        results.push({
          description: snippetElement.text() || "",
          title: titleElement.text(),
          url: url,
        });
      }
    }
  });

  return results;
}