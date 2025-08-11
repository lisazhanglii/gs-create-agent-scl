// ============================
// Type definitions
// ============================

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  visible?: boolean;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  absoluteTransform?: number[][];
  children?: FigmaNode[];
}

interface FigmaTextNode extends FigmaNode {
  type: 'TEXT';
  characters: string;
  fontName: {
    family: string;
    style: string;
  };
  fontWeight: number;
  fontSize: number;
  lineHeight: {
    value: number;
    unit: 'AUTO' | 'PIXELS' | 'PERCENT';
  };
  letterSpacing: {
    value: number;
    unit: 'PIXELS' | 'PERCENT';
  };
  fills: Array<{
    type: 'SOLID';
    color: {
      r: number;
      g: number;
      b: number;
    };
    opacity: number;
    blendMode: string;
  }>;
  textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAlignVertical: 'TOP' | 'CENTER' | 'BOTTOM';
  textDecoration: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
  textCase: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';
  textAutoResize: 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT';
  effects?: Array<{
    type: 'DROP_SHADOW' | 'LAYER_BLUR';
    visible: boolean;
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
    radius: number;
  }>;
}

interface FigmaFrameNode extends FigmaNode {
  type: 'FRAME';
  backgroundColor?: {
    r: number;
    g: number;
    b: number;
  };
  fills?: Array<{
    type: 'SOLID';
    color: { r: number; g: number; b: number };
    opacity: number;
    blendMode: string;
  }>;
  cornerRadius?: number;
  children: FigmaNode[];
}

interface FigmaImageNode extends FigmaNode {
  type: 'IMAGE';
  imageUrl: string;
  fills?: Array<{
    type: string;
    color?: {
      r: number;
      g: number;
      b: number;
    };
    opacity?: number;
  }>;
}

interface ProcessedElement {
  id: string;
  tag: string;
  content: string;
  styles: CSSStyleObject;
  position: ElementPosition;
  children: ProcessedElement[];
  classes: string[];
  attributes: Record<string, string>;
}

interface ElementPosition {
  x: string;
  y: string;
  width: string;
  height?: string;
  transform?: string;
  transformOrigin?: string;
}

interface CSSStyleObject {
  [key: string]: string | number;
}

interface ConversionOptions {
  containerWidth: number;
  containerHeight: number;
  scaleFactor: number;
  enableResponsive: boolean;
  preserveTextEffects: boolean;
  optimizeOutput: boolean;
  precision: number;
}

// ============================
// Improved position calculator
// ============================

class EnhancedPositionCalculator {
  private precision: number;

  constructor(precision: number = 4) {
    this.precision = precision;
  }

