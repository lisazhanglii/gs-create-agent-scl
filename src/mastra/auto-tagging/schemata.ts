import { z } from 'zod';

// Simple schema for auto-tagged HTML output
export const namingOutputSchema = z.object({
  autoTaggedHtml: z.string().describe('The HTML content with template placeholders replacing original content'),
});


