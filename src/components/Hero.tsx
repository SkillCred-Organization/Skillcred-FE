import { BookOpenText, Globe2, Laptop, ShieldCheck, Star } from "lucide-react";
import { Link } from "react-router-dom";
import ProfileCard from "./ProfileCard";

const decorativeStars = ["one", "two", "three", "four", "five", "six", "seven"];

export default function Hero() {
  return (
    <section className="hero-section" aria-labelledby="hero-title">
      <div className="landing-container hero-layout">
        <div className="hero-copy">
          <p className="hero-eyebrow">
            <span>Build</span><span>Verify</span><span>Grow</span>
          </p>
          <h1 id="hero-title">
            Showcase what<br />you’ve built.
            <span>Get the recognition<br />you deserve.</span>
          </h1>
          <p className="hero-description">
            Add your projects, certifications and skills. Your school confirms
            them. Then share one link that employers can trust.
          </p>
          <div className="hero-actions">
            <Link className="landing-button button-primary" to="/signup">Create an account</Link>
            <a className="landing-button button-outline" href="#about">Learn more</a>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-circle hero-circle-green" aria-hidden="true" />
          <div className="hero-circle hero-circle-brown" aria-hidden="true" />
          <img
            src="/hero.png"
            alt="Smiling learner holding books and a tablet"
            className="hero-photo"
            width="900"
            height="1152"
            fetchPriority="high"
          />
          <div className="hero-decorations" aria-hidden="true">
            <BookOpenText className="hero-decoration hero-book" strokeWidth={1.5} />
            <Laptop className="hero-decoration hero-laptop" strokeWidth={1.5} />
            <Globe2 className="hero-decoration hero-globe" strokeWidth={1.5} />
            {decorativeStars.map((star) => (
              <Star key={star} className={`hero-star hero-star-${star}`} />
            ))}
          </div>
          <p className="hero-verification">
            <ShieldCheck aria-hidden="true" />
            Verified by Lagos Tech Institute
          </p>
          <div className="hero-profile">
            <ProfileCard />
            <img
              src="/curly-arrow.png"
              alt=""
              aria-hidden="true"
              className="hero-curly-arrow"
              width="340"
              height="340"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
