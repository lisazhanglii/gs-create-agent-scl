import { convertFigmaUrlToHtml } from './figma-api-client';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import dotenv from 'dotenv';
// Load environment variables
dotenv.config();

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FIGMA_URL = process.env.FIGMA_URL;
async function testRealFigmaApi() {
    if (!FIGMA_TOKEN || !FIGMA_URL) {
        throw new Error('FIGMA_TOKEN and FIGMA_URL must be set in environment variables');
    }
    
    const html = await convertFigmaUrlToHtml(FIGMA_URL, FIGMA_TOKEN, {  
      enableResponsive: true,
      preserveTextEffects: true,
      precision: 4
    });
  return html;
}
async function saveOutputs() {
  try {
    const realHtml = await testRealFigmaApi();
    try {
      const outputPath = 'src/mastra/htmlAssets/figma-output.html';
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, realHtml);
    } catch (error) {
      console.error('Error in saveOutputs:', error);
      throw error;
    }
  
  } catch (error) {
    console.error('Error in saveOutputs:', error);
    throw error;
  }
}

// Run the save operation when this file is executed directly
if (require.main === module) {
  saveOutputs().catch(console.error);
}

export { testRealFigmaApi, saveOutputs }; 