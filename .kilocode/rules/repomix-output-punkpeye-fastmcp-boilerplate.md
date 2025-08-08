# Directory Structure
```
.github/
  workflows/
    feature.yaml
    main.yaml
src/
  add.test.ts
  add.ts
  server.ts
.gitignore
eslint.config.ts
LICENSE
package.json
README.md
tsconfig.json
```

# Files

## File: .github/workflows/feature.yaml
````yaml
 1: name: Run Tests
 2: on:
 3:   pull_request:
 4:     branches:
 5:       - main
 6:     types:
 7:       - opened
 8:       - synchronize
 9:       - reopened
10:       - ready_for_review
11: jobs:
12:   test:
13:     runs-on: ubuntu-latest
14:     name: Test
15:     strategy:
16:       fail-fast: true
17:       matrix:
18:         node:
19:           - 22
20:     steps:
21:       - name: Checkout repository
22:         uses: actions/checkout@v4
23:         with:
24:           fetch-depth: 0
25:       - name: Setup NodeJS ${{ matrix.node }}
26:         uses: actions/setup-node@v4
27:         with:
28:           node-version: ${{ matrix.node }}
29:       - name: Install dependencies
30:         run: npm install
31:       - name: Run lint
32:         run: npm run lint
33:       - name: Run tests
34:         run: npm run test
````

## File: .github/workflows/main.yaml
````yaml
 1: name: Release
 2: on:
 3:   push:
 4:     branches:
 5:       - main
 6: jobs:
 7:   test:
 8:     environment: release
 9:     name: Test
10:     strategy:
11:       fail-fast: true
12:       matrix:
13:         node:
14:           - 22
15:     runs-on: ubuntu-latest
16:     permissions:
17:       contents: write
18:       id-token: write
19:     steps:
20:       - name: setup repository
21:         uses: actions/checkout@v4
22:         with:
23:           fetch-depth: 0
24:       - name: setup node.js
25:         uses: actions/setup-node@v4
26:         with:
27:           node-version: ${{ matrix.node }}
28:       - name: Setup NodeJS ${{ matrix.node }}
29:         uses: actions/setup-node@v4
30:         with:
31:           node-version: ${{ matrix.node }}
32:       - name: Install dependencies
33:         run: npm install
34:       - name: Run lint
35:         run: npm run lint
36:       - name: Run tests
37:         run: npm run test
38:       - name: Build
39:         run: npm run build
40:       - name: Release
41:         run: npx semantic-release
42:         env:
43:           GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
44:           NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
````

## File: src/add.test.ts
````typescript
1: import { expect, it } from "vitest";
2: 
3: import { add } from "./add.js";
4: 
5: it("should add two numbers", () => {
6:   expect(add(1, 2)).toBe(3);
7: });
````

## File: src/add.ts
````typescript
1: export const add = (a: number, b: number) => a + b;
````

## File: src/server.ts
````typescript
 1: import { FastMCP } from "fastmcp";
 2: import { z } from "zod";
 3: 
 4: import { add } from "./add.js";
 5: 
 6: const server = new FastMCP({
 7:   name: "Addition",
 8:   version: "1.0.0",
 9: });
10: 
11: server.addTool({
12:   annotations: {
13:     openWorldHint: false, // This tool doesn't interact with external systems
14:     readOnlyHint: true, // This tool doesn't modify anything
15:     title: "Addition",
16:   },
17:   description: "Add two numbers",
18:   execute: async (args) => {
19:     return String(add(args.a, args.b));
20:   },
21:   name: "add",
22:   parameters: z.object({
23:     a: z.number().describe("The first number"),
24:     b: z.number().describe("The second number"),
25:   }),
26: });
27: 
28: server.addResource({
29:   async load() {
30:     return {
31:       text: "Example log content",
32:     };
33:   },
34:   mimeType: "text/plain",
35:   name: "Application Logs",
36:   uri: "file:///logs/app.log",
37: });
38: 
39: server.addPrompt({
40:   arguments: [
41:     {
42:       description: "Git diff or description of changes",
43:       name: "changes",
44:       required: true,
45:     },
46:   ],
47:   description: "Generate a Git commit message",
48:   load: async (args) => {
49:     return `Generate a concise but descriptive commit message for these changes:\n\n${args.changes}`;
50:   },
51:   name: "git-commit",
52: });
53: 
54: server.start({
55:   transportType: "stdio",
56: });
````

## File: .gitignore
````
1: dist
2: node_modules
````

## File: eslint.config.ts
````typescript
 1: import eslint from "@eslint/js";
 2: import eslintConfigPrettier from "eslint-config-prettier/flat";
 3: import perfectionist from "eslint-plugin-perfectionist";
 4: import tseslint from "typescript-eslint";
 5: 
 6: export default tseslint.config(
 7:   eslint.configs.recommended,
 8:   tseslint.configs.recommended,
 9:   perfectionist.configs["recommended-alphabetical"],
10:   eslintConfigPrettier,
11:   {
12:     ignores: ["**/*.js"],
13:   },
14: );
````

## File: LICENSE
````
 1: The MIT License (MIT)
 2: =====================
 3: 
 4: Copyright © 2025 Frank Fiegel (frank@glama.ai)
 5: 
 6: Permission is hereby granted, free of charge, to any person
 7: obtaining a copy of this software and associated documentation
 8: files (the “Software”), to deal in the Software without
 9: restriction, including without limitation the rights to use,
