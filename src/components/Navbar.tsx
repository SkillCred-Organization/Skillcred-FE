import { useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

const links = [
  { href: "#learners", label: "For learners" },
  { href: "#institutions", label: "For institutions" },
  { href: "#about", label: "About us" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="landing-header">
      <nav
        className="landing-container landing-nav"
        aria-label="Main navigation"
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            closeMenu();
            menuButton.current?.focus();
          }
        }}
      >
        <Logo className="landing-logo" />
        <ul className="desktop-nav">
          {links.map(({ href, label }) => (
            <li key={href}><a href={href}>{label}</a></li>
          ))}
        </ul>
        <div className="desktop-nav nav-actions">
          <Link className="login-link" to="/login">Log in</Link>
          <Link className="landing-button button-primary" to="/user-type">Get started</Link>
        </div>
        <button
          ref={menuButton}
          type="button"
          className="mobile-menu-toggle"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div id="mobile-navigation" className="mobile-navigation" hidden={!menuOpen}>
          {links.map(({ href, label }) => (
            <a key={href} href={href} onClick={closeMenu}>{label}</a>
          ))}
          <Link to="/login" onClick={closeMenu}>Log in</Link>
          <Link className="landing-button button-primary" to="/user-type" onClick={closeMenu}>
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
