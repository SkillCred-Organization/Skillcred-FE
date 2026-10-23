import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Info, Link2, Plus, X } from "lucide-react";
import Button from "../../components/ui/Button";
import InlineAlert from "../../components/ui/InlineAlert";
import Input from "../../components/ui/Input";
import Modal from "../../components/ui/Modal";
import Select from "../../components/ui/Select";
import Stepper from "../../components/ui/Stepper";
import Toggle from "../../components/ui/Toggle";
import { addProject, getProfile, updateProject } from "../../lib/api";
import { errorText } from "../../lib/errors";
import { projectTracks } from "../../lib/options";
import type { NewProject, Project, ProjectDetail, Teammate } from "../../types";
import type { Path } from "react-hook-form";
import Textarea from "../../components/ui/Textarea";
import { detailFields } from "../../lib/projectFields";
import type { DetailKey } from "../../lib/projectFields";

type FormValues = {
  title: string;
  summary: string;
  role: string;
  track: string;
  startDate: string;
  endDate: string;
  link: string;
  details: Partial<Record<DetailKey, string>>;
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
  project?: ProjectDetail; // when given, the modal edits this project instead of adding a new one
};

export default function AddProjectModal({
  onClose,
  onCreated,
  project,
}: AddProjectModalProps) {
  const editing = Boolean(project);
  const [step, setStep] = useState(0);
  const [hasTeam, setHasTeam] = useState((project?.teammates.length ?? 0) > 0);
  const [teammates, setTeammates] = useState<Teammate[]>(
    project?.teammates ?? [],
  );
  const [mate, setMate] = useState<Teammate>({ name: "", email: "", role: "" });
  const [askVerification, setAskVerification] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [institutionName, setInstitutionName] = useState("your institution");

  useEffect(() => {
    if (editing) return;
    getProfile()
      .then(({ profile }) => {
        if (profile?.institution?.name)
          setInstitutionName(profile.institution.name);
      })
      .catch(() => {});
  }, [editing]);

  const {
    register,
    trigger,
    getValues,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    mode: "onTouched",
    defaultValues: project
      ? {
          title: project.title,
          summary: project.summary,
          role: project.role,
          track: project.track,
          startDate: project.startDate.slice(0, 10),
          endDate: project.endDate.slice(0, 10),
          link: project.proofLink,
          details: project.details as FormValues["details"],
        }
      : undefined,
  });

  const track = useWatch({ control, name: "track" });
  const trackFields = detailFields[track] ?? [];
  const people = hasTeam ? teammates : [];
  const mateValid =
    mate.name.trim() !== "" && /^\S+@\S+\.\S+$/.test(mate.email);
  const values = getValues();

  async function next() {
    const linkFields = trackFields
      .filter((f) => f.kind === "link")
      .map((f) => `details.${f.key}` as const);
    const names: Path<FormValues>[] =
      step === 1 ? ["link", ...linkFields] : stepFields[step];
    const valid = await trigger(names);
    if (valid) setStep((s) => s + 1);
  }

  function addMate() {
    setTeammates((list) => [...list, { ...mate, name: mate.name.trim() }]);
    setMate({ name: "", email: "", role: "" });
  }

  async function submit(status: NewProject["status"]) {
    setSaving(true);
    setSubmitError("");
    try {
      const fields = { ...getValues(), teammates: people };
      const saved = project
        ? await updateProject(project.id, fields)
        : await addProject({ ...fields, status });
      onCreated(saved);
      onClose();
    } catch (err) {
      setSaving(false);
      setSubmitError(
        errorText(
          err,
          "Couldn't save your project. Check your connection and try again.",
        ),
      );
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
        {!editing && (
          <Button
            variant="soft"
            disabled={saving}
            onClick={() => submit("draft")}
          >
            Save draft
          </Button>
        )}
        {step < 2 ? (
          <Button onClick={next}>Next</Button>
        ) : (
          <Button
            loading={saving}
            onClick={() =>
              submit(askVerification ? "pending" : "self-reported")
            }
          >
            {editing
              ? "Save changes"
              : askVerification
                ? "Submit project"
                : "Add project"}
          </Button>
        )}
      </div>
    </>
  );

  return (
    <Modal
      title={editing ? "Edit project" : "Add a project"}
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

          {trackFields.length > 0 && (
            <details
              className="rounded-lg border border-line"
              open={editing && Object.keys(project?.details ?? {}).length > 0}
            >
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-ink">
                More about this project (optional)
              </summary>
              <div className="space-y-3 border-t border-line p-3">
                {trackFields.map((f) => {
                  const name = `details.${f.key}` as const;
                  const message = errors.details?.[f.key]?.message;
                  if (f.kind === "long") {
                    return (
                      <Textarea
                        key={f.key}
                        label={f.label}
                        placeholder={f.placeholder}
                        maxLength={2000}
                        error={message}
                        {...register(name)}
                      />
                    );
                  }
                  return (
                    <Input
                      key={f.key}
                      label={f.label}
                      placeholder={f.placeholder}
                      helperText={
                        f.kind === "list" ? "Separate with commas" : undefined
                      }
                      maxLength={f.kind === "link" ? undefined : 2000}
                      error={message}
                      {...register(
                        name,
                        f.kind === "link"
                          ? {
                              pattern: {
                                value: /^https:\/\/\S+$/i,
                                message: "Links must start with https://",
                              },
                            }
                          : undefined,
                      )}
                    />
                  );
                })}
              </div>
            </details>
          )}

          <div className="rounded-lg border border-line bg-cream/50 p-3">
            <Toggle
              checked={hasTeam}
              onChange={setHasTeam}
              label="Built with a team"
              description="Teammates are saved with the project. Invitation emails are not sent yet."
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

          {editing ? (
            <InlineAlert
              variant="info"
              title="Saving doesn't send this for verification"
            >
              Use Request verification on the project page when you are ready.
            </InlineAlert>
          ) : (
            <div className="rounded-lg border border-banner-line bg-banner p-3">
              <Toggle
                checked={askVerification}
                onChange={setAskVerification}
                label={`Ask ${institutionName} to verify this`}
                description="Shows as Pending until they review it. Turn off to add it as Self-reported."
              />
            </div>
          )}

          {people.length > 0 && (
            <div className="flex gap-2 rounded-lg bg-confirmed-bg p-3 text-sm text-confirmed-text">
              <Info className="mt-0.5 size-4 shrink-0" />
              <p>
                Teammates are saved with the project. Invitation emails are not
                sent yet.
              </p>
            </div>
          )}

          {submitError && (
            <InlineAlert variant="error" title="Couldn't save your project">
              {submitError}
            </InlineAlert>
          )}
        </div>
      )}
    </Modal>
  );
}
