/**
 * Figma API Client - Based on real API data structure
 * Used to fetch real Figma data and convert it to a format usable by the converter
 */

import { FigmaNode, FigmaTextNode, FigmaFrameNode, convertFigmaToHtml } from './figma-to-html-converter';


interface FigmaApiNode {
  id: string;
  name: string;
  type: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  visible?: boolean;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  absoluteRenderBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  absoluteTransform?: number[][];
  children?: FigmaApiNode[];
  
  characters?: string;
  style?: {
    fontFamily?: string;
    fontPostScriptName?: string;
    fontStyle?: string;
    fontWeight?: number;
    fontSize?: number;
    lineHeightPx?: number;
    lineHeightPercent?: number;
    lineHeightPercentFontSize?: number;
    lineHeightUnit?: string;
    letterSpacing?: number;
    textAlignHorizontal?: string;
    textAlignVertical?: string;
    textDecoration?: string;
    textCase?: string;
    textAutoResize?: string;
  };
  fills?: Array<{
    type: string;
    blendMode?: string;
    color?: {
      r: number;
      g: number;
      b: number;
      a?: number;
    };
    opacity?: number;
  }>;
  effects?: Array<{
    type: string;
    visible?: boolean;
    color?: {
      r: number;
      g: number;
      b: number;
      a: number;
    };
    offset?: {
      x: number;
      y: number;
    };
    radius?: number;
  }>;
  
  backgroundColor?: {
    r: number;
    g: number;
    b: number;
  };
  cornerRadius?: number;
  
  styleOverrideTable?: Record<string, any>;
  characterStyleOverrides?: number[];
}

interface FigmaApiResponse {
  document: FigmaApiNode;
  components: Record<string, any>;
  componentSets: Record<string, any>;
  styles: Record<string, any>;
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
}

