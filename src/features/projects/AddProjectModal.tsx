import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Info, Link2, Plus, X } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Stepper from "../../components/ui/Stepper";
import Toggle from "../../components/ui/Toggle";
import { addProject, getProfile } from "../../lib/api";
import type { NewProject, Project, Teammate } from "../../types";
// import OptionList from "../../components/ui/OptionsList";
// import { tracks } from "../../lib/options";
import InlineAlert from "../../components/ui/InlineAlert";
import Select from "../../components/ui/Select";
import { projectTracks } from "../../lib/options";

type FormValues = {
  title: string;
  summary: string;
  role: string;
  track: string;
  startDate: string;
  endDate: string;
  link: string;
};

const steps = ["Basics", "Proof & team", "Review"];
const stepFields: (keyof FormValues)[][] = [
  ["title", "summary", "role", "track", "startDate", "endDate"],
  ["link"],
  [],
];

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-2 text-sm">
      <dt className="w-16 shrink-0 text-ink-muted">{label}</dt>
      <dd className="min-w-0 break-words text-ink">{value}</dd>
    </div>
  );
}

type AddProjectModalProps = {
  onClose: () => void;
  onCreated: (project: Project) => void;
};

export default function AddProjectModal({
  onClose,
  onCreated,
}: AddProjectModalProps) {
  const [step, setStep] = useState(0);
  const [hasTeam, setHasTeam] = useState(false);
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [mate, setMate] = useState<Teammate>({ name: "", email: "", role: "" });
  const [askVerification, setAskVerification] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const [institutionName, setInstitutionName] = useState("your institution");

  useEffect(() => {
    getProfile()
      .then(({ profile }) => {
        if (profile?.institution?.name)
          setInstitutionName(profile.institution.name);
      })
      .catch(() => {});
  }, []);

  const {
    register,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ mode: "onTouched" });

  const people = hasTeam ? teammates : [];
  const mateValid =
    mate.name.trim() !== "" && /^\S+@\S+\.\S+$/.test(mate.email);
  const values = getValues();

  async function next() {
    const valid = await trigger(stepFields[step]);
    if (valid) setStep((s) => s + 1);
  }

  function addMate() {
    setTeammates((list) => [...list, { ...mate, name: mate.name.trim() }]);
    setMate({ name: "", email: "", role: "" });
  }

  async function submit(status: NewProject["status"]) {
    setSaving(true);
    setSubmitError(false);
    try {
      const project = await addProject({
        ...getValues(),
        teammates: people,
        status,
      });
      onCreated(project);
      onClose();
    } catch {
      setSaving(false);
      setSubmitError(true);
    }
  }

  const footer = (
    <>
      {step === 0 ? (
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      ) : (
        <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
      )}
      <div className="flex items-center gap-2">
        <Button
          variant="soft"
          disabled={saving}
          onClick={() => submit("draft")}
        >
          Save draft
        </Button>
        {step < 2 ? (
          <Button onClick={next}>Next</Button>
        ) : (
          <Button
            loading={saving}
            onClick={() =>
              submit(askVerification ? "pending" : "self-reported")
            }
          >
            {askVerification ? "Submit project" : "Add project"}
          </Button>
        )}
      </div>
    </>
  );

  return (
    <Modal
      title="Add a project"
      onClose={onClose}
      header={<Stepper steps={steps} current={step} />}
      footer={footer}
    >
      {step === 0 && (
        <div className="space-y-4">
          <Input
            label="Project title"
            placeholder="e.g. Payments API"
            helperText="Shown on your public profile"
            error={errors.title?.message}
            {...register("title", { required: "Add a project title" })}
          />
          <Input
            label="One-line summary"
            placeholder="What did you build?"
            error={errors.summary?.message}
            {...register("summary", { required: "Add a short summary" })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Your role"
              placeholder="e.g. Backend lead"
              error={errors.role?.message}
              {...register("role", { required: "Add your role" })}
            />
            <Select
              label="Track"
              placeholder="Choose a track"
              error={errors.track?.message}
              {...register("track", { required: "Choose a track" })}
            >
              {projectTracks.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Start"
              type="date"
              error={errors.startDate?.message}
              {...register("startDate", { required: "Add a start date" })}
            />
            <Input
              label="End"
              type="date"
              error={errors.endDate?.message}
              {...register("endDate", {
                validate: (v) =>
                  !v ||
                  !getValues("startDate") ||
                  v >= getValues("startDate") ||
                  "End can't be before start",
              })}
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Input
            label="Project link"
            icon={<Link2 className="size-4" />}
            placeholder="https://github.com/you/project"
            helperText="GitHub, Figma, your portfolio or any public page. Must start with https://"
            error={errors.link?.message}
            {...register("link", {
              required: "Add a link to your work",
              pattern: {
                value: /^https:\/\/\S+$/i,
                message: "Links must start with https://",
              },
            })}
          />

          <div className="rounded-lg border border-line bg-cream/50 p-3">
            <Toggle
              checked={hasTeam}
              onChange={setHasTeam}
              label="Built with a team"
              description="Teammates confirm your role. They get an email."
            />
          </div>

          {hasTeam && (
            <div className="space-y-3">
              {teammates.length > 0 && (
                <ul className="divide-y divide-line rounded-lg border border-line">
                  {teammates.map((t, i) => (
                    <li
                      key={`${t.email}-${i}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">
                          {t.name}
                        </span>
                        <span className="block truncate text-xs text-ink-muted">
                          {t.role ? `${t.role} · ` : ""}
                          {t.email}
                        </span>
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${t.name}`}
                        onClick={() =>
                          setTeammates((list) =>
                            list.filter((_, idx) => idx !== i),
                          )
                        }
                        className="flex size-8 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-cream"
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  label="Full name"
                  value={mate.name}
                  onChange={(e) => setMate({ ...mate, name: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  value={mate.email}
                  onChange={(e) => setMate({ ...mate, email: e.target.value })}
                />
                <Input
                  label="Their role"
                  value={mate.role}
                  onChange={(e) => setMate({ ...mate, role: e.target.value })}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<Plus className="size-3.5" />}
                disabled={!mateValid}
                onClick={addMate}
              >
                Add teammate
              </Button>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <dl className="divide-y divide-line rounded-lg border border-line px-4">
            <ReviewRow
              label="Project"
              value={`${values.title} · ${values.role} · ${values.startDate}${values.endDate ? ` to ${values.endDate}` : ""}`}
            />
            <ReviewRow label="Proof" value={values.link} />
            <ReviewRow
              label="Team"
              value={
                people.length
                  ? people.map((p) => p.name).join(", ")
                  : "Solo project"
              }
            />
          </dl>

          <div className="rounded-lg border border-banner-line bg-banner p-3">
            <Toggle
              checked={askVerification}
              onChange={setAskVerification}
              label={`Ask ${institutionName} to verify this`}
              description="Shows as Pending until they review it. Turn off to add it as Self-reported."
            />
          </div>

          {people.length > 0 && (
            <div className="flex gap-2 rounded-lg bg-confirmed-bg p-3 text-sm text-confirmed-text">
              <Info className="mt-0.5 size-4 shrink-0" />
              <p>
                Your teammates will be asked to confirm. When you submit, they
                get an email asking them to confirm your role.
              </p>
            </div>
          )}

          {submitError && (
            <InlineAlert variant="error" title="Couldn't save your project">
              Check your connection and try again.
            </InlineAlert>
          )}
        </div>
      )}
    </Modal>
  );
}
