import { ChevronRight, Code } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import type { Project } from "../../types";
import { Link } from "react-router-dom";

type ProjectRowProps = {
  project: Project;
  onRequestVerification?: (id: string) => void;
  busy?: boolean;
};

export default function ProjectRow({
  project,
  onRequestVerification,
  busy = false,
}: ProjectRowProps) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-line bg-white p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cream text-ink-muted">
        <Code className="size-4" />
      </span>
      <div className="min-w-0 flex-1 basis-48">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-ink">
            <Link
              to={`/app/projects/${project.id}`}
              className="hover:underline"
            >
              {project.title}
            </Link>
          </h3>
          <Badge status={project.status} />
        </div>
        <p className="text-sm text-ink-muted">{project.summary}</p>
        <p className="text-xs text-ink-muted">{project.meta}</p>
      </div>
      {project.actions.requestVerification && onRequestVerification ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          loading={busy}
          onClick={() => onRequestVerification(project.id)}
        >
          Request verification
        </Button>
      ) : (
        <Link
          to={`/app/projects/${project.id}`}
          aria-label={`Open ${project.title}`}
        >
          <ChevronRight className="size-4 text-ink-muted" />
        </Link>
      )}
    </li>
  );
}
