import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  { q: "Is SkillCred free for learners?", a: "Yes. Learners can build, verify and share a profile for free." },
  { q: "What can my institution verify?", a: "Your institution can confirm projects, certifications, skills and achievements linked to its programmes." },
  { q: "What if my institution isn’t on SkillCred?", a: "You can still build your profile. Items will show as self-reported until your institution joins." },
  { q: "Who can see my profile?", a: "Anyone with your link. You choose what to share and can update it at any time." },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="faq-section" aria-labelledby="faq-title">
      <div className="landing-container faq-layout">
        <div className="faq-intro">
          <p className="landing-eyebrow">FAQ</p>
          <h2 id="faq-title" className="landing-heading">Frequently asked questions</h2>
          <p className="landing-description">
            Can’t find what you need? Email <a href="mailto:hello@skillcred.app">hello@skillcred.app.</a>
          </p>
        </div>
        <div className="faq-list">
          {faqs.map(({ q, a }, index) => {
            const isOpen = open === index;
            return (
              <div key={q} className={`faq-item${isOpen ? " is-open" : ""}`}>
                <h3>
                  <button
                    id={`faq-question-${index}`}
                    type="button"
                    onClick={() => setOpen(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                  >
                    {q}
                    <span className="faq-toggle" aria-hidden="true">
                      {isOpen ? <Minus /> : <Plus />}
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-answer-${index}`}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                  hidden={!isOpen}
                >
                  <p>{a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
