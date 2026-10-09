import { Star, ShieldCheck, Users } from "lucide-react";

const cards = [
  {
    title: "Our mission",
    text: "Help every learner prove what they can do, with records employers can trust.",
    Icon: Star,
    tone: "peach",
  },
  {
    title: "Built on trust",
    text: "Every Verified badge is confirmed by the institution that taught the learner.",
    Icon: ShieldCheck,
    tone: "green",
  },
  {
    title: "Who it’s for",
    text: "Learners, early graduates and the institutions that support them.",
    Icon: Users,
    tone: "lilac",
  },
];

export default function About() {
  return (
    <section id="about" className="about-section" aria-labelledby="about-title">
      <div className="landing-container">
        <div className="about-intro">
          <p className="landing-eyebrow">About us</p>
          <h2 id="about-title" className="landing-heading">
            Turning real work into <span>trusted credentials.</span>
          </h2>
          <p className="landing-description">
            Talented learners often struggle to prove what they can do. We give
            them a trusted record of their work so employers can hire with confidence.
          </p>
        </div>
        <div className="about-grid">
          {cards.map(({ title, text, Icon, tone }) => (
            <article key={title} className="about-card">
              <span className={`landing-icon icon-${tone}`}><Icon aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
