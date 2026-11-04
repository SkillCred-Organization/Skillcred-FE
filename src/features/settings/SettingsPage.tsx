import { useRef, useState } from "react";
import { LockKeyhole, Mail, MapPin, Upload, UserRound } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import LogoutModal from "../../components/layout/LogoutModal";
import { useToast } from "../../components/ui/toastContext";
import { useAuth } from "../auth/authContext";
import { settingsApi, type AccountProfile } from "../../lib/settings";
import { trackEvent } from "../../lib/analytics";
import { removeAvatar, uploadAvatar } from "../../lib/avatar";
import { useResource } from "../../hooks/useResource";
import {
  ErrorNotice,
  PageHeading,
  Panel,
  PersonAvatar,
  ResourceState,
  Unavailable,
} from "../admin/AdminUI";
import { DataExport, PasswordSettings } from "./SettingsSections";
import EmailNotificationSettings from "./EmailNotificationsSetting";
import "../../workspace.css";
import DeleteAccountModal from "./DeleteAccountModal";

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_MAX_MB = 3;

function AccountForm({
  profile,
  onPhotoChanged,
}: {
  profile: AccountProfile | null;
  onPhotoChanged: () => void;
}) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    profile?.avatarUrl ?? undefined,
  );

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await settingsApi.saveProfile({
        headline: String(values.get("headline")).trim(),
        location: String(values.get("location")).trim(),
      });
      trackEvent("account_updated");
      toast.success("Account changes saved.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to save account changes.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onPhotoChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets them choose the same file again later
    if (!file) return;
    setPhotoError("");
    if (!PHOTO_TYPES.includes(file.type)) {
      setPhotoError("Choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > PHOTO_MAX_MB * 1024 * 1024) {
      setPhotoError(
        `That image is too large. Choose one under ${PHOTO_MAX_MB} MB.`,
      );
      return;
    }
    setUploading(true);
    try {
      const result = await uploadAvatar(file);
      setAvatarUrl(result.avatarUrl);
      toast.success("Profile photo updated.");
      onPhotoChanged?.();
    } catch (e) {
      setPhotoError(
        e instanceof Error
          ? e.message
          : "Couldn't upload your photo. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function onRemovePhoto() {
    if (!window.confirm("Remove your profile photo?")) return;
    setPhotoError("");
    setRemoving(true);
    try {
      await removeAvatar();
      setAvatarUrl(undefined);
      toast.success("Profile photo removed.");
      onPhotoChanged?.();
    } catch (e) {
      setPhotoError(
        e instanceof Error
          ? e.message
          : "Couldn't remove your photo. Please try again.",
      );
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Panel>
      <form onSubmit={save} className="workspace-form">
        <ErrorNotice message={error} />
        <div className="photo-control">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Your profile photo"
              width={72}
              height={72}
              referrerPolicy="no-referrer"
              onError={() => setPhotoError("The photo couldn't be displayed.")}
              style={{
                width: 72,
                height: 72,
                minWidth: 72,
                flexShrink: 0,
                display: "block",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <PersonAvatar name={user?.fullName} large />
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={onPhotoChosen}
          />
          <Button
            type="button"
            variant="outline"
            icon={<Upload size={16} />}
            loading={uploading}
            disabled={removing}
            onClick={() => fileInput.current?.click()}
          >
            {avatarUrl ? "Change photo" : "Upload photo"}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              loading={removing}
              disabled={uploading}
              onClick={onRemovePhoto}
            >
              Remove photo
            </Button>
          )}
        </div>
        <ErrorNotice message={photoError} />
        <div className="workspace-form-columns">
          <Input
            label="Full name"
            value={user?.fullName || ""}
            readOnly
            icon={<UserRound size={20} />}
          />
          <Input
            label="Headline"
            name="headline"
            defaultValue={profile?.headline || ""}
            placeholder="e.g. Backend Engineer"
            maxLength={100}
            disabled={busy}
          />
        </div>
        <Input
          label="Email"
          value={user?.email || ""}
          readOnly
          icon={<Mail size={20} />}
          helperText="To change your name or email, contact hello@skillcred.app."
        />
        <Input
          label="Location"
          name="location"
          defaultValue={profile?.location || ""}
          maxLength={100}
          placeholder="e.g. Lagos, Nigeria"
          disabled={busy}
          icon={<MapPin size={20} />}
        />
        <Button type="submit" loading={busy} className="self-start">
          Save changes
        </Button>
      </form>
    </Panel>
  );
}

function AccountSettings() {
  const resource = useResource(settingsApi.profile);
  const [logout, setLogout] = useState(false);
  const [deleting, setDeleting] = useState(false);
  return (
    <>
      <ResourceState {...resource} retry={resource.reload} />
      {resource.data && (
        <AccountForm
          profile={resource.data.profile}
          onPhotoChanged={resource.reload}
        />
      )}
      <Panel className="danger-panel">
        <div>
          <h2>Delete account</h2>
          <p>Removes your profile and all claims for good.</p>
        </div>
        <Button variant="outline" onClick={() => setDeleting(true)}>
          Delete account
        </Button>
      </Panel>
      <button
        className="settings-logout workspace-link"
        onClick={() => setLogout(true)}
      >
        Log out
      </button>
      {logout && <LogoutModal onClose={() => setLogout(false)} />}
      {deleting && <DeleteAccountModal onClose={() => setDeleting(false)} />}
    </>
  );
}

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const tab =
    params.get("tab") === "notifications"
      ? "notifications"
      : params.get("tab") === "security"
        ? "security"
        : "account";
  return (
    <div className="workspace learner-settings">
      <PageHeading
        title="Settings"
        description="Manage your account, emails and security."
        back="/app/profile"
      />
      <div className="settings-tabs" role="tablist" aria-label="Settings">
        {[
          { id: "account", label: "Account" },
          { id: "notifications", label: "Notifications" },
          { id: "security", label: "Security & data" },
        ].map((item) => (
          <button
            role="tab"
            aria-selected={tab === item.id}
            aria-controls="settings-content"
            id={`settings-tab-${item.id}`}
            key={item.id}
            onClick={() => setParams({ tab: item.id })}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        id="settings-content"
        role="tabpanel"
        aria-labelledby={`settings-tab-${tab}`}
        className="settings-content workspace-stack"
      >
        {tab === "account" ? (
          <AccountSettings />
        ) : tab === "notifications" ? (
          <EmailNotificationSettings email={user?.email} />
        ) : (
          <>
            <PasswordSettings />
            <Panel>
              <h2>Connected accounts</h2>
              <p>Google account connections can’t be changed here yet.</p>
              <Button variant="outline" disabled>
                Disconnect Google
              </Button>
            </Panel>
            <Panel>
              <h2>Sessions</h2>
              <p>
                <LockKeyhole size={18} className="inline" /> Changing your
                password signs you out of other devices.
              </p>
              <Unavailable>
                A list of devices and individual session controls is not
                available.
              </Unavailable>
            </Panel>
            <DataExport />
          </>
        )}
      </div>
    </div>
  );
}
