import { autoTagHtmlTemplate } from './auto-tagging/steps/auto-tag';
import { mastra } from './index';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export async function testAutoTagHtml() {
  try {
    // Read the example HTML file from the correct location
    const htmlContent = readFileSync(
      join(__dirname, 'htmlAssets/figma-output.html'), 
      'utf-8'
    );

    // Auto-tag the HTML
    const result = await autoTagHtmlTemplate.execute({
      inputData: {
        htmlContent
      },
      mastra: mastra
    });

    
    return result.autoTaggedHtml;
  } catch (error) {
    console.error('Error during auto-tagging:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAutoTagHtml()
    .then((result) => {
      
      writeFileSync(
        join(__dirname, 'htmlAssets/auto-tagged-example.html'), 
        result, 
        'utf-8'
      );
      console.log('Auto-tagged HTML saved to: htmlAssets/auto-tagged-example.html');
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}
