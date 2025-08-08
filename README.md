# Enhanced Google Search MCP Server

[![smithery badge](https://smithery.ai/badge/@kongyo2/google-search-mcp)](https://smithery.ai/server/@kongyo2/google-search-mcp)

> **⚠️ EXPERIMENTAL PROJECT - USE AT YOUR OWN RISK**
> 
> This is an experimental Google search MCP server that uses web scraping techniques. Please be aware of the following:
> 
> - **Rate Limiting**: Google may block or rate-limit requests from this server
> - **Reliability**: Search results may be inconsistent due to Google's anti-scraping measures
> 
> **🔍 RECOMMENDED ALTERNATIVES**
> 
> For production use, we strongly recommend using official search APIs or established MCP servers:
> - **DuckDuckGo MCP Servers**: More reliable and ToS-compliant alternatives
> - **Bing Search API**: Microsoft's official search API with MCP integration
> - **Google Custom Search API**: Google's official search API (requires API key)
> - **SearXNG MCP**: Privacy-focused meta-search engine integration
> 
> Use this experimental server only if you understand the risks and limitations.

---

A powerful Model Context Protocol (MCP) server that provides enhanced Google search capabilities with advanced anonymization and anti-detection features.

## Features

### 🔍 Enhanced Search Capabilities
- **Advanced Query Support**: Handle complex search queries with quotes, operators, and filters
- **Configurable Results**: Limit results (1-10), set language, region, safe search, and time range
- **Multiple Parsing Strategies**: Robust result extraction with fallback mechanisms

### 🛡️ Advanced Anonymization
- **Realistic Browser Fingerprinting**: Rotating user agents that mimic real browsers (Chrome, Firefox, Safari, Edge)
- **Dynamic Headers**: Randomized Accept-Language, Accept-Encoding, and security headers
- **Session Randomization**: Unique session IDs and request fingerprints
- **Request Timing**: Random delays to avoid detection patterns

### 🚀 Reliability Features
- **Smart Retry Logic**: Exponential backoff with jitter for failed requests
- **Rate Limit Handling**: Automatic detection and graceful handling of rate limits
- **Error Recovery**: Comprehensive error handling with user-friendly messages
- **Timeout Management**: Configurable timeouts with proper error reporting

### 🔧 Technical Improvements
- **Multiple Result Selectors**: Adapts to Google's changing HTML structure
- **URL Cleaning**: Proper handling of Google's redirect URLs
- **Content Validation**: Ensures all results have valid URLs and content
- **Comprehensive Logging**: Detailed logging for debugging and monitoring

## Installation

### Installing via Smithery

To install google-search-mcp for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@kongyo2/google-search-mcp):

```bash
npx -y @smithery/cli install @kongyo2/google-search-mcp --client claude
```

### Manual Installation
```bash
npm install
```

## Usage

### Development Mode

Start the server in development mode with interactive CLI:

```bash
npm run dev
```

### Production Mode

Start the server for production use:

```bash
npm run start
```

### Testing

Run the comprehensive test suite:

```bash
npm run test
```

For continuous testing during development:

```bash
npm run test:watch
```

## MCP Tool: `search`

The server provides a single, powerful search tool with the following parameters:

### Parameters

- **`query`** (required): Search query to execute
- **`limit`** (optional): Maximum number of results (1-10, default: 5)
- **`language`** (optional): Language code (e.g., 'en', 'es', 'fr', 'de', 'ja')
- **`region`** (optional): Region code (e.g., 'us', 'uk', 'ca', 'au')
- **`safeSearch`** (optional): Filter level ('off', 'moderate', 'strict')
- **`timeRange`** (optional): Time filter ('hour', 'day', 'week', 'month', 'year')

### Example Usage

```json
{
  "name": "search",
  "arguments": {
    "query": "Model Context Protocol MCP",
    "limit": 5,
    "language": "en",
    "region": "us",
    "safeSearch": "moderate",
    "timeRange": "week"
  }
}
```

## Configuration with Claude Desktop

Add this configuration to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "enhanced-google-search": {
      "command": "npx",
      "args": ["tsx", "/path/to/your/project/src/server.ts"]
    }
  }
}
```

## Architecture

### Core Components

1. **UserAgentGenerator**: Creates realistic browser fingerprints
2. **RequestAnonymizer**: Handles request anonymization and timing
3. **SearchParameterBuilder**: Constructs optimized search parameters
4. **ResultParser**: Robust HTML parsing with multiple strategies

### Anti-Detection Features

- **Browser Fingerprint Rotation**: Cycles through realistic user agents
- **Header Randomization**: Varies request headers to avoid patterns
- **Timing Randomization**: Adds random delays between requests
- **Session Management**: Generates unique session identifiers
- **Parameter Variation**: Adds random search parameters

### Error Handling

The server provides comprehensive error handling for:
- Rate limiting by Google
- Network timeouts and connectivity issues
- Access denied/blocked requests
- Invalid or empty responses
- Parsing failures with fallback strategies

## Development

### Project Structure

```
src/
├── server.ts          # Main MCP server implementation
├── search.ts          # Enhanced search functionality
├── search.test.ts     # Comprehensive test suite
└── types.ts           # TypeScript type definitions
```

### Code Quality

The project includes:
- **TypeScript**: Full type safety and IntelliSense support
- **ESLint**: Code linting with TypeScript rules
- **Prettier**: Consistent code formatting
- **Vitest**: Fast and reliable testing framework

### Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm run start`: Start the server in production mode
- `npm run dev`: Start in development mode with CLI
- `npm run test`: Run the test suite
- `npm run test:watch`: Run tests in watch mode
- `npm run lint`: Check code quality and types
- `npm run format`: Format code with Prettier

## Testing

The test suite covers:
- Basic search functionality
- Parameter validation and handling
- Language and region filtering
- Safe search and time range filters
- Complex query handling
- Error scenarios and edge cases
- URL validation and result formatting

All tests use real Google search requests to ensure functionality works in practice.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run `npm run lint` and `npm run test`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

