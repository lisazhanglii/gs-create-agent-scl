import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { linkedInPostAgent } from "./agents";
import { ConsoleLogger, LogLevel } from "@mastra/core/logger";

const LOG_LEVEL = process.env.LOG_LEVEL as LogLevel || "info";

export const mastra = new Mastra({
  agents: { 
    linkedInPostAgent
  },
  storage: new LibSQLStore({
    url: ":memory:"
    // url: "file:./data/mastra.db" 
  }),
  logger: new ConsoleLogger({
    level: LOG_LEVEL,
  }),
});