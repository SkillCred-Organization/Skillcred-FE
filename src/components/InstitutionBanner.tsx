import { Link } from "react-router-dom";

export default function InstitutionBanner() {
  return (
    <section id="institutions" className="institutions-section" aria-labelledby="institutions-title">
      <div className="landing-container">
        <div className="institution-banner">
          <div className="institution-copy">
            <p className="landing-eyebrow">For institutions</p>
            <h2 id="institutions-title" className="landing-heading">
              Confirm what your learners really did.
            </h2>
            <p className="landing-description">
              Review claims from your programmes in one queue. Verify in a click,
              or ask for changes with a reason.
            </p>
          </div>
          <Link className="landing-button button-white" to="/institution-signup">
            Register your institution
          </Link>
        </div>
      </div>
    </section>
  );
}
