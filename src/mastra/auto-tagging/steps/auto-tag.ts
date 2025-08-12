import {createStep} from '@mastra/core/workflows';
import {z} from 'zod';
import {namingOutputSchema} from '../schemata';
import {htmlAutotaggerAgent} from '../agents/html-autotagger-agent';

export const autoTagHtmlTemplate = createStep({
  id: 'auto-tag-html-template',
  inputSchema: z.object({
    htmlContent: z.string().describe('Complete HTML content to be auto-tagged'),
  }),
  outputSchema: namingOutputSchema,
  execute: async ({inputData, mastra}) => {
    mastra.getLogger().info('Auto-tagging HTML template');
    const {htmlContent} = inputData;

    const response = await htmlAutotaggerAgent.generate(
      [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `
Please analyze and auto-tag the following HTML content:

HTML Content:
\`\`\`html
${htmlContent}
\`\`\`

Replace text content and image sources with appropriate template placeholders ({{headline}}, {{image}}, {{cta}}, {{on_image_text}}) while preserving all HTML structure and CSS.

Return ONLY the complete modified HTML in the autoTaggedHtml field.
              `,
            },
          ],
        },
      ],
      {
        output: namingOutputSchema,
      },
    );

    return response.object;
  },
});