  /**
   * Calculate the precise position of the element relative to the container
   * Based on the alignment calculation of the original repo
   */
  calculatePosition(
    element: FigmaNode,
    container: FigmaNode,
    options: ConversionOptions
  ): ElementPosition {
    // Prefer absoluteBoundingBox for more accuracy
    const elementBounds = element.absoluteBoundingBox || {
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height
    };

    const containerBounds = container.absoluteBoundingBox || {
      x: container.x,
      y: container.y,
      width: container.width,
      height: container.height
    };

    let x = 0;
    let y = 0;
    let translateX = 0;
    let translateY = 0;

    // Handle text element alignment (refer to original repo logic)
    if (element.type === 'TEXT') {
      const textNode = element as FigmaTextNode;
      
      // Calculate x position based on horizontal alignment
      switch (textNode.textAlignHorizontal) {
        case 'JUSTIFIED':
        case 'LEFT':
          x = ((elementBounds.x - containerBounds.x) / containerBounds.width) * 100;
          translateX = 0;
          break;
        case 'CENTER':
          x = ((elementBounds.x - containerBounds.x) / containerBounds.width + (elementBounds.width / containerBounds.width) / 2) * 100;
          translateX = -50;
          break;
        case 'RIGHT':
          x = ((elementBounds.x + elementBounds.width - containerBounds.x) / containerBounds.width) * 100;
          translateX = -100;
          break;
      }

      // Calculate y position based on vertical alignment
      switch (textNode.textAlignVertical) {
        case 'TOP':
          y = ((elementBounds.y - containerBounds.y) / containerBounds.height) * 100;
          translateY = 0;
          break;
        case 'CENTER':
          y = ((elementBounds.y + elementBounds.height / 2 - containerBounds.y) / containerBounds.height) * 100;
          translateY = -50;
          break;
        case 'BOTTOM':
          y = ((elementBounds.y + elementBounds.height - containerBounds.y) / containerBounds.height) * 100;
          translateY = -100;
          break;
      }
    } else {
      // Non-text element position calculation
      x = ((elementBounds.x - containerBounds.x) / containerBounds.width) * 100;
      y = ((elementBounds.y - containerBounds.y) / containerBounds.height) * 100;
    }

    // Calculate width and height
    const relativeWidth = options.enableResponsive
      ? (elementBounds.width / containerBounds.width) * 100
      : elementBounds.width;

    const relativeHeight = options.enableResponsive
      ? (elementBounds.height / containerBounds.height) * 100
      : elementBounds.height;

    // Handle rotation and transform
    const transform = this.calculateTransform(element, { translateX, translateY });

    return {
      x: `${x.toFixed(this.precision)}%`,
      y: `${y.toFixed(this.precision)}%`,
      width: options.enableResponsive 
        ? `${relativeWidth.toFixed(this.precision)}%` 
        : `${relativeWidth.toFixed(this.precision)}px`,
      height: options.enableResponsive 
        ? `${relativeHeight.toFixed(this.precision)}%` 
        : `${relativeHeight.toFixed(this.precision)}px`,
      transform: transform.transform,
      transformOrigin: transform.transformOrigin
    };
  }

  /**
   * Calculate transform (rotation, scaling, etc.)
   */
  private calculateTransform(
    element: FigmaNode,
    position: { translateX: number; translateY: number }
  ): { transform?: string; transformOrigin?: string } {
    const transforms: string[] = [];
    
    // Add alignment transform
    if (position.translateX !== 0 || position.translateY !== 0) {
      transforms.push(`translate(${position.translateX}%, ${position.translateY}%)`);
    }

    // Add rotation (original repo uses rotation * -1)
    if (element.rotation && element.rotation !== 0) {
      transforms.push(`rotate(${(element.rotation * -1).toFixed(2)}deg)`);
    }

    return {
      transform: transforms.length > 0 ? transforms.join(' ') : undefined,
      transformOrigin: transforms.length > 0 ? 'left top' : undefined
    };
  }
}

// ============================
// Improved style extractor
// ============================

class EnhancedStyleExtractor {
  private fontList: Set<string> = new Set();

  /**
   * Extract complete CSS styles (based on original repo implementation)
   */
  extractStyles(element: FigmaNode, options: ConversionOptions): CSSStyleObject {
    const styles: CSSStyleObject = {};

    // Basic styles
    this.addBasicStyles(element, styles);

    // Frame styles
    if (element.type === 'FRAME') {
      this.addFrameStyles(element as FigmaFrameNode, styles);
    }

    // Text styles
    if (element.type === 'TEXT') {
      this.addTextStyles(element as FigmaTextNode, styles, options);
    }

    // Effect styles
    if (options.preserveTextEffects && element.type === 'TEXT') {
      this.addEffectStyles(element as FigmaTextNode, styles);
    }

    return styles;
  }

  /**
   * Add basic styles
   */
  private addBasicStyles(element: FigmaNode, styles: CSSStyleObject): void {
    // Positioning (all elements are absolutely positioned)
    styles.position = 'absolute';

    // Opacity
    if (element.opacity !== undefined && element.opacity !== 1) {
      styles.opacity = element.opacity;
    }

    // Visibility
    if (element.visible === false) {
      styles.display = 'none';
    }
  }

