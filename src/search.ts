import axios from "axios";
import axiosRetry from "axios-retry";
import * as cheerio from "cheerio";
import randomUseragent from "random-useragent";

export interface SearchResult {
  description: string;
  title: string;
  url: string;
}

export async function performSearch(
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  axiosRetry(axios, {
    retries: 100,
    retryDelay: axiosRetry.exponentialDelay,
  });
  const userAgent = randomUseragent.getRandom();
  const response = await axios.get("https://www.google.com/search", {
    headers: {
      "User-Agent": userAgent,
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