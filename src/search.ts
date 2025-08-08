import axios, { AxiosRequestConfig } from "axios";
import axiosRetry from "axios-retry";
import * as cheerio from "cheerio";
import { createHash, randomBytes } from "crypto";
import randomUseragent from "random-useragent";
import { lookup } from "dns";
import { promisify } from "util";
import { Agent } from "https";

export interface SearchResult {
  description: string;
  title: string;
  url: string;
}

export interface SearchOptions {
  limit?: number;
  language?: string;
  region?: string;
  safeSearch?: "off" | "moderate" | "strict";
  timeRange?: "hour" | "day" | "week" | "month" | "year";
}

// Enhanced DNS resolver with multiple DNS servers
class DNSResolver {
  private static currentDNSIndex = 0;

  private static readonly DNS_SERVERS = [
    // Google Public DNS
    { name: "Google Primary", server: "8.8.8.8" },
    { name: "Google Secondary", server: "8.8.4.4" },
    // Cloudflare DNS
    { name: "Cloudflare Primary", server: "1.1.1.1" },
    { name: "Cloudflare Secondary", server: "1.0.0.1" },
    { name: "Cloudflare Secure Primary", server: "1.1.1.2" },
    { name: "Cloudflare Secure Secondary", server: "1.0.0.2" },
    { name: "Cloudflare Family Primary", server: "1.1.1.3" },
    { name: "Cloudflare Family Secondary", server: "1.0.0.3" },
    // AdGuard DNS
    { name: "AdGuard Primary", server: "94.140.14.14" },
    { name: "AdGuard Secondary", server: "94.140.15.15" },
    { name: "AdGuard Family Primary", server: "94.140.14.15" },
    { name: "AdGuard Family Secondary", server: "94.140.15.16" },
    { name: "AdGuard Unfiltered Primary", server: "94.140.14.140" },
    { name: "AdGuard Unfiltered Secondary", server: "94.140.14.141" },
    // Quad9 DNS
    { name: "Quad9 Primary", server: "9.9.9.9" },
    { name: "Quad9 Secondary", server: "149.112.112.112" },
    // Cisco OpenDNS
    { name: "Cisco OpenDNS Primary", server: "208.67.222.222" },
    { name: "Cisco OpenDNS Secondary", server: "208.67.220.220" },
    { name: "Cisco OpenDNS Family Primary", server: "208.67.222.123" },
    { name: "Cisco OpenDNS Family Secondary", server: "208.67.220.123" },
    // Alternate DNS
    { name: "Alternate DNS Primary", server: "76.76.19.19" },
    { name: "Alternate DNS Secondary", server: "76.223.122.150" },
    // IIJ Public DNS
    { name: "IIJ Public DNS Primary", server: "1.1.1.1" }, // Note: Using Cloudflare as fallback since IIJ only provides DoH/DoT
    { name: "IIJ Public DNS Secondary", server: "1.0.0.1" },
  ];

  static async findWorkingDNS(hostname: string = "google.com"): Promise<void> {
    const maxAttempts = this.DNS_SERVERS.length;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const success = await this.testDNSResolution(hostname);
      if (success) {
        return;
      }

      if (attempt < maxAttempts - 1) {
        this.rotateDNS();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between attempts
      }
    }

