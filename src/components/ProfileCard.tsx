import { Award, Check, Folder, GraduationCap, Star } from "lucide-react";

const profileItems = [
  { label: "Projects", Icon: Folder, tone: "peach" },
  { label: "Certifications", Icon: Award, tone: "sage" },
  { label: "Skills", Icon: Star, tone: "lilac" },
  { label: "Achievements", Icon: GraduationCap, tone: "blue" },
];

export default function ProfileCard() {
  return (
    <div className="profile-card" aria-label="Example verified learner profile">
      <div className="profile-heading">
        <span className="profile-avatar">AO</span>
        <div>
          <p className="profile-name">Adaeze Okafor</p>
          <p className="profile-role">Backend Engineer</p>
        </div>
      </div>
      <ul className="profile-items">
        {profileItems.map(({ label, Icon, tone }) => (
          <li key={label}>
            <span className={`profile-icon icon-${tone}`}><Icon aria-hidden="true" /></span>
            <span>{label}</span>
            <span className="profile-check" aria-label="Verified"><Check aria-hidden="true" /></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
