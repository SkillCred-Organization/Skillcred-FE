import { Folder, Award, Star, GraduationCap, type LucideIcon } from "lucide-react";

interface FeatureItem {
  title: string;
  text: string;
  Icon: LucideIcon;
  bg: string;
  color: string;
}

const items: FeatureItem[] = [
  {
    title: "Projects",
    text: "Repos, demos and case studies.",
    Icon: Folder,
    bg: "bg-[#D9EBC3]",
    color: "text-[#3F6B12]",
  },
  {
    title: "Certifications",
    text: "From your programme or other courses.",
    Icon: Award,
    bg: "bg-[#FCE3D3]",
    color: "text-[#6B3A1F]",
  },
  {
    title: "Skills",
    text: "Linked to the work that proves them.",
    Icon: Star,
    bg: "bg-[#D9EBC3]",
    color: "text-[#3F6B12]",
  },
  {
    title: "Achievements",
    text: "Awards, hackathons and recognitions.",
    Icon: GraduationCap,
    bg: "bg-[#F1DEF7]",
    color: "text-[#8A3FA8]",
  },
];

export default function Features() {
  return (
    <section id="learners" className="bg-[#FFF8F3] py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#3F6B12]">
            For learners
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#2B1A10]">
            Everything you’ve done, in one place
          </h2>

          <div className="mt-8 grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            {items.map(({ title, text, Icon, bg, color }) => (
              <div key={title} className="flex flex-col items-center">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${bg}`}>
                  <Icon size={16} className={color} />
                </div>
                <h3 className="text-sm font-semibold text-[#2B1A10]">{title}</h3>
                <p className="mt-1 max-w-[150px] text-xs text-[#5A4A40]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}