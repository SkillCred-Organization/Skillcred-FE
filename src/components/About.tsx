import { Star, ShieldCheck, Users, type LucideIcon } from "lucide-react";

interface AboutCard {
  title: string;
  text: string;
  Icon: LucideIcon;
  bg: string;
  color: string;
}

const cards: AboutCard[] = [
  {
    title: "Our mission",
    text: "Help every learner prove what they can do, with records employers can trust.",
    Icon: Star,
    bg: "bg-[#FCE3D3]",
    color: "text-[#6B3A1F]",
  },
  {
    title: "Built on trust",
    text: "Every Verified badge is confirmed by the institution that taught the learner.",
    Icon: ShieldCheck,
    bg: "bg-[#D9EBC3]",
    color: "text-[#3F6B12]",
  },
  {
    title: "Who it’s for",
    text: "Learners, early graduates and the institutions that support them.",
    Icon: Users,
    bg: "bg-[#F1DEF7]",
    color: "text-[#8A3FA8]",
  },
];

export default function About() {
  return (
    <section id="about" className="bg-[#FCEDE2] py-16">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#3F6B12]">
          About us
        </p>
        <h2 className="mt-2 text-3xl font-bold text-[#2B1A10]">
          Turning real work into{" "}
          <span className="text-[#3F6B12]">trusted credentials.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-[#5A4A40]">
          Talented learners often struggle to prove what they can do. We give
          them a trusted record of their work so employers can hire with
          confidence.
        </p>

        <div className="mt-10 grid gap-4 text-left md:grid-cols-3">
          {cards.map(({ title, text, Icon, bg, color }) => (
            <div key={title} className="rounded-xl bg-white p-5 shadow-sm">
              <div className={`mb-4 flex h-8 w-8 items-center justify-center rounded-full ${bg}`}>
                <Icon size={14} className={color} />
              </div>
              <h3 className="text-sm font-semibold text-[#2B1A10]">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-[#5A4A40]">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}