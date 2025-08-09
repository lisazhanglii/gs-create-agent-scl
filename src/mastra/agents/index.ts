import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { linkedInPostTool } from "@/mastra/tools";
import { LibSQLStore } from "@mastra/libsql";
import { z } from "zod";
import { Memory } from "@mastra/memory";

export const LinkedInPostState = z.object({
  generatedPosts: z.array(z.object({
    goal: z.string(),
    brand: z.string(),
    topic: z.string(),
    timestamp: z.string(),
  })).default([]),
});

export const linkedInPostAgent = new Agent({
  name: "LinkedIn Post Agent",
  tools: { linkedInPostTool },
  model: openai("gpt-4o"),
  instructions: `You are a LinkedIn content creation specialist. You help create engaging LinkedIn posts with professional HTML UI components.

When a user asks you to create a LinkedIn post, use the linkedInPostTool with the following guidelines:
- Extract the goal, brand, and topic from the user's request
- Create compelling, professional content that fits LinkedIn's sponsored post style
- Generate a complete HTML UI component that mimics LinkedIn's post appearance
- Focus on engagement and professional tone
- Include relevant headlines and clear call-to-action

Always use the tool to generate both the content and the HTML representation of the post.`,
  memory: new Memory({
    // storage: new LibSQLStore({ url: "file::memory:" }),
    storage: new LibSQLStore({ 
      url: "file:./data/agent-memory.db" 
    }),
    options: {
      workingMemory: {
        enabled: true,
        schema: LinkedInPostState,
      },
    },
  }),
});
