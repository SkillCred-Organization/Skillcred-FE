import { useState } from "react";
import {
  Award,
  Bell,
  Check,
  Copy,
  GraduationCap,
  Folder,
  Pencil,
  Plus,
  ShieldCheck,
  Star,
  TriangleAlert,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import VerificationBanner from "./VerificationBanner";
import {
  mockActivity,
  mockProfileLink,
  mockStats,
  mockUser,
  mockVerification,
} from "../../lib/mockData";
import type { Activity } from "../../types";
import { useNavigate } from "react-router-dom";
import AddProjectModal from "../projects/AddProjectModal";

const activityStyle: Record<
  Activity["kind"],
  { icon: LucideIcon; style: string }
> = {
  verified: { icon: ShieldCheck, style: "bg-verified-bg text-verified-text" },
  confirmed: { icon: Users, style: "bg-confirmed-bg text-confirmed-text" },
  "needs-changes": {
    icon: TriangleAlert,
    style: "bg-changes-bg text-changes-text",
  },
  draft: { icon: Pencil, style: "bg-self-bg text-self-text" },
};

const stats = [
  { icon: Folder, tone: "apricot", label: "Projects", ...mockStats.projects },
  {
    icon: Award,
    tone: "sage",
    label: "Certifications",
    ...mockStats.certifications,
  },
  { icon: Star, tone: "plum", label: "Skills", ...mockStats.skills },
  {
    icon: GraduationCap,
    tone: "info",
    label: "Achievements",
    ...mockStats.achievements,
  },
] as const;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const [copied, setCopied] = useState(false);
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();
  const firstName = mockUser.name.split(" ")[0];

  async function copyLink() {
    await navigator.clipboard.writeText(`https://${mockProfileLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <header className="mb-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            {greeting()}, {firstName}
          </h1>
          <p className="text-sm text-ink-muted">
            Here&apos;s where your profile stands.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex size-10 items-center justify-center rounded-full border border-line bg-white text-ink-muted hover:bg-cream"
          >
            <Bell className="size-4" />
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-error" />
          </button>

          <Button icon={<Plus className="size-4" />}>Add</Button>
          {adding && (
            <AddProjectModal
              onClose={() => setAdding(false)}
              onCreated={() => navigate("/app/projects")}
            />
          )}
        </div>
      </header>

      <VerificationBanner {...mockVerification} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-xl border border-line bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">
              Recent activity
            </h2>
            <button
              type="button"
              className="text-sm text-brand hover:underline"
            >
              View all
            </button>
          </div>
          <ul className="divide-y divide-line">
            {mockActivity.map((item) => {
              const { icon: Icon, style } = activityStyle[item.kind];
              return (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full ${style}`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">{item.text}</p>
                    <p className="text-xs text-ink-muted">{item.time}</p>
                  </div>
                  {item.action && (
                    <Button variant="outline" size="sm">
                      {item.action}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-xl border border-line bg-white p-4">
          <h2 className="mb-1 text-base font-semibold text-ink">
            Your profile link
          </h2>
          <p className="mb-3 text-sm text-ink-muted">
            Send this with job applications. Employers see what{" "}
            {mockVerification.institution} has verified.
          </p>
          <input
            readOnly
            value={mockProfileLink}
            aria-label="Your profile link"
            className="mb-3 h-10 w-full rounded-lg border border-field-border bg-white px-3 text-sm text-ink"
          />
          <Button
            size="sm"
            onClick={copyLink}
            icon={
              copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )
            }
          >
            {copied ? "Copied" : "Copy link"}
          </Button>
        </section>
      </div>
    </div>
  );
}
