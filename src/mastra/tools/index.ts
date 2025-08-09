import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Define the handler for the LinkedIn post tool
const generateLinkedInPost = async (goal: string, brand: string, topic: string) => {
  console.log(`Generating LinkedIn post for ${brand} about ${topic} with goal: ${goal}...`);
  
  // Generate content based on inputs
  const introText = `Discover how ${brand} is revolutionizing ${topic}. ${goal}`;
  const imageText = `${topic} Innovation`;
  const headline = `Transform Your Business with ${topic}`;
  const website = `${brand.toLowerCase().replace(/\s+/g, '')}.com`;
  const ctaText = "Learn More";

  // Use a simple default professional background
  const defaultImage = '/assets/AdobeStock_122578479.png';

  // Create the HTML with default styling
  const html = `
    <div style="max-width: 504px; margin: 0 auto; border: 1px solid #e0e0e0; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; overflow: hidden; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="padding: 12px 16px; border-bottom: 1px solid #e0e0e0;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 40px; height: 40px; background: #000000; display: flex; align-items: center; justify-content: center; border-radius: 2px;">
            <div style="width: 32px; height: 32px; background: white; display: flex; align-items: center; justify-content: center; color: black; font-weight: bold; font-size: 14px;">
              ${brand.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase()}
            </div>
          </div>
          <div>
            <div style="font-weight: 600; font-size: 14px; color: #000000; line-height: 1.2;">${brand}</div>
            <div style="font-size: 12px; color: #666666; line-height: 1.2;">Promoted</div>
          </div>
        </div>
      </div>
      
      <!-- Introductory Text -->
      <div style="padding: 16px; border-bottom: 1px solid #e0e0e0;">
        <div style="font-size: 14px; color: #000000; line-height: 1.4;">${introText}</div>
      </div>
      
      <!-- Image Section -->
      <div style="position: relative; width: 100%; height: 300px; background-image: url('${defaultImage}'); background-size: cover; background-position: center; background-repeat: no-repeat; display: flex; align-items: center; justify-content: center;">
        <div style="color: white; font-size: 18px; font-weight: 600; text-align: center; text-shadow: 0 2px 8px rgba(0,0,0,0.8); background: rgba(0,0,0,0.4); padding: 12px 20px; border-radius: 6px; backdrop-filter: blur(4px);">
          ${imageText}
        </div>
      </div>
      
      <!-- Bottom Section -->
      <div style="padding: 16px; background: white;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1;">
            <div style="font-size: 16px; font-weight: 600; color: #000000; line-height: 1.3; margin-bottom: 4px;">
              ${headline}
            </div>
            <div style="font-size: 12px; color: #666666; line-height: 1.2;">
              ${website}
            </div>
          </div>
          <button style="background: #0073b1; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-size: 14px; font-weight: 600; cursor: pointer; margin-left: 16px; white-space: nowrap; transition: background-color 0.2s;">
            ${ctaText}
          </button>
        </div>
      </div>
    </div>
  `;

  const content = `${introText}\n\n${headline}\n\nVisit: ${website}`;

  return {
    content,
    html,
    introText,
    imageText,
    headline,
    website,
    ctaText,
    hashtags: [],
    characterCount: content.length
  };
};

// LinkedIn post generation tool
export const linkedInPostTool = createTool({
  id: "Generate LinkedIn Post",
  description: "Generates a LinkedIn sponsored post with HTML UI component",
  inputSchema: z.object({
    goal: z.string().describe("The goal or objective of the post"),
    brand: z.string().describe("The brand or company name"),
    topic: z.string().describe("The main topic or theme of the post"),
  }),
  outputSchema: z.object({
    content: z.string().describe("The generated post content"),
    html: z.string().describe("The HTML representation of the LinkedIn post"),
    introText: z.string().describe("The introductory text"),
    imageText: z.string().describe("Text overlay on the image"),
    headline: z.string().describe("The main headline"),
    website: z.string().describe("The website URL"),
    ctaText: z.string().describe("Call-to-action button text"),
    hashtags: z.array(z.string()).describe("Extracted hashtags from the content"),
    characterCount: z.number().describe("Character count of the content"),
  }),
  execute: async ({ context: { goal, brand, topic } }) => {
    console.log("Using tool to generate LinkedIn post", { goal, brand, topic });
    return await generateLinkedInPost(goal, brand, topic);
  },
});