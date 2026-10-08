import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TrustedLogos from "./components/TrustedLogos";
import About from "./components/About";
import Features from "./components/Features";
import InstitutionBanner from "./components/InstitutionBanner";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";
import LoginPage from "./components/pages/LoginPage";
import SignupPage from "./components/pages/SignupPage";
import UserTypePage from "./components/pages/UserTypePage";
import InstitutionSignupPage from "./components/pages/InstitutionSignupPage";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
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
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/user-type" element={<UserTypePage />} />
      <Route path="/institution-signup" element={<InstitutionSignupPage />} />
    </Routes>
  );
}