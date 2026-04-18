type InputPanelProps = {
  error: string | null;
  loading: boolean;
  xValues: readonly number[];
  yValues: string[];
  onChange: (index: number, value: string) => void;
  onSubmit: () => void;
};

export function InputPanel({
  error,
  loading,
  xValues,
  yValues,
  onChange,
  onSubmit,
}: InputPanelProps) {
  return (
    <aside className="sidebar">
      <h2 className="section-title">Input</h2>

      <div className="input-grid">
        {xValues.map((xValue, index) => (
          <div key={xValue} className="input-grid__row">
            <label className="input-grid__label" htmlFor={`y-value-${index}`}>
              x = {xValue}
            </label>
            <input
              id={`y-value-${index}`}
              className="input-grid__field"
              onChange={(event) => onChange(index, event.target.value)}
              placeholder="Patient's input"
              type="number"
              value={yValues[index]}
            />
          </div>
        ))}
      </div>

      <button
        className="button button--primary sidebar__action"
        disabled={loading}
        onClick={onSubmit}
        type="button"
      >
        {loading ? "Optimizing..." : "Run Statistical Fit"}
      </button>

      {error ? <div className="status-message status-message--error">{error}</div> : null}
    </aside>
  );
}
