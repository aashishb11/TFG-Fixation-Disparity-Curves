import { useEffect } from "react";
import type { ReportSubjectDetails } from "../lib/pdfReport";

type PdfExportDialogProps = {
  details: ReportSubjectDetails;
  error: string | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onChange: (field: keyof ReportSubjectDetails, value: string) => void;
  onChooseDetails: () => void;
  onChooseNoDetails: () => void;
  onClose: () => void;
  onSubmit: () => void;
  step: "choice" | "details" | null;
};

const COUNTRY_CODE_OPTIONS = [
  { label: "Spain (+34)", value: "+34" },
  { label: "United States (+1)", value: "+1" },
  { label: "United Kingdom (+44)", value: "+44" },
  { label: "France (+33)", value: "+33" },
  { label: "Germany (+49)", value: "+49" },
  { label: "Italy (+39)", value: "+39" },
  { label: "Portugal (+351)", value: "+351" },
] as const;

const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;

function getDialogClassName(step: "choice" | "details" | null): string {
  if (step === "choice") {
    return "report-dialog report-dialog--choice";
  }

  return "report-dialog report-dialog--details";
}

export function PdfExportDialog({
  details,
  error,
  isOpen,
  isSubmitting,
  onChange,
  onChooseDetails,
  onChooseNoDetails,
  onClose,
  onSubmit,
  step,
}: PdfExportDialogProps) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || step === null) {
    return null;
  }

  return (
    <div
      className="report-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div aria-modal="true" className={getDialogClassName(step)} role="dialog">
        <div className="report-dialog__header">
          <div className="report-dialog__header-copy">
            <span className="report-dialog__eyebrow">PDF export</span>
            <h3 className="report-dialog__title">
              {step === "choice"
                ? "Personalize this clinical report"
                : "Add report holder details"}
            </h3>
            <p className="report-dialog__description">
              {step === "choice"
                ? "Would you like to include the subject's details in this clinical report before generating the PDF?"
                : "These details are used only in the exported report. They do not change the fixation disparity fitting or classification results."}
            </p>
          </div>
          <button
            aria-label="Close PDF export dialog"
            className="report-dialog__close"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </div>

        {step === "choice" ? (
          <div className="report-choice-grid">
            <button
              className="report-choice-card report-choice-card--primary"
              disabled={isSubmitting}
              onClick={onChooseDetails}
              type="button"
            >
              <span className="report-choice-card__eyebrow">Yes</span>
              <strong className="report-choice-card__title">
                Include subject details
              </strong>
              <span className="report-choice-card__description">
                Add name, date of birth, gender, contact details, and address
                before generating the PDF.
              </span>
            </button>

            <button
              className="report-choice-card"
              disabled={isSubmitting}
              onClick={onChooseNoDetails}
              type="button"
            >
              <span className="report-choice-card__eyebrow">No</span>
              <strong className="report-choice-card__title">
                Generate without details
              </strong>
              <span className="report-choice-card__description">
                Create the PDF immediately using clean fallback values for any
                omitted subject information.
              </span>
            </button>
          </div>
        ) : (
          <form
            className="report-form"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <div className="report-form__section">
              <div className="report-form__section-heading">
                <h4 className="report-form__section-title">
                  Report holder details
                </h4>
                <p className="report-form__section-note">
                  Complete only the fields you want to appear in the PDF.
                </p>
              </div>

              <div className="report-form__grid">
                <label className="report-form__field report-form__field--third">
                  <span className="report-form__label">First Name</span>
                  <input
                    autoComplete="given-name"
                    className="report-form__control"
                    disabled={isSubmitting}
                    onChange={(event) =>
                      onChange("firstName", event.target.value)
                    }
                    type="text"
                    value={details.firstName}
                  />
                </label>

                <label className="report-form__field report-form__field--third">
                  <span className="report-form__label">First Surname</span>
                  <input
                    autoComplete="family-name"
                    className="report-form__control"
                    disabled={isSubmitting}
                    onChange={(event) =>
                      onChange("firstSurname", event.target.value)
                    }
                    type="text"
                    value={details.firstSurname}
                  />
                </label>

                <label className="report-form__field report-form__field--third">
                  <span className="report-form__label">Second Surname</span>
                  <input
                    className="report-form__control"
                    disabled={isSubmitting}
                    onChange={(event) =>
                      onChange("secondSurname", event.target.value)
                    }
                    type="text"
                    value={details.secondSurname}
                  />
                </label>

                <label className="report-form__field report-form__field--half">
                  <span className="report-form__label">Date of Birth</span>
                  <input
                    className="report-form__control report-form__control--date"
                    disabled={isSubmitting}
                    onChange={(event) =>
                      onChange("dateOfBirth", event.target.value)
                    }
                    type="date"
                    value={details.dateOfBirth}
                  />
                </label>

                <label className="report-form__field report-form__field--half">
                  <span className="report-form__label">Gender</span>
                  <select
                    className="report-form__control report-form__control--select"
                    disabled={isSubmitting}
                    onChange={(event) => onChange("gender", event.target.value)}
                    value={details.gender}
                  >
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="report-form__field report-form__field--wide">
                  <span className="report-form__label">Phone Number</span>
                  <div className="report-form__phone-group">
                    <select
                      className="report-form__control report-form__control--select report-form__control--code"
                      disabled={isSubmitting}
                      onChange={(event) =>
                        onChange("phoneCountryCode", event.target.value)
                      }
                      value={details.phoneCountryCode}
                    >
                      {COUNTRY_CODE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      autoComplete="tel-national"
                      className="report-form__control"
                      disabled={isSubmitting}
                      onChange={(event) =>
                        onChange("phoneNumber", event.target.value)
                      }
                      placeholder="Enter local phone number"
                      type="tel"
                      value={details.phoneNumber}
                    />
                  </div>
                </label>

                <label className="report-form__field report-form__field--wide">
                  <span className="report-form__label">Address</span>
                  <textarea
                    autoComplete="street-address"
                    className="report-form__control report-form__textarea"
                    disabled={isSubmitting}
                    onChange={(event) =>
                      onChange("address", event.target.value)
                    }
                    rows={3}
                    value={details.address}
                  />
                </label>
              </div>
            </div>

            <div className="report-dialog__actions">
              <button
                className="button button--secondary report-dialog__button"
                disabled={isSubmitting}
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className="button button--primary report-dialog__button report-dialog__button--primary"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Generating PDF..." : "Generate PDF"}
              </button>
            </div>
          </form>
        )}

        {error ? <p className="report-dialog__error">{error}</p> : null}
      </div>
    </div>
  );
}
