import upcLogo from "../../images/UPC_Logo.png";

export function PageHeader() {
  return (
    <header className="app-header">
      <div className="app-header__content">
        <div className="app-header__intro">
          <h1 className="app-title">Fixation Disparity Curve Modeling</h1>
          <p className="app-subtitle">
            Clinical curve fitting and classification for binocular vision
            assessment
          </p>
        </div>
        <div className="app-header__brand" aria-label="UPC logo">
          <img
            alt="UPC logo"
            className="app-header__logo"
            src={upcLogo}
          />
        </div>
      </div>
    </header>
  );
}
