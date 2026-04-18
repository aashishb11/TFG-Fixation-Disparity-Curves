type PageHeaderProps = {
  canExport: boolean;
  onExport: () => void;
};

export function PageHeader({ canExport, onExport }: PageHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__content">
        <div className="app-header__intro">
          <h1 className="app-title">Fixation Disparity Curve Modeling</h1>
          <span className="app-subtitle">
            Mathematical optimization of T1-T4 non-linear fits
          </span>
        </div>

        {canExport ? (
          <div className="app-header__actions">
            <button
              className="button button--secondary"
              onClick={onExport}
              type="button"
            >
              Export High-Res PNG
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
