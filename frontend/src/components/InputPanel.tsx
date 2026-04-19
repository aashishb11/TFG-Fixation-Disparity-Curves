import { VIEWING_DISTANCE_LABELS, VIEWING_DISTANCE_OPTIONS } from "../constants/fdc";
import type { ViewingDistance } from "../types/fdc";

type InputPanelProps = {
  customDistance: string;
  customDistanceTouched: boolean;
  error: string | null;
  loading: boolean;
  selectedDistance: ViewingDistance | "";
  xValues: readonly number[];
  yValues: string[];
  onChange: (index: number, value: string) => void;
  onCustomDistanceBlur: () => void;
  onCustomDistanceChange: (value: string) => void;
  onDistanceChange: (value: ViewingDistance | "") => void;
  onSubmit: () => void;
};

export function InputPanel({
  customDistance,
  customDistanceTouched,
  error,
  loading,
  selectedDistance,
  xValues,
  yValues,
  onChange,
  onCustomDistanceBlur,
  onCustomDistanceChange,
  onDistanceChange,
  onSubmit,
}: InputPanelProps) {
  const isManualMode = selectedDistance === "other";
  const hasCustomDistance = customDistance.trim() !== "";
  const showCustomDistanceError = isManualMode && !hasCustomDistance && customDistanceTouched;
  const distanceValidationMessage = !selectedDistance
    ? "Required before running the statistical fit."
    : null;
  const customDistanceMessage = !hasCustomDistance
    ? "Please type your preferred distance"
    : "Custom distance entered.";

  const measurementGuidance = !selectedDistance
    ? "Select a viewing distance to apply a clinical preset or switch to manual entry."
    : isManualMode
      ? "Manual entry mode is active. Enter or edit the seven custom measurements directly."
      : `The ${VIEWING_DISTANCE_LABELS[selectedDistance]} clinical preset values were applied automatically. You can adjust any field if needed.`;

  const measurementStatus = !selectedDistance
    ? "Awaiting distance"
    : isManualMode
      ? "Manual entry"
      : "Preset applied";

  return (
    <aside className="sidebar">
      <div className="sidebar__section">
        <div className="sidebar__heading">
          <h2 className="section-title">Clinical Measurements</h2>
          <p className="section-description">
            Select the viewing distance, then enter the seven measured fixation
            disparity values for the existing fixed x positions.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="viewing-distance">
            Viewing Distance
          </label>
          <select
            id="viewing-distance"
            className="select-field"
            onChange={(event) =>
              onDistanceChange(event.target.value as ViewingDistance | "")
            }
            required
            value={selectedDistance}
          >
            <option value="">Select a distance</option>
            {VIEWING_DISTANCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {distanceValidationMessage ? (
            <p className="field-feedback field-feedback--error">
              {distanceValidationMessage}
            </p>
          ) : null}

          {isManualMode ? (
            <div className="custom-distance">
              <label className="form-label" htmlFor="custom-viewing-distance">
                Preferred Distance
              </label>
              <div className="custom-distance__control">
                <input
                  id="custom-viewing-distance"
                  className="input-grid__field custom-distance__input"
                  inputMode="decimal"
                  min="0"
                  onBlur={onCustomDistanceBlur}
                  onChange={(event) => onCustomDistanceChange(event.target.value)}
                  placeholder="e.g. 30"
                  step="any"
                  type="number"
                  value={customDistance}
                />
                <span className="custom-distance__unit">cm</span>
              </div>
              <p
                className={
                  showCustomDistanceError
                    ? "field-feedback field-feedback--error"
                    : "field-feedback field-feedback--info"
                }
              >
                {customDistanceMessage}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="sidebar__section sidebar__section--measurements">
        <div className="measurement-panel__header">
          <div className="measurement-panel__title-row">
            <h3 className="group-title">Measured Fixation Disparity Values</h3>
            <span
              className={
                isManualMode
                  ? "measurement-status measurement-status--manual"
                  : "measurement-status"
              }
            >
              {measurementStatus}
            </span>
          </div>
          <p className="group-description measurement-panel__description">
            {measurementGuidance}
          </p>
        </div>

        <div className="measurement-list">
          <div className="measurement-list__head" aria-hidden="true">
            <span>Fixed x</span>
            <span>Measured value</span>
          </div>
          {xValues.map((xValue, index) => (
            <div key={xValue} className="measurement-list__row">
              <label className="measurement-list__x" htmlFor={`y-value-${index}`}>
                {xValue}
              </label>
              <input
                id={`y-value-${index}`}
                className="input-grid__field measurement-list__input"
                onChange={(event) => onChange(index, event.target.value)}
                placeholder={isManualMode ? "Enter custom value" : "Preset value"}
                step="any"
                type="number"
                value={yValues[index]}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        className="button button--primary sidebar__action"
        disabled={loading}
        onClick={onSubmit}
        type="button"
      >
        {loading ? "Optimizing..." : "Run Statistical Fit"}
      </button>

      {error ? (
        <div className="status-message status-message--error">{error}</div>
      ) : null}
    </aside>
  );
}
