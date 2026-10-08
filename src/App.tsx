import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TrustedLogos from "./components/TrustedLogos";
import About from "./components/About";
import Features from "./components/Features";
import InstitutionBanner from "./components/InstitutionBanner";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TrustedLogos />
        <About />
        <Features />
        <InstitutionBanner />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}