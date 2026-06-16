import upcLogo from "../../images/UPC_Logo.png";

const UPC_URL = "https://www.upc.edu/ca";
const ALBCOM_URL = "https://futur.upc.edu/ALBCOM?locale=en";

export function PageHeader() {
  return (
    <header className="app-header">
      <div className="app-header__content">
        <div className="app-header__intro">
          <h1 className="app-title">Fixation Disparity Curve Modeling</h1>
          <p className="app-subtitle">
            Clinical curve fitting and classification for binocular vision
            assessment.
          </p>
          <div className="app-header__meta">
            <a
              className="app-header__meta-link"
              href={UPC_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              UPC — Universitat Politècnica de Catalunya · BarcelonaTech
            </a>
            <span className="app-header__meta-sep" aria-hidden="true" />
            <a
              className="app-header__meta-link"
              href={ALBCOM_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              ALBCOM — Algorithms, Bioinformatics, Complexity and Formal Methods
              Research Group
            </a>
          </div>
        </div>
        <a
          className="app-header__brand"
          href={UPC_URL}
          rel="noopener noreferrer"
          target="_blank"
          aria-label="Universitat Politècnica de Catalunya website"
        >
          <img alt="UPC logo" className="app-header__logo" src={upcLogo} />
        </a>
      </div>
    </header>
  );
}
