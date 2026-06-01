import { VIEWING_DISTANCE_OPTIONS } from "../constants/fdc";
import type { ViewingDistance } from "../types/fdc";

type InputPanelProps = {
  error: string | null;
  loading: boolean;
  selectedDistance: ViewingDistance | "";
  xValues: readonly number[];
  yValues: string[];
  onChange: (index: number, value: string) => void;
  onDistanceChange: (value: ViewingDistance | "") => void;
  onSubmit: () => void;
};

export function InputPanel({
  error,
  loading,
  selectedDistance,
  xValues,
  yValues,
  onChange,
  onDistanceChange,
  onSubmit,
}: InputPanelProps) {
  const distanceValidationMessage = !selectedDistance
    ? "Required before running the statistical fit."
    : null;

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
        </div>
      </div>

      <div className="sidebar__section sidebar__section--measurements">
        <div className="measurement-panel__header">
          <div className="measurement-panel__title-row">
            <h3 className="group-title">Measured Fixation Disparity Values</h3>
            <span className="measurement-status">Editable values</span>
          </div>
          <p className="group-description measurement-panel__description">
            Enter the measured fixation disparity values for each fixed x
            position.
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
                placeholder="0"
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
