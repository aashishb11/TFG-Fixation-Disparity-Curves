export function exportSvgToPng(
  container: HTMLDivElement | null,
  fileName: string,
) {
  const svg = container?.querySelector("svg");
  if (!svg) {
    return;
  }

  const { width, height } = svg.getBoundingClientRect();
  if (width === 0 || height === 0) {
    return;
  }

  const serializer = new XMLSerializer();
  const source =
    '<?xml version="1.0" standalone="no"?>\r\n' +
    serializer.serializeToString(svg);
  const image = new Image();

  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
  image.onload = () => {
    const canvas = document.createElement("canvas");
    const scale = 2;

    canvas.width = width * scale;
    canvas.height = height * scale;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.fillStyle = "#f8fbfd";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);

    const link = document.createElement("a");
    link.download = fileName;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
}
