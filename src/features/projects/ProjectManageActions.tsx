import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { useToast } from "../../components/ui/toastContext";
import { deleteProject, getProject } from "../../lib/api";
import { errorText } from "../../lib/errors";
import type { ProjectDetail } from "../../types";
import AddProjectModal from "./AddProjectModal";

type ProjectManageActionsProps = {
  project: ProjectDetail;
  onUpdated: (project: ProjectDetail) => void;
  autoOpen?: boolean;
};

export default function ProjectManageActions({
  project,
  onUpdated,
  autoOpen = false,
}: ProjectManageActionsProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const [editing, setEditing] = useState(autoOpen);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteProject(project.id);
      toast.success("Project deleted.");
      navigate("/app/projects", { replace: true });
    } catch (err) {
      setDeleting(false);
      setConfirming(false);
      toast.error(
        errorText(err, "Couldn't delete this project. Please try again."),
      );
    }
  }

  if (!project.actions.edit && !project.actions.delete) return null;

  return (
    <>
      {project.actions.edit && (
        <Button
          variant="outline"
          icon={<Pencil className="size-4" />}
          onClick={() => setEditing(true)}
        >
          Edit
        </Button>
      )}
      {project.actions.delete && (
        <Button
          variant="ghost"
          icon={<Trash2 className="size-4" />}
          onClick={() => setConfirming(true)}
        >
          Delete
        </Button>
      )}

      {editing && (
        <AddProjectModal
          project={project}
          onClose={() => setEditing(false)}
          onCreated={(saved) => {
  toast.success(
    project.status === 'needs-changes'
      ? 'Changes saved. Press Request verification to send it again.'
      : saved.status === 'pending'
        ? 'Sent for verification.'
        : project.status === 'draft' && saved.status !== 'draft'
          ? 'Added to your projects.'
          : saved.status === 'draft'
            ? 'Draft saved.'
            : 'Changes saved.',
  )
  if (saved.id !== project.id) navigate(`/app/projects/${saved.id}`, { replace: true })
  else getProject(project.id).then(onUpdated).catch(() => {})
}}
   
        />
      )}

      {confirming && (
        <Modal
          title="Delete this project?"
          onClose={() => setConfirming(false)}
          footer={
            <>
              <Button variant="outline" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button loading={deleting} onClick={handleDelete}>
                Delete project
              </Button>
            </>
          }
        >
          <p className="text-sm text-ink-muted">
            {project.title} will be removed from your profile. This can&apos;t
            be undone.
          </p>
        </Modal>
      )}
    </>
  );
}
