import { jsPDF } from "jspdf";
import { MODEL_COLORS, MODEL_DISPLAY_LABELS } from "../constants/fdc";
import type { ModelKey } from "../types/fdc";
import type { RenderedSvgImage } from "./exportChart";

export type ReportSubjectDetails = {
  address: string;
  dateOfBirth: string;
  firstName: string;
  firstSurname: string;
  gender: string;
  phoneCountryCode: string;
  phoneNumber: string;
  secondSurname: string;
};

type ExportClinicalPdfOptions = {
  bestModel: ModelKey;
  chartImage: RenderedSvgImage;
  reportDate?: Date;
  slope: number;
  subjectDetails: ReportSubjectDetails;
};

type NormalizedSubjectDetails = {
  address: string;
  dateOfBirth: string;
  fullName: string;
  gender: string;
  phoneNumber: string;
};

type FieldBlock = {
  height: number;
  label: string;
  lines: string[];
  value: string;
};

export const EMPTY_REPORT_SUBJECT_DETAILS: ReportSubjectDetails = {
  address: "",
  dateOfBirth: "",
  firstName: "",
  firstSurname: "",
  gender: "",
  phoneCountryCode: "+34",
  phoneNumber: "",
  secondSurname: "",
};

function formatHumanDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatBirthDate(rawDate: string): string {
  const trimmedDate = rawDate.trim();
  if (trimmedDate === "") {
    return "Not provided";
  }

  const [year, month, day] = trimmedDate.split("-").map(Number);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return "Not provided";
  }

  return formatHumanDate(new Date(year, month - 1, day));
}

function normalizeSubjectDetails(
  details: ReportSubjectDetails,
): NormalizedSubjectDetails {
  const normalizeField = (value: string, fallback: string) => {
    const trimmedValue = value.trim();
    return trimmedValue === "" ? fallback : trimmedValue;
  };

  const fullName = [
    details.firstName.trim(),
    details.firstSurname.trim(),
    details.secondSurname.trim(),
  ]
    .filter(Boolean)
    .join(" ");

  const localPhoneNumber = details.phoneNumber.trim();
  const phoneNumber =
    localPhoneNumber === ""
      ? "Not provided"
      : `${details.phoneCountryCode.trim()} ${localPhoneNumber}`.trim();

  return {
    address: normalizeField(details.address, "Not provided"),
    dateOfBirth: formatBirthDate(details.dateOfBirth),
    fullName: fullName === "" ? "Unnamed Case" : fullName,
    gender: normalizeField(details.gender, "Not provided"),
    phoneNumber,
  };
}

function getContainedImageSize(
  imageWidth: number,
  imageHeight: number,
  maxWidth: number,
  maxHeight: number,
) {
  const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);

  return {
    height: imageHeight * scale,
    width: imageWidth * scale,
  };
}

function setHexFillColor(pdf: jsPDF, color: string) {
  const normalizedHex = color.replace("#", "");
  const red = Number.parseInt(normalizedHex.slice(0, 2), 16);
  const green = Number.parseInt(normalizedHex.slice(2, 4), 16);
  const blue = Number.parseInt(normalizedHex.slice(4, 6), 16);

  pdf.setFillColor(red, green, blue);
}

function createFieldBlock(
  pdf: jsPDF,
  label: string,
  value: string,
  width: number,
): FieldBlock {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.4);
  const lines = pdf.splitTextToSize(value, width) as string[];

  return {
    height: 13 + lines.length * 12,
    label,
    lines,
    value,
  };
}

function drawFieldBlock(pdf: jsPDF, block: FieldBlock, x: number, y: number) {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.8);
  pdf.setTextColor(87, 107, 122);
  pdf.text(block.label, x, y);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.4);
  pdf.setTextColor(24, 50, 74);
  pdf.text(block.lines, x, y + 14);
}

function drawPanel(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor: [number, number, number],
) {
  pdf.setFillColor(...fillColor);
  pdf.setDrawColor(207, 221, 231);
  pdf.roundedRect(x, y, width, height, 14, 14, "FD");
}