class FigmaApiClient {
  private accessToken: string;
  private baseUrl: string = 'https://api.figma.com/v1';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Get Figma file data
   */
  async getFile(fileKey: string): Promise<FigmaApiResponse> {
    const response = await fetch(`${this.baseUrl}/files/${fileKey}`, {
      headers: {
        'X-Figma-Token': this.accessToken
      }
    });

    if (!response.ok) {
      throw new Error(`Figma API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get specific node data
   */
  async getNode(fileKey: string, nodeId: string): Promise<FigmaApiNode> {
    const response = await fetch(`${this.baseUrl}/files/${fileKey}/nodes?ids=${nodeId}`, {
      headers: {
        'X-Figma-Token': this.accessToken
      }
    });

    if (!response.ok) {
      throw new Error(`Figma API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.nodes[nodeId].document;
  }

  /**
   * Extract file ID and node ID from Figma URL
   */
  parseUrl(url: string): { fileKey: string; nodeId?: string } {
    const urlMatch = url.match(/figma\.com\/design\/([a-zA-Z0-9]+)/);
    if (!urlMatch) {
      throw new Error('Invalid Figma URL');
    }

    const fileKey = urlMatch[1];
    const nodeMatch = url.match(/node-id=([^&]+)/);
    const nodeId = nodeMatch ? nodeMatch[1].replace('-', ':') : undefined;

    return { fileKey, nodeId };
  }

  /**
   * Get image URLs - supports multiple formats and scales
   */
  async getImageUrls(fileKey: string, nodeIds: string[], options: {
    format?: 'png' | 'jpg' | 'svg' | 'pdf';
    scale?: number;
  } = {}): Promise<Record<string, string>> {
    if (nodeIds.length === 0) {
      return {};
    }

    const format = options.format || 'png';
    const scale = options.scale || 2; // Default 2x high-quality
    
    const response = await fetch(
      `${this.baseUrl}/images/${fileKey}?ids=${nodeIds.join(',')}&format=${format}&scale=${scale}`,
      {
        headers: {
          'X-Figma-Token': this.accessToken
        }
      }
    );

    if (!response.ok) {
      return {};
    }

    const data = await response.json();
    const imageUrls = data.images || {};
    
    return imageUrls;
  }
}
class FigmaApiDataConverter {
  private imageUrls: Record<string, string>;

  constructor(imageUrls: Record<string, string> = {}) {
    this.imageUrls = imageUrls;
  }

  /**
   * Convert Figma API data to a format usable by the converter
   */
  convertApiNodeToFigmaNode(apiNode: FigmaApiNode): FigmaNode {
    const baseNode: FigmaNode = {
      id: apiNode.id,
      name: apiNode.name,
      type: apiNode.type,
      x: apiNode.absoluteBoundingBox?.x || 0,
      y: apiNode.absoluteBoundingBox?.y || 0,
      width: apiNode.absoluteBoundingBox?.width || 0,
      height: apiNode.absoluteBoundingBox?.height || 0,
      rotation: apiNode.rotation,
      opacity: apiNode.opacity,
      visible: apiNode.visible,
      absoluteBoundingBox: apiNode.absoluteBoundingBox,
      absoluteTransform: apiNode.absoluteTransform,
      children: apiNode.children?.map(child => this.convertApiNodeToFigmaNode(child))
    };

    // Handle text nodes (based on real API structure)
    if (apiNode.type === 'TEXT') {
      const textNode: FigmaTextNode = {
        ...baseNode,
        type: 'TEXT',
        characters: apiNode.characters || '',
        fontName: this.extractFontName(apiNode),
        fontWeight: apiNode.style?.fontWeight || 400,
        fontSize: apiNode.style?.fontSize || 16,
        lineHeight: this.extractLineHeight(apiNode),
        letterSpacing: this.extractLetterSpacing(apiNode),
        fills: this.extractFills(apiNode),
        textAlignHorizontal: this.mapTextAlignHorizontal(apiNode.style?.textAlignHorizontal || 'LEFT'),
        textAlignVertical: this.mapTextAlignVertical(apiNode.style?.textAlignVertical || 'TOP'),
        textDecoration: this.mapTextDecoration(apiNode.style?.textDecoration || 'NONE'),
        textCase: this.mapTextCase(apiNode.style?.textCase || 'ORIGINAL'),
        textAutoResize: this.mapTextAutoResize(apiNode.style?.textAutoResize || 'NONE'),
        effects: this.extractEffects(apiNode)
      };
      
      return textNode;
    }

    // Handle Frame nodes
    if (apiNode.type === 'FRAME') {
      const frameNode: FigmaFrameNode = {
        ...baseNode,
        type: 'FRAME',
        backgroundColor: apiNode.backgroundColor,
        fills: this.extractFills(apiNode),  // Add this line to extract fills
        cornerRadius: apiNode.cornerRadius,
        children: apiNode.children?.map(child => this.convertApiNodeToFigmaNode(child)) || []
      };
      return frameNode;
    }

    // Handle image nodes (RECTANGLE nodes with image URL or name containing image)
    if (this.isImageNode(apiNode)) {
      const imageNode = {
        ...baseNode,
        type: 'IMAGE' as const,
        imageUrl: this.imageUrls[apiNode.id] || '',
        fills: apiNode.fills
      };
      
      return imageNode;
    }

    return baseNode;
  }

  /**
   * Extract font name and style from real API data
   */
  private extractFontName(apiNode: FigmaApiNode): { family: string; style: string } {
    const fontFamily = apiNode.style?.fontFamily || 'Inter';
    const fontStyle = apiNode.style?.fontStyle || 'Regular';
    
    return {
      family: fontFamily,
      style: fontStyle
    };
  }

  /**
   * Extract line height from real API data
   */
  private extractLineHeight(apiNode: FigmaApiNode): { value: number; unit: 'AUTO' | 'PIXELS' | 'PERCENT' } {
    const style = apiNode.style;
    
    if (style?.lineHeightPx) {
      return {
        value: style.lineHeightPx,
        unit: 'PIXELS'
      };
    }
    
    if (style?.lineHeightPercentFontSize) {
      return {
        value: style.lineHeightPercentFontSize,
        unit: 'PERCENT'
      };
    }
    
    if (style?.lineHeightPercent) {
      return {
        value: style.lineHeightPercent,
        unit: 'PERCENT'
      };
    }

    return {
      value: 1.2,
      unit: 'AUTO'
    };
  }

  /**
   * Extract letter spacing from real API data
   */
  private extractLetterSpacing(apiNode: FigmaApiNode): { value: number; unit: 'PIXELS' | 'PERCENT' } {
    if (apiNode.style?.letterSpacing) {
      return {
        value: apiNode.style.letterSpacing,
        unit: 'PIXELS'
      };
    }

    return {
      value: 0,
      unit: 'PIXELS'
    };
  }

  /**
   * Extract fill color from real API data
   */
  private extractFills(apiNode: FigmaApiNode): Array<{
    type: 'SOLID';
    color: { r: number; g: number; b: number };
    opacity: number;
    blendMode: string;
  }> {
    if (!apiNode.fills || apiNode.fills.length === 0) {
      return [{
        type: 'SOLID',
        color: { r: 0, g: 0, b: 0 },
        opacity: 1,
        blendMode: 'NORMAL'
      }];
    }

    // Use the first valid fill (real API may have multiple fills)
    const firstValidFill = apiNode.fills.find(fill => fill.type === 'SOLID' && fill.color);
    
    if (firstValidFill && firstValidFill.color) {
      return [{
        type: 'SOLID',
        color: {
          r: firstValidFill.color.r,
          g: firstValidFill.color.g,
          b: firstValidFill.color.b
        },
        opacity: firstValidFill.color.a || firstValidFill.opacity || 1,
        blendMode: firstValidFill.blendMode || 'NORMAL'
      }];
    }

    return [{
      type: 'SOLID',
      color: { r: 0, g: 0, b: 0 },
      opacity: 1,
      blendMode: 'NORMAL'
    }];
  }

  /**
   * Extract effects (shadow, blur, etc.)
   */
  private extractEffects(apiNode: FigmaApiNode): Array<{
    type: 'DROP_SHADOW' | 'LAYER_BLUR';
    visible: boolean;
    color?: { r: number; g: number; b: number; a: number };
    offset?: { x: number; y: number };
    radius: number;
  }> {
    if (!apiNode.effects || apiNode.effects.length === 0) {
      return [];
    }

    return apiNode.effects.map(effect => ({
      type: effect.type as 'DROP_SHADOW' | 'LAYER_BLUR',
      visible: effect.visible !== false,
      color: effect.color,
      offset: effect.offset,
      radius: effect.radius || 0
    }));
  }

  private mapTextAlignHorizontal(align: string): 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED' {
    switch (align.toUpperCase()) {
      case 'LEFT': return 'LEFT';
      case 'CENTER': return 'CENTER';
      case 'RIGHT': return 'RIGHT';
      case 'JUSTIFIED': return 'JUSTIFIED';
      default: return 'LEFT';
    }
  }

  private mapTextAlignVertical(align: string): 'TOP' | 'CENTER' | 'BOTTOM' {
    switch (align.toUpperCase()) {
      case 'TOP': return 'TOP';
      case 'CENTER': return 'CENTER';
      case 'BOTTOM': return 'BOTTOM';
      default: return 'TOP';
    }
  }

  private mapTextDecoration(decoration: string): 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH' {
    switch (decoration.toUpperCase()) {
      case 'UNDERLINE': return 'UNDERLINE';
      case 'STRIKETHROUGH': return 'STRIKETHROUGH';
      default: return 'NONE';
    }
  }