10: copy, modify, merge, publish, distribute, sublicense, and/or sell
11: copies of the Software, and to permit persons to whom the
12: Software is furnished to do so, subject to the following
13: conditions:
14: 
15: The above copyright notice and this permission notice shall be
16: included in all copies or substantial portions of the Software.
17: 
18: THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
19: EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
20: OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
21: NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
22: HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
23: WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
24: FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
25: OTHER DEALINGS IN THE SOFTWARE.
````

## File: package.json
````json
 1: {
 2:   "name": "fastmcp-boilerplate",
 3:   "version": "1.0.0",
 4:   "main": "dist/index.js",
 5:   "scripts": {
 6:     "build": "tsc",
 7:     "start": "tsx src/server.ts",
 8:     "dev": "fastmcp dev src/server.ts",
 9:     "lint": "prettier --check . && eslint . && tsc --noEmit",
10:     "test": "vitest run",
11:     "format": "prettier --write . && eslint --fix ."
12:   },
13:   "keywords": [
14:     "fastmcp",
15:     "mcp",
16:     "boilerplate"
17:   ],
18:   "repository": {
19:     "url": "https://github.com/punkpeye/fastmcp-boilerplate"
20:   },
21:   "author": "Frank Fiegel <frank@glama.ai>",
22:   "homepage": "https://glama.ai/mcp",
23:   "type": "module",
24:   "license": "MIT",
25:   "description": "A boilerplate for FastMCP",
26:   "dependencies": {
27:     "fastmcp": "^1.27.3",
28:     "zod": "^3.24.4"
29:   },
30:   "release": {
31:     "branches": [
32:       "main"
33:     ],
34:     "plugins": [
35:       "@semantic-release/commit-analyzer",
36:       "@semantic-release/release-notes-generator",
37:       "@semantic-release/npm",
38:       "@semantic-release/github"
39:     ]
40:   },
41:   "devDependencies": {
42:     "@eslint/js": "^9.26.0",
43:     "@tsconfig/node22": "^22.0.1",
44:     "eslint-config-prettier": "^10.1.3",
45:     "eslint-plugin-perfectionist": "^4.12.3",
46:     "jiti": "^2.4.2",
47:     "prettier": "^3.5.3",
48:     "semantic-release": "^24.2.3",
49:     "tsx": "^4.19.4",
50:     "typescript": "^5.8.3",
51:     "typescript-eslint": "^8.32.0",
52:     "vitest": "^3.1.3"
53:   }
54: }
````

## File: README.md
````markdown
 1: # FastMCP Boilerplate
 2: 
 3: A boilerplate for [FastMCP](https://github.com/punkpeye/fastmcp).
 4: 
 5: This boilerplate is a good starting point for building an MCP server. It includes a basic setup for testing, linting, formatting, and publishing to NPM.
 6: 
 7: ## Development
 8: 
 9: To get started, clone the repository and install the dependencies.
10: 
11: ```bash
12: git clone https://github.com/punkpeye/fastmcp-boilerplate.git
13: cd fastmcp-boilerplate
14: npm install
15: npm run dev
16: ```
17: 
18: > [!NOTE]
19: > If you are starting a new project, you may want to fork [fastmcp-boilerplate](https://github.com/punkpeye/fastmcp-boilerplate) and start from there.
20: 
21: ### Start the server
22: 
23: If you simply want to start the server, you can use the `start` script.
24: 
25: ```bash
26: npm run start
27: ```
28: 
29: However, you can also interact with the server using the `dev` script.
30: 
31: ```bash
32: npm run dev
33: ```
34: 
35: This will start the server and allow you to interact with it using CLI.
36: 
37: ### Testing
38: 
39: A good MCP server should have tests. However, you don't need to test the MCP server itself, but rather the tools you implement.
40: 
41: ```bash
42: npm run test
43: ```
44: 
45: In the case of this boilerplate, we only test the implementation of the `add` tool.
46: 
47: ### Linting
48: 
49: Having a good linting setup reduces the friction for other developers to contribute to your project.
50: 
51: ```bash
52: npm run lint
53: ```
54: 
55: This boilerplate uses [Prettier](https://prettier.io/), [ESLint](https://eslint.org/) and [TypeScript ESLint](https://typescript-eslint.io/) to lint the code.
56: 
57: ### Formatting
58: 
59: Use `npm run format` to format the code.
60: 
61: ```bash
62: npm run format
63: ```
64: 
65: ### GitHub Actions
66: 
67: This repository has a GitHub Actions workflow that runs linting, formatting, tests, and publishes package updates to NPM using [semantic-release](https://semantic-release.gitbook.io/semantic-release/).
68: 
69: In order to use this workflow, you need to:
70: 
71: 1. Add `NPM_TOKEN` to the repository secrets
72:    1. [Create a new automation token](https://www.npmjs.com/settings/punkpeye/tokens/new)
73:    2. Add token as `NPM_TOKEN` environment secret (Settings → Secrets and Variables → Actions → "Manage environment secrets" → "release" → Add environment secret)
74: 1. Grant write access to the workflow (Settings → Actions → General → Workflow permissions → "Read and write permissions")
````

## File: tsconfig.json
````json
1: {
2:   "extends": "@tsconfig/node22/tsconfig.json",
3:   "compilerOptions": {
4:     "outDir": "dist"
5:   },
6:   "include": ["src"]
7: }
````
