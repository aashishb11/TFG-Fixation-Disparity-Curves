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
  const width =
    rect.width || Number(svg.getAttribute("width") ?? 0) || svg.clientWidth;
  const height =
    rect.height || Number(svg.getAttribute("height") ?? 0) || svg.clientHeight;

  return { height, width };
}

function loadSerializedSvg(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("SVG image could not be loaded."));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
  });
}

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