  private mapTextCase(textCase: string): 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE' {
    switch (textCase.toUpperCase()) {
      case 'UPPER': return 'UPPER';
      case 'LOWER': return 'LOWER';
      case 'TITLE': return 'TITLE';
      default: return 'ORIGINAL';
    }
  }

  private mapTextAutoResize(autoResize: string): 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' {
    switch (autoResize.toUpperCase()) {
      case 'WIDTH_AND_HEIGHT': return 'WIDTH_AND_HEIGHT';
      case 'HEIGHT': return 'HEIGHT';
      default: return 'NONE';
    }
  }

  /**
   * Check if it is an image node
   */
  private isImageNode(apiNode: FigmaApiNode): boolean {
    // Check if there is a corresponding image URL
    if (this.imageUrls[apiNode.id]) {
      return true;
    }
    
    // Check node type and name
    const isRectangle = apiNode.type === 'RECTANGLE';
    const nameIndicatesImage = apiNode.name && 
      (apiNode.name.toLowerCase().includes('image') || 
       apiNode.name.toLowerCase().includes('img') ||
       apiNode.name.toLowerCase().includes('photo') ||
       apiNode.name.toLowerCase().includes('picture'));
    
    // Check if there is an image fill (fills contains IMAGE type)
    const hasImageFill = apiNode.fills && apiNode.fills.some(fill => fill.type === 'IMAGE');
    
    return isRectangle && (nameIndicatesImage || hasImageFill);
  }

  /**
   * Collect all possible image node IDs
   */
  static collectImageNodeIds(node: FigmaApiNode): string[] {
    const imageIds: string[] = [];
    
    // Check current node
    const isRectangle = node.type === 'RECTANGLE';
    const nameIndicatesImage = node.name && 
      (node.name.toLowerCase().includes('image') || 
       node.name.toLowerCase().includes('img') ||
       node.name.toLowerCase().includes('photo') ||
       node.name.toLowerCase().includes('picture'));
    const hasImageFill = node.fills && node.fills.some(fill => fill.type === 'IMAGE');
    
    if (isRectangle && (nameIndicatesImage || hasImageFill)) {
      imageIds.push(node.id);
    }
    
    // Recursively check child nodes
    if (node.children) {
      node.children.forEach(child => {
        imageIds.push(...FigmaApiDataConverter.collectImageNodeIds(child));
      });
    }
    
    return imageIds;
  }
}

/**
 * Get node from Figma URL and convert to HTML
 */
export async function convertFigmaUrlToHtml(
  url: string,
  accessToken: string,
  options?: any
): Promise<string> {
  const client = new FigmaApiClient(accessToken);
  
  try {
    // Parse URL
    const { fileKey, nodeId } = client.parseUrl(url);

    // Get data
    let apiNode: FigmaApiNode;
    if (nodeId) {
      apiNode = await client.getNode(fileKey, nodeId);
    } else {
      const fileData = await client.getFile(fileKey);
      apiNode = fileData.document;
    }

    // Collect image node IDs
    const imageNodeIds = FigmaApiDataConverter.collectImageNodeIds(apiNode);

    // Get image URLs
    let imageUrls = {};
    if (imageNodeIds.length > 0) {
      try {
        imageUrls = await client.getImageUrls(fileKey, imageNodeIds, {
          format: 'png',
          scale: 2 // High-quality image
        });
      } catch (error) {
        // Continue without images if image fetching fails
      }
    }

    // Convert data format (pass in image URLs)
    const converter = new FigmaApiDataConverter(imageUrls);
    const figmaNode = converter.convertApiNodeToFigmaNode(apiNode);

    // Convert to HTML
    const html = convertFigmaToHtml(figmaNode, options);

    return html;

  } catch (error) {
    throw error;
  }
}

// Export
export { FigmaApiClient, FigmaApiDataConverter }; 