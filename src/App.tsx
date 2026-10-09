import { Route, Routes,  Navigate} from "react-router-dom";
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
import AppLayout from './components/layout/AppLayout'
import DashboardPage from './features/dashboard/DashboardPage'
import ProjectsPage from './features/projects/ProjectsPage'
import OnboardingPage from './features/onboarding/OnboardingPage'
import RequireAuth from './app/RequireAuth'
import ProfilePage from './features/profile/ProfilePage'


const stub = (title: string) => <h1 className="text-2xl font-semibold text-ink">{title}</h1>


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

<Route element={<RequireAuth />}>
      <Route path="/app" element={<AppLayout />}>
  <Route index element={<Navigate to="dashboard" replace />} />
  <Route path="dashboard" element={<DashboardPage />} />
  <Route path="projects" element={<ProjectsPage />} />
  <Route path="profile" element={<ProfilePage />} />
  <Route path="certifications" element={stub('Certifications')} />
  <Route path="skills" element={stub('Skills')} />
  <Route path="achievements" element={stub('Achievements')} />
  <Route path="verification" element={stub('Verification')} />
  <Route path="share" element={stub('Share profile')} />
  <Route path="settings" element={stub('Settings')} />
  <Route path="profile" element={stub('Profile')} />
</Route>
  <Route path="/onboarding" element={<OnboardingPage />} />
    </Route>
       </Routes>
  );
}