  /**
   * Add text styles (based on original repo's styleProps logic)
   */
  private addTextStyles(
    textNode: FigmaTextNode,
    styles: CSSStyleObject,
    options: ConversionOptions
  ): void {
    // Add margin-top and margin-bottom specifically for text nodes
    styles['margin-top'] = '0px';
    styles['margin-bottom'] = '0px';

    // Font family
    if (textNode.fontName) {
      styles['font-family'] = this.sanitizeFontFamily(textNode.fontName.family);
      
      // Font style (italic detection)
      styles['font-style'] = textNode.fontName.style.includes('Italic') ? 'italic' : 'normal';
      
      // Record font for later processing
      this.fontList.add(textNode.fontName.family);
    }

    // Font weight
    if (textNode.fontWeight) {
      styles['font-weight'] = textNode.fontWeight;
    }

    // Font size
    if (textNode.fontSize) {
      styles['font-size'] = `${textNode.fontSize}px`;
    }

    // Line height (handled as in original repo)
    if (textNode.lineHeight) {
      styles['line-height'] = this.calculateLineHeight(textNode.lineHeight);
    }

    // Letter spacing (handled as in original repo)
    if (textNode.letterSpacing) {
      styles['letter-spacing'] = this.calculateLetterSpacing(textNode.letterSpacing);
    }

    // Color (based on original repo's fill handling)
    if (textNode.fills && textNode.fills.length > 0) {
      const fill = textNode.fills[0];
      if (fill.type === 'SOLID') {
        styles.color = this.rgbToRgba(fill.color, fill.opacity);
        
        // Blend mode
        if (fill.blendMode && fill.blendMode !== 'NORMAL') {
          styles['mix-blend-mode'] = fill.blendMode.toLowerCase();
        }
      }
    }

    // Text decoration
    if (textNode.textDecoration && textNode.textDecoration !== 'NONE') {
      styles['text-decoration'] = textNode.textDecoration.toLowerCase();
    }

    // Text transform
    if (textNode.textCase && textNode.textCase !== 'ORIGINAL') {
      styles['text-transform'] = textNode.textCase.toLowerCase();
    }

    // Text alignment
    if (textNode.textAlignHorizontal) {
      styles['text-align'] = textNode.textAlignHorizontal.toLowerCase();
    }

    // Auto resize
    if (textNode.textAutoResize === 'WIDTH_AND_HEIGHT') {
      styles['white-space'] = 'nowrap';
    }
  }

  /**
   * Add effect styles (shadow, blur, etc.) - based on original repo's textEffect logic
   */
  private addEffectStyles(textNode: FigmaTextNode, styles: CSSStyleObject): void {
    if (!textNode.effects || textNode.effects.length === 0) return;

    const shadows: string[] = [];
    const dropShadows = textNode.effects.filter(effect => effect.type === 'DROP_SHADOW' && effect.visible);
    
    if (dropShadows.length > 0) {
      dropShadows.forEach(effect => {
        if (effect.offset && effect.color) {
          const x = effect.offset.x;
          const y = effect.offset.y;
          const r = effect.radius;
          const rgba = `rgba(${Math.round(effect.color.r * 255)}, ${Math.round(effect.color.g * 255)}, ${Math.round(effect.color.b * 255)}, ${effect.color.a})`;
          shadows.push(`${x}px ${y}px ${r}px ${rgba}`);
        }
      });
      
      if (shadows.length > 0) {
        styles['text-shadow'] = shadows.join(', ');
      }
    }

    const layerBlurs = textNode.effects.filter(effect => effect.type === 'LAYER_BLUR' && effect.visible);
    if (layerBlurs.length > 0) {
      const blurRadius = layerBlurs[0].radius;
      styles.filter = `blur(${blurRadius}px)`;
      styles['-webkit-filter'] = `blur(${blurRadius}px)`;
    }
  }

  /**
   * Calculate line height (as in original repo)
   */
  private calculateLineHeight(lineHeight: FigmaTextNode['lineHeight']): string {
    if (lineHeight.unit === 'AUTO') {
      return 'normal';
    }
    
    if (lineHeight.unit === 'PERCENT' && lineHeight.value > 0) {
      return (lineHeight.value / 100).toString();
    }
    
    // PIXELS
    return `${lineHeight.value}px`;
  }

