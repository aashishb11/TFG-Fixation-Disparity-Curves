type SvgExportOptions = {
  backgroundColor?: string;
  scale?: number;
};

export type RenderedSvgImage = {
  dataUrl: string;
  height: number;
  width: number;
};

function getSvgDimensions(svg: SVGSVGElement): { height: number; width: number } {
  const rect = svg.getBoundingClientRect();
  // Fall back through multiple sources: layout rect → attribute → clientWidth.
  const width =
    rect.width || Number(svg.getAttribute("width") ?? 0) || svg.clientWidth;
  const height =
    rect.height || Number(svg.getAttribute("height") ?? 0) || svg.clientHeight;

  return { height, width };
}

/**
 * Loads a serialised SVG string as an HTMLImageElement by encoding it as a
 * data URL. We avoid Blob + URL.createObjectURL here because some browsers
 * restrict cross-origin CSS inside Blobs, which can cause chart fonts or
 * filter effects to be stripped from the exported image.
 */
function loadSerializedSvg(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("SVG image could not be loaded."));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
  });
}

/**
 * Renders the first `<svg>` element found inside `container` to a PNG data
 * URL using an offscreen canvas. The `scale` option controls pixel density
 * (default 2×) for crisp output on high-DPI screens or in PDF reports.
 *
 * Returns null when no SVG is found, the SVG has zero dimensions, or a canvas
 * 2D context is unavailable (e.g. in headless test environments).
 */
export async function renderSvgToPngDataUrl(
  container: Element | null,
  options: SvgExportOptions = {},
): Promise<RenderedSvgImage | null> {
  const svg = container?.querySelector("svg");
  if (!(svg instanceof SVGSVGElement)) {
    return null;
  }

  const { width, height } = getSvgDimensions(svg);
  if (width === 0 || height === 0) {
    return null;
  }

  const backgroundColor = options.backgroundColor ?? "#f8fbfd";
  const scale = options.scale ?? 2;

  // Prepend the XML declaration so the image element's loader treats the
  // string as a standalone SVG document with correct encoding.
  const serializer = new XMLSerializer();
  const source =
    '<?xml version="1.0" standalone="no"?>\r\n' +
    serializer.serializeToString(svg);
  const image = await loadSerializedSvg(source);

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.scale(scale, scale);
  context.drawImage(image, 0, 0, width, height);

  return {
    dataUrl: canvas.toDataURL("image/png"),
    height,
    width,
  };
}

/**
 * Convenience wrapper: renders the chart SVG to PNG and triggers a browser
 * file download. Returns false if the render step failed.
 */
export async function exportSvgToPng(
  container: Element | null,
  fileName: string,
  options: SvgExportOptions = {},
): Promise<boolean> {
  const renderedImage = await renderSvgToPngDataUrl(container, options);
  if (renderedImage === null) {
    return false;
  }

  const link = document.createElement("a");
  link.download = fileName;
  link.href = renderedImage.dataUrl;
  link.click();

  return true;
}
