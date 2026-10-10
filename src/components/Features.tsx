import { Folder, Award, Star, GraduationCap } from "lucide-react";

const items = [
  { title: "Projects", text: "Repos, demos and case studies.", Icon: Folder, tone: "sage" },
  { title: "Certifications", text: "From your programme or other courses.", Icon: Award, tone: "peach" },
  { title: "Skills", text: "Linked to the work that proves them.", Icon: Star, tone: "green" },
  { title: "Achievements", text: "Awards, hackathons and recognitions.", Icon: GraduationCap, tone: "lilac" },
];

export default function Features() {
  return (
    <section id="learners" className="learners-section" aria-labelledby="learners-title">
      <div className="landing-container">
        <div className="learners-card">
          <p className="landing-eyebrow">For learners</p>
          <h2 id="learners-title">Everything you’ve done, in one place</h2>
          <ul className="features-grid">
            {items.map(({ title, text, Icon, tone }) => (
              <li key={title} className="feature-item">
                <span className={`landing-icon icon-${tone}`}><Icon aria-hidden="true" /></span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
