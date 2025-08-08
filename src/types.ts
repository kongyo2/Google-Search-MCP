export interface SearchResult {
  title: string;
  url: string;
  description: string;
}

export interface SearchOptions {
  limit?: number;
  language?: string;
  region?: string;
  safeSearch?: "off" | "moderate" | "strict";
  timeRange?: "hour" | "day" | "week" | "month" | "year";
}

export interface BrowserFingerprint {
  userAgent: string;
  headers: Record<string, string>;
  sessionId: string;
}

export interface SearchError extends Error {
  code?: string;
  status?: number;
  isRateLimit?: boolean;
  isBlocked?: boolean;
  isTimeout?: boolean;
}