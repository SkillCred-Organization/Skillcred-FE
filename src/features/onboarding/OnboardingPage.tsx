import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, Plus, Search, User, X } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { saveOnboarding } from "../../lib/api";
import { mockUser } from "../../lib/mockData";
import type { Institution } from "../../types";
import InstitutionPicker from "./InstitutionPicker";

type FormValues = {
  headline: string;
  location: string;
  programme: string;
  track: string;
  year: string;
};

const stepFields: (keyof FormValues)[][] = [
  ["headline", "location"],
  ["programme", "track", "year"],
  [],
];

const programmes = [
  "Software Engineering (Backend)",
  "Software Engineering (Frontend)",
  "Product Design",
  "Data Analysis",
  "Product Management",
];
const tracks = [
  "Software Engineering",
  "Product Design",
  "Data Analysis",
  "Product Management",
];
const years = Array.from({ length: 11 }, (_, i) =>
  String(new Date().getFullYear() - i),
);

const suggestions: Record<string, string[]> = {
  "Software Engineering": ["Docker", "Express", "TypeScript", "Testing"],
  "Product Design": ["Figma", "User research", "Prototyping", "Design systems"],
  "Data Analysis": ["SQL", "Python", "Power BI", "Excel"],
  "Product Management": ["Roadmapping", "User stories", "Analytics", "Jira"],
};

const copy = [
  {
    title: "Tell us about you",
    text: "This appears at the top of your profile. You can change it later.",
  },
  {
    title: "Where did you study?",
    text: "Your institution uses this to verify your work. You can add more later.",
  },
  {
    title: "Add your skills",
    text: "Pick the skills employers should see. You can edit them later.",
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [institutionError, setInstitutionError] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillQuery, setSkillQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const {
    register,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    mode: "onTouched",
    defaultValues: {
      headline: "",
      location: "",
      programme: "",
      track: "",
      year: "",
    },
  });

  async function next() {
    let valid = await trigger(stepFields[step]);
    if (step === 1 && !institution?.name.trim()) {
      setInstitutionError("Search for your institution, or type its name");
      valid = false;
    }
    if (valid) setStep((s) => s + 1);
  }

  function skip() {
    if (step < 2) setStep((s) => s + 1);
    else finish();
  }

  async function finish() {
    setSaving(true);
    setSaveError(false);
    try {
      await saveOnboarding({ ...getValues(), institution, skills });
      navigate("/app/dashboard");
    } catch {
      setSaving(false);
      setSaveError(true);
    }
  }

  function addSkill(name: string) {
    const skill = name.trim();
    if (!skill) return;
    setSkills((list) =>
      list.some((s) => s.toLowerCase() === skill.toLowerCase())
        ? list
        : [...list, skill],
    );
    setSkillQuery("");
  }

  const track = getValues("track");
  const suggested = (
    suggestions[track] ?? suggestions["Software Engineering"]
  ).filter((s) => !skills.some((x) => x.toLowerCase() === s.toLowerCase()));

  return (
    <div className="relative min-h-screen overflow-hidden bg-page">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-soft"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-sage-bg"
      />

      <header className="relative px-6 py-5">
        <img src="/logo.svg" alt="SkillCred" className="h-7" />
      </header>

      <main className="relative flex justify-center px-4 pb-12 pt-4 sm:pt-10">
        <div className="w-full max-w-[440px] rounded-2xl bg-white p-6 shadow-sm ring-1 ring-line sm:p-8">
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
            Step {step + 1} of 3
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">
            {copy[step].title}
          </h1>
          <p className="mb-6 mt-1 text-sm text-ink-muted">{copy[step].text}</p>

          {step === 0 && (
            <div className="space-y-4">
              <Input
                label="Full name"
                icon={<User className="size-4" />}
                defaultValue={mockUser.name}
                helperText="Taken from your sign-up"
                disabled
              />
              <Input
                label="Headline"
                placeholder="e.g. Backend Engineer"
                helperText="Your current or target role"
                error={errors.headline?.message}
                {...register("headline", { required: "Add your headline" })}
              />
              <Input
                label="Location (optional)"
                icon={<MapPin className="size-4" />}
                placeholder="e.g. Lagos, Nigeria"
                {...register("location")}
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <InstitutionPicker
                value={institution}
                onChange={(value) => {
                  setInstitution(value);
                  setInstitutionError("");
                }}
                error={institutionError}
              />
              <Select
                label="Programme"
                placeholder="Choose your programme"
                error={errors.programme?.message}
                {...register("programme", {
                  required: "Choose your programme",
                })}
              >
                {programmes.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Track"
                  placeholder="Choose a track"
                  error={errors.track?.message}
                  {...register("track", { required: "Choose a track" })}
                >
                  {tracks.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Year"
                  placeholder="Year"
                  error={errors.year?.message}
                  {...register("year", { required: "Choose a year" })}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <Input
                label="Search skills"
                icon={<Search className="size-4" />}
                placeholder="e.g. Python, Figma, SQL"
                helperText="Press Enter to add"
                value={skillQuery}
                onChange={(e) => setSkillQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill(skillQuery);
                  }
                }}
              />

              {skills.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        aria-label={`Remove ${s}`}
                        onClick={() =>
                          setSkills((list) => list.filter((x) => x !== s))
                        }
                        className="inline-flex h-7 items-center gap-1 rounded-full bg-brand pl-3 pr-2 text-xs font-medium text-white hover:bg-brand-dark"
                      >
                        {s}
                        <X className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mb-2 mt-5 text-xs text-ink-muted">
                {track ? `Suggested for ${track}` : "Suggested skills"}
              </p>
              <ul className="flex flex-wrap gap-2">
                {suggested.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => addSkill(s)}
                      className="inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-field-border px-3 text-xs text-ink hover:bg-cream"
                    >
                      {s}
                      <Plus className="size-3" />
                    </button>
                  </li>
                ))}
              </ul>

              {saveError && (
                <p className="mt-4 text-sm text-error">
                  Couldn&apos;t save your profile. Check your connection and try
                  again.
                </p>
              )}
            </div>
          )}

          <div className="mt-6 space-y-2">
            {step < 2 ? (
              <Button className="w-full" onClick={next}>
                Continue
              </Button>
            ) : (
              <Button className="w-full" loading={saving} onClick={finish}>
                Finish setup
              </Button>
            )}
            <div className="flex justify-center gap-2">
              {step > 0 && (
                <Button
                  variant="ghost"
                  icon={<ChevronLeft className="size-4" />}
                  disabled={saving}
                  onClick={() => setStep((s) => s - 1)}
                >
                  Back
                </Button>
              )}
              <Button variant="ghost" disabled={saving} onClick={skip}>
                Skip for now
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
