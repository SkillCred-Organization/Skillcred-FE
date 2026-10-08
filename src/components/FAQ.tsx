import { useState } from "react";
import { Plus, Minus } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const faqs: FaqItem[] = [
  {
    q: "Is SkillCred free for learners?",
    a: "Yes. Learners can build, verify and share a profile for free.",
  },
  {
    q: "What can my institution verify?",
    a: "Your institution can confirm projects, certifications, skills and achievements linked to its programmes.",
  },
  {
    q: "What if my institution isn’t on SkillCred?",
    a: "You can still build your profile. Items will show as self-reported until your institution joins.",
  },
  {
    q: "Who can see my profile?",
    a: "Anyone with your link. You choose what to share and can update it at any time.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-[#FCEDE2] py-16">
      <div className="mx-auto grid max-w-5xl gap-10 px-6 md:grid-cols-[1fr_2fr]">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#3F6B12]">
            FAQ
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[#2B1A10]">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-xs text-[#5A4A40]">
            Can’t find what you need? Email hello@skillcred.app.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map(({ q, a }, i) => {
            const isOpen = open === i;
            return (
              <div key={q} className="rounded-xl bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-[#2B1A10]"
                >
                  {q}
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full ${
                      isOpen ? "bg-[#3F6B12] text-white" : "bg-[#FCE3D3] text-[#6B3A1F]"
                    }`}
                  >
                    {isOpen ? <Minus size={12} /> : <Plus size={12} />}
                  </span>
                </button>
                {isOpen && <p className="px-4 pb-4 text-xs text-[#5A4A40]">{a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}