  private addFrameStyles(frameNode: FigmaFrameNode, styles: CSSStyleObject): void {
    if (frameNode.backgroundColor) {
      const { r, g, b } = frameNode.backgroundColor;
      styles['background-color'] = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
    }
    
    // Handle fills if present (takes precedence over backgroundColor)
    if (frameNode.fills && frameNode.fills.length > 0) {
      const fill = frameNode.fills[0];
      if (fill.type === 'SOLID') {
        const { r, g, b } = fill.color;
        styles['background-color'] = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${fill.opacity})`;
        if (fill.blendMode !== 'NORMAL') {
          styles['mix-blend-mode'] = fill.blendMode.toLowerCase();
        }
      }
    }
  }

  /**
   * Calculate letter spacing (as in original repo)
   */
  private calculateLetterSpacing(letterSpacing: FigmaTextNode['letterSpacing']): string {
    if (letterSpacing.unit === 'PERCENT' && letterSpacing.value > 0) {
      return (letterSpacing.value / 100).toString();
    }
    
    // PIXELS
    return `${letterSpacing.value}px`;
  }

  /**
   * Convert color format
   */
  private rgbToRgba(color: { r: number; g: number; b: number }, alpha: number = 1): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    
    if (alpha === 1) {
      return `rgb(${r}, ${g}, ${b})`;
    }
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Clean up font family name
   */
  private sanitizeFontFamily(fontFamily: string): string {
    // Add quotes if there are spaces
    if (fontFamily.includes(' ')) {
      return `"${fontFamily}"`;
    }
    return fontFamily;
  }

  /**
   * Get the list of used fonts
   */
  getUsedFonts(): string[] {
    return Array.from(this.fontList);
  }
}

// ============================
// Main converter
// ============================

class FigmaToHtmlConverter {
  private positionCalculator: EnhancedPositionCalculator;
  private styleExtractor: EnhancedStyleExtractor;
  private elementCounter: number = 0;

  constructor(precision: number = 4) {
    this.positionCalculator = new EnhancedPositionCalculator(precision);
    this.styleExtractor = new EnhancedStyleExtractor();
  }

  /**
   * Convert Figma node to HTML
   */
  convert(figmaNode: FigmaNode, options: Partial<ConversionOptions> = {}): string {
    const defaultOptions: ConversionOptions = {
      containerWidth: figmaNode.width,
      containerHeight: figmaNode.height,
      scaleFactor: 1,
      enableResponsive: true,
      preserveTextEffects: true,
      optimizeOutput: true,
      precision: 4
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    // Reset counter
    this.elementCounter = 0;

    // Process node
    const processedElement = this.processNode(figmaNode, figmaNode, finalOptions);

    // Generate HTML
    const html = this.generateHtml(processedElement, finalOptions);

    return html;
  }

  /**
   * Recursively process nodes
   */
  private processNode(
    node: FigmaNode,
    container: FigmaNode,
    options: ConversionOptions
  ): ProcessedElement {
    this.elementCounter++;

    const element: ProcessedElement = {
      id: this.sanitizeId(`figma-${node.id || this.elementCounter}`),
      tag: this.getHtmlTag(node),
      content: this.getNodeContent(node),
      styles: this.styleExtractor.extractStyles(node, options),
      position: this.positionCalculator.calculatePosition(node, container, options),
      children: [],
      classes: this.getNodeClasses(node),
      attributes: this.getNodeAttributes(node)
    };

    // Add position styles
    this.addPositionStyles(element.styles, element.position);

    // Process child nodes
    if ('children' in node && node.children) {
      element.children = node.children.map(child => 
        this.processNode(child, container, options)
      );
    }

    return element;
  }

  /**
   * Clean up special characters in ID (fix CSS selector issues)
   */
  private sanitizeId(id: string): string {
    // Replace colons and other special characters with hyphens
    return id.replace(/[^a-zA-Z0-9-_]/g, '-');
  }

  /**
   * Determine HTML tag
   */
  private getHtmlTag(node: FigmaNode): string {
    switch (node.type) {
      case 'TEXT':
        return 'p';
      case 'FRAME':
        return 'div';
      case 'IMAGE':
        return 'img';
      default:
        return 'div';
    }
  }

  /**
   * Get node content
   */
  private getNodeContent(node: FigmaNode): string {
    if (node.type === 'TEXT') {
      return (node as FigmaTextNode).characters || '';
    }
    return '';
  }

  /**
   * Get node class names
   */
  private getNodeClasses(node: FigmaNode): string[] {
    const classes: string[] = [];
    
    classes.push(`figma-${node.type.toLowerCase()}`);

    return classes;
  }

  /**
   * Get node attributes
   */
  private getNodeAttributes(node: FigmaNode): Record<string, string> {
    const attributes: Record<string, string> = {};

    // Image-specific attributes
    if (node.type === 'IMAGE') {
      const imageNode = node as FigmaImageNode;
      if (imageNode.imageUrl) {
        attributes['src'] = imageNode.imageUrl;
      } else {
        // Keep data-placeholder - it's used for styling!
        attributes['data-placeholder'] = 'true';
        attributes['alt'] = `${node.name || 'Image'} (placeholder)`;
      }
    }

    return attributes;
  }

  /**
   * Add position styles
   */
  private addPositionStyles(styles: CSSStyleObject, position: ElementPosition): void {
    styles.left = position.x;
    styles.top = position.y;
    styles.width = position.width;
    
    if (position.height) {
      styles.height = position.height;
    }
    
    if (position.transform) {
      styles.transform = position.transform;
    }
    
    if (position.transformOrigin) {
      styles['transform-origin'] = position.transformOrigin;
    }
  }

  /**
   * Generate HTML
   */
  private generateHtml(element: ProcessedElement, options: ConversionOptions): string {
    const css = this.generateCss(element, options);
    const html = this.generateElementHtml(element);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Figma to HTML</title>
    <style>
        ${css}
    </style>
</head>
<body>
    <div class="figma-container">
        ${html}
    </div>
</body>
</html>`;
  }

  /**
   * Generate CSS
   */
  private generateCss(element: ProcessedElement, options: ConversionOptions): string {
    let css = `
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        .figma-container {
            width: ${options.containerWidth}px;
            height: ${options.containerHeight}px;
            position: relative;
            overflow: hidden;
        }
        
        .figma-text {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .figma-frame {
            overflow: hidden;
        }
        
        .figma-image {
            object-fit: cover;
            object-position: center;
            max-width: 100%;
            max-height: 100%;
        }
        .figma-image[data-placeholder="true"] {
            background-repeat: no-repeat;
            background-position: center;
            background-size: 48px 48px;
            border: 1px dashed #ccc;
            box-sizing: border-box;
        }
    `;

    // Recursively generate element styles
    css += this.generateElementCss(element);

    return css;
  }

  /**
   * Generate element CSS
   */
  private generateElementCss(element: ProcessedElement): string {
    let css = '';

    // Generate current element's styles
    const styleString = Object.entries(element.styles)
      .map(([key, value]) => `${key}: ${value};`)
      .join(' ');

    if (styleString) {
      css += `\n        .${element.id} { ${styleString} }`;  // Changed from # to .
    }

    // Recursively generate child element styles
    element.children.forEach(child => {
      css += this.generateElementCss(child);
    });

    return css;
  }

  /**
   * Generate element HTML
   */
  private generateElementHtml(element: ProcessedElement): string {
    // Add the element.id as a class instead of an id
    const classes = [element.id, ...element.classes];
    
    const attributes = [
      `class="${classes.join(' ')}"`,
      ...Object.entries(element.attributes).map(([key, value]) => `${key}="${value}"`)
    ].join(' ');

    const childrenHtml = element.children
      .map(child => this.generateElementHtml(child))
      .join('');

      if (element.content) {
        return `<div ${attributes} data-line="821"><${element.tag}>${element.content}${childrenHtml}</${element.tag}></div>`;
      } else {
        return `<div ${attributes} data-line="823"><${element.tag} >${childrenHtml}</${element.tag}></div>`;
      }
  }

  /**
   * Get the list of used fonts
   */
  getUsedFonts(): string[] {
    return this.styleExtractor.getUsedFonts();
  }
}

// ============================
// Export and usage example
// ============================

export default FigmaToHtmlConverter;

// Export type
export type { FigmaNode, FigmaTextNode, FigmaFrameNode, FigmaImageNode, ProcessedElement, ElementPosition, CSSStyleObject, ConversionOptions };

// Usage example
export function convertFigmaToHtml(
  figmaNode: FigmaNode,
  options?: Partial<ConversionOptions>
): string {
  const converter = new FigmaToHtmlConverter();
  return converter.convert(figmaNode, options);
}