export function exportClinicalReportPdf({
  bestModel,
  chartImage,
  reportDate = new Date(),
  slope,
  subjectDetails,
}: ExportClinicalPdfOptions) {
  const pdf = new jsPDF({
    compress: true,
    format: "a4",
    orientation: "portrait",
    unit: "pt",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 34;
  const contentWidth = pageWidth - margin * 2;
  const normalizedDetails = normalizeSubjectDetails(subjectDetails);
  const reportDateLabel = formatHumanDate(reportDate);
  const classificationLabel = MODEL_DISPLAY_LABELS[bestModel];
  const classificationColor = MODEL_COLORS[bestModel];

  pdf.setFillColor(245, 249, 252);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);
  pdf.setTextColor(92, 114, 136);
  pdf.text("Clinical PDF Report", margin, 36);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(24, 50, 74);
  pdf.text("Fixation Disparity Curve Summary", margin, 58);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.5);
  pdf.setTextColor(92, 114, 136);
  pdf.text(`Date generated: ${reportDateLabel}`, pageWidth - margin, 38, {
    align: "right",
  });

  const detailsTop = 82;
  const detailsInnerX = margin + 24;
  const detailsColumnGap = 26;
  const detailsColumnWidth = (contentWidth - 48 - detailsColumnGap) / 2;
  const fullWidth = contentWidth - 48;

  const fullNameBlock = createFieldBlock(
    pdf,
    "Full Name",
    normalizedDetails.fullName,
    detailsColumnWidth,
  );
  const genderBlock = createFieldBlock(
    pdf,
    "Gender",
    normalizedDetails.gender,
    detailsColumnWidth,
  );
  const birthDateBlock = createFieldBlock(
    pdf,
    "Date of Birth",
    normalizedDetails.dateOfBirth,
    detailsColumnWidth,
  );
  const phoneBlock = createFieldBlock(
    pdf,
    "Phone Number",
    normalizedDetails.phoneNumber,
    detailsColumnWidth,
  );
  const addressBlock = createFieldBlock(
    pdf,
    "Address",
    normalizedDetails.address,
    fullWidth,
  );

  const firstRowHeight = Math.max(fullNameBlock.height, genderBlock.height);
  const secondRowHeight = Math.max(birthDateBlock.height, phoneBlock.height);
  const detailsHeight =
    34 + firstRowHeight + 20 + secondRowHeight + 20 + addressBlock.height + 22;

  drawPanel(
    pdf,
    margin,
    detailsTop,
    contentWidth,
    detailsHeight,
    [252, 254, 255],
  );
  setHexFillColor(pdf, classificationColor);
  pdf.roundedRect(
    margin + 14,
    detailsTop + 16,
    4,
    detailsHeight - 32,
    2,
    2,
    "F",
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(76, 98, 115);
  pdf.text("Report holder details", detailsInnerX, detailsTop + 26);

  const rowOneY = detailsTop + 48;
  const rightColumnX = detailsInnerX + detailsColumnWidth + detailsColumnGap;
  drawFieldBlock(pdf, fullNameBlock, detailsInnerX, rowOneY);
  drawFieldBlock(pdf, genderBlock, rightColumnX, rowOneY);

  const rowTwoY = rowOneY + firstRowHeight + 20;
  drawFieldBlock(pdf, birthDateBlock, detailsInnerX, rowTwoY);
  drawFieldBlock(pdf, phoneBlock, rightColumnX, rowTwoY);

  const addressY = rowTwoY + secondRowHeight + 20;
  drawFieldBlock(pdf, addressBlock, detailsInnerX, addressY);

  const chartTop = detailsTop + detailsHeight + 18;
  const chartHeight = 328;
  drawPanel(pdf, margin, chartTop, contentWidth, chartHeight, [255, 255, 255]);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);
  pdf.setTextColor(76, 98, 115);
  pdf.text(
    "Measured data with selected best-fit regression",
    margin + 20,
    chartTop + 24,
  );

  const imageAreaWidth = contentWidth - 40;
  const imageAreaHeight = chartHeight - 54;
  const fittedImage = getContainedImageSize(
    chartImage.width,
    chartImage.height,
    imageAreaWidth,
    imageAreaHeight,
  );
  const imageX = margin + (contentWidth - fittedImage.width) / 2;
  const imageY = chartTop + 34 + (imageAreaHeight - fittedImage.height) / 2;

  pdf.addImage(
    chartImage.dataUrl,
    "PNG",
    imageX,
    imageY,
    fittedImage.width,
    fittedImage.height,
    undefined,
    "FAST",
  );

  const summaryTop = chartTop + chartHeight + 18;
  const summaryWidth = (contentWidth - 12) / 2;

  // Pre-compute wrapped description lines so the card height can accommodate them.
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  const descMaxWidth = summaryWidth - 36;
  const classificationDescLines = pdf.splitTextToSize(
    "Selected as the primary model by Sum of Squared Errors (SSE).",
    descMaxWidth,
  ) as string[];
  const slopeDescLines = pdf.splitTextToSize(
    "Paper-derived slope descriptor from the chosen model.",
    descMaxWidth,
  ) as string[];
  const descLineHeight = 12;
  const maxDescLines = Math.max(
    classificationDescLines.length,
    slopeDescLines.length,
  );
  const summaryHeight = 80 + maxDescLines * descLineHeight + 16;

  drawPanel(
    pdf,
    margin,
    summaryTop,
    summaryWidth,
    summaryHeight,
    [251, 253, 255],
  );
  drawPanel(
    pdf,
    margin + summaryWidth + 12,
    summaryTop,
    summaryWidth,
    summaryHeight,
    [251, 253, 255],
  );

  setHexFillColor(pdf, classificationColor);
  pdf.roundedRect(margin, summaryTop, summaryWidth, 6, 6, 6, "F");
  pdf.setFillColor(117, 147, 170);
  pdf.roundedRect(
    margin + summaryWidth + 12,
    summaryTop,
    summaryWidth,
    6,
    6,
    6,
    "F",
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.6);
  pdf.setTextColor(92, 114, 136);
  pdf.text("Classification", margin + 18, summaryTop + 28);
  pdf.text("Slope", margin + summaryWidth + 30, summaryTop + 28);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(24, 50, 74);
  pdf.text(classificationLabel, margin + 18, summaryTop + 58);
  pdf.text(slope.toFixed(3), margin + summaryWidth + 30, summaryTop + 58);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(92, 114, 136);
  pdf.text(classificationDescLines, margin + 18, summaryTop + 80);
  pdf.text(slopeDescLines, margin + summaryWidth + 30, summaryTop + 80);

  pdf.save("Fixation_Disparity_Report.pdf");
}
