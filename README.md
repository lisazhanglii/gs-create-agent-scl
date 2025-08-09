# CopilotKit <> Mastra Starter

This is a starter template for building AI agents using [Mastra](https://mastra.ai) and [CopilotKit](https://copilotkit.ai). It provides a modern Next.js application with integrated AI capabilities and a beautiful UI.

## Prerequisites

- Node.js 18+ 
- Any of the following package managers:
  - pnpm (recommended)
  - npm
  - yarn
  - bun

> **Note:** This repository ignores lock files (package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb) to avoid conflicts between different package managers. Each developer should generate their own lock file using their preferred package manager. After that, make sure to delete it from the .gitignore.

## Getting Started

1. Add your OpenAI API key
```bash
# you can use whatever model Mastra supports
echo "OPENAI_API_KEY=your-key-here" >> .env
```

2. Install dependencies using your preferred package manager:
```bash
# Using pnpm (recommended)
pnpm install

# Using npm
npm install

# Using yarn
yarn install

# Using bun
bun install
```

2. Start the development server:
```bash
# Using pnpm
pnpm dev

# Using npm
npm run dev

# Using yarn
yarn dev

# Using bun
bun run dev
```

This will start both the UI and agent servers concurrently.

## Available Scripts
The following scripts can also be run using your preferred package manager:
- `dev` - Starts both UI and agent servers in development mode
- `dev:debug` - Starts development servers with debug logging enabled
- `build` - Builds the application for production
- `start` - Starts the production server
- `lint` - Runs ESLint for code linting

## Documentation

- [Mastra Documentation](https://mastra.ai/en/docs) - Learn more about Mastra and its features
- [CopilotKit Documentation](https://docs.copilotkit.ai) - Explore CopilotKit's capabilities
- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## **Local File-Based Storage**

Instead of `":memory:"` or `"file::memory:"`, use a file path:

```typescript
// For Mastra main storage (src/mastra/index.ts)
storage: new LibSQLStore({
  url: "file:./data/mastra.db"  // Creates a local SQLite file
})

// For agent memory (src/mastra/agents/index.ts)
storage: new LibSQLStore({ 
  url: "file:./data/agent-memory.db" 
})
```

This creates SQLite database files in a local `./data/` directory.

## **Hosting Options**

### **1. Local SQLite Files (Simple Hosting)**
```typescript
storage: new LibSQLStore({
  url: "file:/app/data/mastra.db"  // Absolute path for production
})
```
- **Pros**: Simple, no external dependencies
- **Cons**: Data tied to specific server instance

### **2. Turso (LibSQL Cloud)**
```typescript
storage: new LibSQLStore({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
})
```
- **Pros**: Distributed, scalable, built for LibSQL
- **Cons**: Requires external service

### **3. Remote SQLite with HTTP**
```typescript
storage: new LibSQLStore({
  url: "https://your-domain.com/path/to/database.db"
})
```

## **Environment Variables Setup**

Create a `.env` file for different environments:

```bash
# .env.local (development)
DATABASE_URL="file:./data/mastra.db"

# .env.production (production)
DATABASE_URL="your-production-database-url"
TURSO_AUTH_TOKEN="your-auth-token"
```

Then update your code:

```typescript
// src/mastra/index.ts
export const mastra = new Mastra({
  agents: { 
    linkedInPostAgent
  },
  storage: new LibSQLStore({
    url: process.env.DATABASE_URL || "file:./data/mastra.db"
  }),
  logger: new ConsoleLogger({
    level: LOG_LEVEL,
  }),
});
```

## **For Hosting Recommendations:**

1. **Vercel/Netlify**: Use Turso (LibSQL cloud service)
2. **Docker/VPS**: Use local file storage with persistent volumes
3. **Railway/Render**: Use local files or Turso for better reliability

## **Quick Setup for Local Development:**

1. Create data directory:
```bash
mkdir data
```

2. Update your configuration:
```typescript
storage: new LibSQLStore({
  url: "file:./data/mastra.db"
})
```

3. Add to `.gitignore`:
```
data/
*.db
```

4. Run figma2html tool:
Configure in .env file
```typescript
OPENAI_API_KEY=
FIGMA_TOKEN=
FIGMA_URL=
```

Run command:
npx tsx src/mastra/tools/figma2html/test-converter.ts

This gives you persistent storage locally and flexibility for different hosting environments!