import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="landing-footer">
      <div className="landing-container footer-layout">
        <div>
          <Logo className="footer-logo" />
          <p className="footer-tagline">Your skills. Verified. Greater opportunities.</p>
        </div>
        <div className="footer-meta">
          <nav aria-label="Legal">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </nav>
          <p>© {new Date().getFullYear()} SkillCred</p>
        </div>
      </div>
    </footer>
  );
}
