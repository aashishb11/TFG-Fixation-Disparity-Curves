const PUBLISHED_PAPER_URL = "https://onlinelibrary.wiley.com/doi/10.1111/opo.70025";

export function PageFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer__content">
        <div className="app-footer__pub">
          <span className="app-footer__label">Related publication</span>
          <a
            className="app-footer__link"
            href={PUBLISHED_PAPER_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            Published paper
          </a>
        </div>

        <div className="app-footer__credits">
          <span className="app-footer__credits-authors">
            Marc Argilés &amp; Xavier Molinero
          </span>
          <span className="app-footer__credits-dot" aria-hidden="true">·</span>
          <span className="app-footer__credits-copy">Copyright © 2026</span>
          <span className="app-footer__credits-dot" aria-hidden="true">·</span>
          <span className="app-footer__credits-dev">Developed by Aashish Bhusal</span>
        </div>
      </div>
    </footer>
  );
}
