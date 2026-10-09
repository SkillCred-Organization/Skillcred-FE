import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./components/pages/LandingPage";
import LoginPage from "./components/pages/LoginPage";
import SignupPage from "./components/pages/SignupPage";
import UserTypePage from "./components/pages/UserTypePage";
import InstitutionSignupPage from "./components/pages/InstitutionSignupPage";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./features/dashboard/DashboardPage";

import ForgotPasswordPage from "./components/pages/ForgotPasswordPage";
import ResetCheckEmailPage from "./components/pages/ResetCheckEmailPage";
import NewPasswordPage from "./components/pages/NewPasswordPage";
import PasswordUpdatedPage from "./components/pages/PasswordUpdatedPage";
import VerificationPage from "./components/pages/VerificationPage";
import AccountStatusPage from "./components/pages/AccountStatusPage";
import LegalPage from "./components/pages/LegalPage";
import RequireAuth from "./features/auth/RequireAuth";
import ProjectsPage from "./features/projects/ProjectsPage";
import OnboardingPage from "./features/onboarding/OnboardingPage";

const stub = (title: string) => <h1 className="text-2xl font-semibold text-ink">{title}</h1>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/user-type" element={<UserTypePage />} />
      <Route path="/institution-signup" element={<InstitutionSignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset/check-email" element={<ResetCheckEmailPage />} />
      <Route path="/reset-password" element={<NewPasswordPage />} />
      <Route path="/password-updated" element={<PasswordUpdatedPage />} />
      <Route path="/verify-email" element={<VerificationPage />} />
      <Route path="/account-status" element={<AccountStatusPage />} />
      <Route path="/terms" element={<LegalPage />} />
      <Route path="/privacy" element={<LegalPage privacy />} />
      <Route element={<RequireAuth />}>
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="certifications" element={stub("Certifications")} />
        <Route path="skills" element={stub("Skills")} />
        <Route path="achievements" element={stub("Achievements")} />
        <Route path="verification" element={stub("Verification")} />
        <Route path="share" element={stub("Share profile")} />
        <Route path="settings" element={stub("Settings")} />
        <Route path="profile" element={stub("Profile")} />
      </Route>
      </Route>
    </Routes>
  );
}
