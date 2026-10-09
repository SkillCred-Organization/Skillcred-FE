import Navbar from "../Navbar";
import Hero from "../Hero";
import TrustedLogos from "../TrustedLogos";
import About from "../About";
import Features from "../Features";
import InstitutionBanner from "../InstitutionBanner";
import FAQ from "../FAQ";
import Footer from "../Footer";
import "../../landing.css";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="landing-intro">
        <Navbar />
        <main id="main-content">
          <Hero />
          <TrustedLogos />
          <About />
          <Features />
          <InstitutionBanner />
          <FAQ />
        </main>
      </div>
      <Footer />
    </div>
  );
}
