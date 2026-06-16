const RDLAB_URL = "https://rdlab.cs.upc.edu/";

export function PageFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer__content">
        <div className="app-footer__host">
          Hosted by{" "}
          <a
            className="app-footer__link"
            href={RDLAB_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            rdlab (UPC)
          </a>
        </div>
        <div className="app-footer__credits">
          <span className="app-footer__credits-authors">
            Marc Argilés &amp; Xavier Molinero
          </span>
          <span className="app-footer__credits-dot" aria-hidden="true">
            ·
          </span>
          <span className="app-footer__credits-copy">Copyright © 2026</span>
          <span className="app-footer__credits-dot" aria-hidden="true">
            ·
          </span>
          <span className="app-footer__credits-dev">
            Developed by Aashish Bhusal
          </span>
        </div>
      </div>
    </footer>
  );
}