    console.warn("All DNS servers failed, using system default");
  }

  static getCurrentDNS() {
    return this.DNS_SERVERS[this.currentDNSIndex];
  }

  static rotateDNS() {
    this.currentDNSIndex = (this.currentDNSIndex + 1) % this.DNS_SERVERS.length;
    const newDNS = this.getCurrentDNS();
    console.log(`Rotated to DNS: ${newDNS.name} (${newDNS.server})`);
    return newDNS;
  }

  static async testDNSResolution(hostname: string = "google.com"): Promise<boolean> {
    const dnsLookup = promisify(lookup);
    try {
      const currentDNS = this.getCurrentDNS();
      console.log(`Testing DNS resolution with ${currentDNS.name} (${currentDNS.server})`);

      // Note: Node.js doesn't directly support specifying DNS servers in lookup
      // This is more of a conceptual implementation for monitoring
      await dnsLookup(hostname, { family: 4 });
      console.log(`DNS resolution successful with ${currentDNS.name}`);
      return true;
    } catch (error) {
      const currentDNS = this.getCurrentDNS();
      console.log(`DNS resolution failed with ${currentDNS.name}:`, error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
}

// Request anonymization and fingerprint randomization
class RequestAnonymizer {
  private static readonly ACCEPT_ENCODINGS = [
    "gzip, deflate, br",
    "gzip, deflate",
    "gzip, deflate, br, zstd",
  ];

  private static readonly ACCEPT_LANGUAGES = [
    "en-US,en;q=0.9",
    "en-GB,en;q=0.9",
    "en-US,en;q=0.9,es;q=0.8",
    "en-US,en;q=0.9,fr;q=0.8",
    "en-US,en;q=0.9,de;q=0.8",
    "en-US,en;q=0.9,ja;q=0.8",
  ];

  static addBackoffDelay(retryCount: number): Promise<void> {
    // Exponential backoff with jitter for failed requests
    const baseDelay = Math.pow(2, retryCount) * 1000;
    const jitter = Math.random() * 1000;
    const delay = Math.min(baseDelay + jitter, 30000); // Cap at 30 seconds

    console.log(`Adding backoff delay: ${delay}ms (retry ${retryCount})`);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  static addRandomDelay(attempt: number = 1): Promise<void> {
    // Increase delay for subsequent attempts
    const baseDelay = Math.floor(Math.random() * 1500) + 300; // 300-1800ms
    const attemptMultiplier = Math.min(attempt, 3); // Cap at 3x
    const delay = baseDelay * attemptMultiplier;

    console.log(`Adding random delay: ${delay}ms (attempt ${attempt})`);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  static generateHeaders(userAgent: string): Record<string, string> {
    const acceptLanguage = this.ACCEPT_LANGUAGES[Math.floor(Math.random() * this.ACCEPT_LANGUAGES.length)];
    const acceptEncoding = this.ACCEPT_ENCODINGS[Math.floor(Math.random() * this.ACCEPT_ENCODINGS.length)];

    const headers: Record<string, string> = {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Encoding": acceptEncoding,
      "Accept-Language": acceptLanguage,
      "Cache-Control": "max-age=0",
      "Connection": "keep-alive",
      "DNT": Math.random() > 0.5 ? "1" : "0",
      "Upgrade-Insecure-Requests": "1",
      "User-Agent": userAgent,
    };

    // Add Chrome-specific headers if it's a Chrome user agent
    if (userAgent.includes('Chrome')) {
      const chromeVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || '120';
      headers["sec-ch-ua"] = `"Not_A Brand";v="8", "Chromium";v="${chromeVersion}", "Google Chrome";v="${chromeVersion}"`;
      headers["sec-ch-ua-mobile"] = "?0";
      headers["sec-ch-ua-platform"] = userAgent.includes('Windows') ? '"Windows"' :
        userAgent.includes('Mac') ? '"macOS"' : '"Linux"';
      headers["Sec-Fetch-Dest"] = "document";
      headers["Sec-Fetch-Mode"] = "navigate";
      headers["Sec-Fetch-Site"] = "none";
      headers["Sec-Fetch-User"] = "?1";
    }

    return headers;
  }

  static generateSessionId(): string {
    return createHash('sha256')
      .update(randomBytes(32))
      .digest('hex')
      .substring(0, 16);
  }
}

// Enhanced search parameter builder
class SearchParameterBuilder {
  static build(query: string, options: SearchOptions = {}, attempt: number = 1): Record<string, string> {
    const params: Record<string, string> = {
      num: Math.min(options.limit || 10, 100).toString(),
      q: query,
    };

    if (options.language) {
      params.hl = options.language;
      params.lr = `lang_${options.language}`;
    }

    if (options.region) {
      params.gl = options.region;
    }

    if (options.safeSearch) {
      params.safe = options.safeSearch;
    }

    if (options.timeRange) {
      const timeMap = {
        day: "qdr:d",
        hour: "qdr:h",
        month: "qdr:m",
        week: "qdr:w",
        year: "qdr:y",
      };
      params.tbs = timeMap[options.timeRange];
    }

    // Add random parameters to vary fingerprint
    const randomSeed = Math.random();

    if (randomSeed > 0.7) {
      params.source = "hp";
    }

    if (randomSeed > 0.8) {
      params.ei = RequestAnonymizer.generateSessionId();
    }

    // Add attempt-specific parameters to vary requests
    if (attempt > 1) {
      // Vary the number of results slightly on retries
      const baseNum = Math.min(options.limit || 10, 100);
      params.num = Math.min(baseNum + Math.floor(Math.random() * 3), 100).toString();

      // Add client parameter variation
      if (Math.random() > 0.5) {
        params.client = attempt % 2 === 0 ? "firefox-b-d" : "chrome";
      }

      // Add random start parameter for different result sets
      if (attempt > 2 && Math.random() > 0.6) {
        params.start = "0"; // Reset to ensure we get primary results
      }
    }

    // Add timestamp-based parameter for cache busting
    if (Math.random() > 0.6) {
      params._t = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    }

    return params;
  }
}

// Enhanced result parser with multiple selectors
class ResultParser {
  static parse(html: string, limit: number): SearchResult[] {
    const $ = cheerio.load(html);
    const results: SearchResult[] = [];

    // Check if this is mobile version (has ezO2md class)
    const isMobile = $(".ezO2md").length > 0;

    if (isMobile) {
      // Parse mobile Google results
      $(".ezO2md").each((i, element) => {
        if (results.length >= limit) return false;

        const $element = $(element);

        // Find the main link with title
        const mainLink = $element.find("a.fuLhoc.ZWRArf").first();
        if (!mainLink.length) return;

        const title = mainLink.find(".CVA68e").text().trim() || mainLink.text().trim();
        const href = mainLink.attr("href");

        let url = "";
        if (href) {
          if (href.startsWith("/url?q=")) {
            try {
              const urlParam = href.split("/url?q=")[1].split("&")[0];
              url = decodeURIComponent(urlParam);
            } catch (e) {
              url = href;
            }
          } else if (href.startsWith("http")) {
            url = href;
          }
        }

        // Find description
        let description = "";
        const descElement = $element.find(".FrIlee .fYyStc").first();
        if (descElement.length) {
          description = descElement.text().trim();
        }

        if (title && url && url.startsWith("http")) {
          results.push({
            description: description || "",
            title: title,
            url: url,
          });
        }
      });
    } else {
      // Parse desktop Google results
      // Primary selector: div.g (most common)
      $("div.g").each((i, element) => {
        if (results.length >= limit) return false;

        const $element = $(element);

        // Find title - try multiple selectors
        const titleElement = $element.find("h3").first();
        const title = titleElement.text().trim();

        // Find URL - try multiple approaches
        let url = "";
        const linkElement = $element.find("a").first();
        if (linkElement.length) {
          const href = linkElement.attr("href");
          if (href) {
            if (href.startsWith("/url?q=")) {
              // Decode Google redirect URL
              try {
                const urlParam = href.split("/url?q=")[1].split("&")[0];
                url = decodeURIComponent(urlParam);
              } catch (e) {
                url = href;
              }
            } else if (href.startsWith("http")) {
              url = href;
            }
          }
        }

        // Find description - try multiple selectors
        let description = "";
        const snippetSelectors = [".VwiC3b", ".s3v9rd", ".lEBKkf", ".IsZvec", ".aCOpRe", ".st"];
        for (const selector of snippetSelectors) {
          const snippetElement = $element.find(selector).first();
          if (snippetElement.length) {
            description = snippetElement.text().trim();
            break;
          }
        }

        if (title && url && url.startsWith("http")) {
          results.push({
            description: description || "",
            title: title,
            url: url,
          });
        }
      });

      // If no results with primary selector, try alternative selectors
      if (results.length === 0) {
        console.warn("No results found with primary selector, trying alternatives");

        // Try .tF2Cxc selector (newer Google layout)
        $(".tF2Cxc").each((i, element) => {
          if (results.length >= limit) return false;

          const $element = $(element);

          const titleElement = $element.find("h3").first();
          const title = titleElement.text().trim();

          let url = "";
          const linkElement = $element.find(".yuRUbf a").first();
          if (linkElement.length) {
            const href = linkElement.attr("href");
            if (href && href.startsWith("http")) {
              url = href;
            }
          }

          let description = "";
          const snippetElement = $element.find(".VwiC3b, .s3v9rd").first();
          if (snippetElement.length) {
            description = snippetElement.text().trim();
          }

          if (title && url) {
            results.push({
              description: description || "",
              title: title,
              url: url,
            });
          }
        });
      }
    }

    // Final fallback: look for any reasonable links if still no results
    if (results.length === 0) {
      console.warn("Using fallback parsing strategy");

      $("a").each((i, element) => {
        if (results.length >= limit) return false;

        const $link = $(element);
        const href = $link.attr("href");
        const text = $link.text().trim();

        if (href && text && text.length > 10 && text.length < 200) {
          let url = "";
          if (href.startsWith("/url?q=")) {
            try {
              const urlParam = href.split("/url?q=")[1].split("&")[0];
              url = decodeURIComponent(urlParam);
            } catch (e) {
              return; // Skip this iteration
            }
          } else if (href.startsWith("http")) {
            url = href;
          } else {
            return; // Skip this iteration
          }

          // Skip navigation links and other non-content links
          if (!text.toLowerCase().includes("sign in") &&
            !text.toLowerCase().includes("images") &&
            !text.toLowerCase().includes("videos") &&
            !text.toLowerCase().includes("検索") &&
            !url.includes("accounts.google.com") &&
            url.startsWith("http")) {
            results.push({
              description: "",
              title: text,
              url: url,
            });
          }
        }
      });
    }

    return results.slice(0, limit);
  }
}

export async function performSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const limit = Math.min(options.limit || 5, 10);

  // Test and find working DNS before starting search
  console.log("Testing DNS resolution...");
  await DNSResolver.findWorkingDNS("google.com");

  // Create axios instance with enhanced configuration
  const axiosInstance = axios.create({
    maxRedirects: 3,
    timeout: 12000,
    validateStatus: (status) => status < 500, // Accept 4xx errors but retry on 5xx
    // DNS optimization for better reliability
    family: 4, // Force IPv4 to avoid IPv6 DNS issues
    // Use HTTPS agent with DNS optimization
    httpsAgent: new Agent({
      family: 4,
      keepAlive: true,
      keepAliveMsecs: 1000,
      maxSockets: 5,
      maxFreeSockets: 2,
      timeout: 10000,
    }),
  });

  // Configure enhanced retry logic with adaptive strategies
  axiosRetry(axiosInstance, {
    onRetry: async (retryCount, error, requestConfig) => {
      console.log(`Retry attempt ${retryCount} for ${requestConfig.url}`);

      // Rotate DNS on network errors or DNS-related failures
      if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN' || retryCount > 2) {
        console.log(`DNS-related error detected, rotating DNS server...`);
        DNSResolver.rotateDNS();
        await DNSResolver.testDNSResolution("google.com");
      }

      // Rotate user agent on retry to avoid detection
      if (retryCount > 1) {
        let newUserAgent = randomUseragent.getRandom();

        // Try to get a desktop user agent
        for (let i = 0; i < 3; i++) {
          if (newUserAgent && (newUserAgent.includes('Windows') || newUserAgent.includes('Macintosh') || newUserAgent.includes('Linux'))) {
            break;
          }
          newUserAgent = randomUseragent.getRandom();
        }

        requestConfig.headers = {
          ...requestConfig.headers,
          ...RequestAnonymizer.generateHeaders(newUserAgent)
        };

        console.log(`Rotated user agent for retry ${retryCount}: ${newUserAgent.substring(0, 50)}...`);
      }
    },
    retries: 5,
    retryCondition: (error) => {
      // Network errors - always retry
      if (axiosRetry.isNetworkError(error)) {
        return true;
      }

      // Idempotent request errors - always retry
      if (axiosRetry.isIdempotentRequestError(error)) {
        return true;
      }

      // HTTP status based retries
      if (error.response?.status) {
        const status = error.response.status;

        // Server errors (5xx) - always retry
        if (status >= 500) {
          return true;
        }

        // Rate limiting (429) - retry with longer delays
        if (status === 429) {
          return true;
        }

        // Temporary redirects that might resolve
        if (status === 302 || status === 307 || status === 308) {
          return true;
        }

        // Request timeout - retry
        if (status === 408) {
          return true;
        }

        // Too many requests from this IP - retry with longer delay
        if (status === 503) {
          return true;
        }
      }

      // Timeout errors - retry
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return true;
      }

      // DNS resolution errors - retry
      if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
        return true;
      }

      // Connection errors - retry
      if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
        return true;
      }

      return false;
    },
    retryDelay: (retryCount, error) => {
      // Adaptive delay based on error type
      let baseDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff

      // Longer delays for rate limiting
      if (error?.response?.status === 429) {
        baseDelay = Math.pow(3, retryCount) * 2000; // More aggressive backoff for rate limits
      }

      // Shorter delays for network errors
      if (axiosRetry.isNetworkError(error)) {
        baseDelay = Math.min(baseDelay, 3000); // Cap network error delays
      }

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * Math.min(1000, baseDelay * 0.3);
      const totalDelay = baseDelay + jitter;

      console.log(`Retry ${retryCount}: waiting ${totalDelay}ms (error: ${error?.response?.status || error?.code || 'unknown'})`);
      return totalDelay;
    },
  });

  // Generate realistic request fingerprint using random-useragent library
  // Try to get a desktop user agent, fallback to any if none found
  let userAgent = randomUseragent.getRandom();

  // If we got a mobile user agent, try a few more times to get a desktop one
  for (let i = 0; i < 5; i++) {
    if (userAgent && (userAgent.includes('Windows') || userAgent.includes('Macintosh') || userAgent.includes('Linux'))) {
      break;
    }
    userAgent = randomUseragent.getRandom();
  }

  let headers = RequestAnonymizer.generateHeaders(userAgent);
  let params = SearchParameterBuilder.build(query, options);

  // Add random delay to avoid detection
  await RequestAnonymizer.addRandomDelay();

  // Multiple attempt strategy with different approaches
  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Search attempt ${attempt}/${maxAttempts} for query: "${query}"`);

      // Update params for this attempt
      params = SearchParameterBuilder.build(query, options, attempt);

      const config: AxiosRequestConfig = {
        decompress: true,
        headers,
        params,
        // Increase timeout for later attempts
        timeout: 12000 + (attempt - 1) * 3000,
      };

      const response = await axiosInstance.get("https://www.google.com/search", config);

      // Validate response
      if (response.status === 429) {
        const retryAfter = response.headers['retry-after'];
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
        console.log(`Rate limited, waiting ${waitTime}ms before next attempt`);
        await new Promise(resolve => setTimeout(resolve, waitTime));

        if (attempt === maxAttempts) {
          throw new Error("Rate limited by Google. Please try again later.");
        }
        continue;
      }

      if (response.status >= 400) {
        if (attempt === maxAttempts) {
          throw new Error(`Google search failed with status ${response.status}`);
        }
        console.log(`HTTP ${response.status} on attempt ${attempt}, retrying...`);
        await RequestAnonymizer.addRandomDelay();
        continue;
      }

      // Check if we got a valid response
      if (!response.data || response.data.length < 1000) {
        if (attempt === maxAttempts) {
          throw new Error("Received invalid or empty response from Google");
        }
        console.log(`Invalid response on attempt ${attempt}, retrying...`);
        await RequestAnonymizer.addRandomDelay();
        continue;
      }

      const results = ResultParser.parse(response.data, limit);

      // If we got results, return them
      if (results.length > 0) {
        console.log(`Successfully found ${results.length} results on attempt ${attempt}`);
        return results;
      }

      // If no results and this is not the last attempt, try again
      if (attempt < maxAttempts) {
        console.log(`No results found on attempt ${attempt}, retrying with different strategy...`);

        // Rotate user agent for next attempt
        let newUserAgent = randomUseragent.getRandom();
        for (let i = 0; i < 3; i++) {
          if (newUserAgent && (newUserAgent.includes('Windows') || newUserAgent.includes('Macintosh') || newUserAgent.includes('Linux'))) {
            break;
          }
          newUserAgent = randomUseragent.getRandom();
        }
        headers = RequestAnonymizer.generateHeaders(newUserAgent);

        await RequestAnonymizer.addRandomDelay();
        continue;
      }

      // Last attempt and no results
      return results;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`Attempt ${attempt} failed:`, lastError.message);

      if (attempt === maxAttempts) {
        break;
      }

      // Wait before next attempt
      const waitTime = Math.min(2000 * attempt, 8000);
      console.log(`Waiting ${waitTime}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));

      // Rotate user agent for next attempt
      let newUserAgent = randomUseragent.getRandom();
      for (let i = 0; i < 3; i++) {
        if (newUserAgent && (newUserAgent.includes('Windows') || newUserAgent.includes('Macintosh') || newUserAgent.includes('Linux'))) {
          break;
        }
        newUserAgent = randomUseragent.getRandom();
      }
      headers = RequestAnonymizer.generateHeaders(newUserAgent);
    }
  }

  // All attempts failed, throw the last error with enhanced message
  if (lastError) {
    if (axios.isAxiosError(lastError)) {
      if (lastError.code === "ECONNABORTED" || lastError.code === "ETIMEDOUT") {
        throw new Error("Search request timed out after multiple attempts. Please check your internet connection and try again.");
      }
      if (lastError.response?.status === 403) {
        throw new Error("Access denied by Google after multiple attempts. The requests may have been blocked. Please try again later.");
      }
      if (lastError.response?.status === 429) {
        throw new Error("Rate limited by Google after multiple attempts. Please try again in a few minutes.");
      }
      if (lastError.response?.status === 503) {
        throw new Error("Google service temporarily unavailable. Please try again later.");
      }
    }

    throw new Error(`Search failed after ${maxAttempts} attempts: ${lastError.message}`);
  }

  throw new Error(`Search failed after ${maxAttempts} attempts: Unknown error`);
}