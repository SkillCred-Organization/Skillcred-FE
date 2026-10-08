import { BookOpenText, Laptop, Globe2, ShieldCheck, Star } from "lucide-react";

import Features from "./Features";
import ProfileCard from "./ProfileCard";

export default function Hero() {
  return (
    <>
      <section className="relative overflow-hidden bg-[#F8EEE6]">
        <div className="absolute right-0 top-0 h-[420px] w-[420px] translate-x-1/4 -translate-y-1/4 rounded-full bg-[#F5D5C8]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div className="relative z-10">
           <span className="relative -top-10 inline-block rounded-full border border-[#E5F0D8] bg-white px-6 py-1 text-xs text-[#2B1A10] shadow-sm">
              Build{" "}
              <span className="text-[#8FB85A]">•</span> Verify{" "}
              <span className="text-[#8FB85A]">•</span> Grow
            </span>

            <h1 className="mt-5 text-4xl font-bold leading-tight text-[#26160E] md:text-5xl">
              Showcase what
              <br className="hidden md:block" />
              you’ve built.
              <span className="block text-[#3F6B12]">
                Get the recognition you deserve.
              </span>
            </h1>

            <p className="mt-5 max-w-md text-sm leading-relaxed text-[#63554D]">
              Add your projects, certifications and skills. Your school
              confirms them. Then share one link that employers can trust.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="/signup"
                className="rounded-full bg-[#542C18] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#432313]"
              >
                Create an account
              </a>

              <a
                href="#about"
                className="rounded-full border border-[#6B3A1F] px-6 py-2.5 text-sm font-medium text-[#6B3A1F] transition hover:bg-[#6B3A1F]/5"
              >
                Learn more
              </a>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-[#63554D]">
              <div className="flex gap-0.5 text-[#D6A84F]">
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
                <Star size={14} fill="currentColor" />
              </div>

              <span>Trusted by students & institutions</span>
            </div>
          </div>

          <div className="relative mx-auto h-[470px] w-full max-w-md">
            <div className="absolute right-6 top-6 h-72 w-72 rounded-full bg-[#8FA96B]" />

            <div className="absolute bottom-6 right-0 h-24 w-24 rounded-full bg-[#5C321B]" />

            {/* Decorative stars */}
            <Star
              size={20}
              fill="currentColor"
              className="absolute left-2 top-20 z-20 rotate-12 text-[#8FB85A] drop-shadow-[0_3px_3px_rgba(38,23,13,0.18)]"
            />

            <Star
              size={15}
              fill="currentColor"
              className="absolute left-16 top-10 z-20 text-[#6B3A1F] drop-shadow-[0_3px_3px_rgba(38,23,13,0.18)]"
            />

            <Star
              size={22}
              fill="currentColor"
              className="absolute right-20 top-4 z-20 text-[#D6A84F] drop-shadow-[0_3px_3px_rgba(38,23,13,0.18)]"
            />

            <Star
              size={20}
              fill="currentColor"
              className="absolute right-4 top-32 z-20 rotate-12 text-[#3F6B12] drop-shadow-[0_4px_4px_rgba(38,23,13,0.38)]"
            />

            <Star
              size={13}
              fill="currentColor"
              className="absolute left-20 bottom-28 z-20 text-[#6B3A1F] drop-shadow-[0_4px_4px_rgba(38,23,13,0.38)]"
            />

            <Star
              size={18}
              fill="currentColor"
              className="absolute right-24 bottom-20 z-20 rotate-[-15deg] text-[#D6A84F] drop-shadow-[0_4px_4px_rgba(38,23,13,0.38)]"
            />

            <Star
              size={15}
              fill="currentColor"
              className="absolute left-4 bottom-36 z-20 text-[#3F6B12] drop-shadow-[0_4px_4px_rgba(38,23,13,0.38)]"
            />

            <img
              src="/hero.png"
              alt="Smiling learner holding books"
              className="absolute bottom-0 right-[-10px] z-10 h-[470px] w-auto object-contain"
            />

            <span className="absolute right-[-120px] top-16 z-30 flex items-center gap-1.5 rounded-full bg-[#3F6B12] px-3 py-1.5 text-xs text-white shadow-md">
              <ShieldCheck size={18} />
              Verified by Lagos Tech Institute
            </span>

            <ProfileCard />

            <img
               src="/curly-arrow.png"
               alt=""
               className="absolute bottom-[220px] left-[90px] z-30 h-[105px] w-[115px] rotate-[20deg] object-contain opacity-90"
            />
{/* book */}
<div className="absolute top-[-6px] left-[-40px] z-30 flex h-16 w-20 rotate-[-25deg] items-center justify-center rounded-xl">
  <BookOpenText
    size={42}
    strokeWidth={1.5}
    className="text-[#A56A45]"
  />
</div>

{/* laptop */}
<div className="absolute bottom-[10px] right-[-60px] z-30 flex h-16 w-20 rotate-[8deg] items-center justify-center">
  <Laptop
    size={42}
    strokeWidth={1.5}
    className="text-[#3F6B12]"
  />
</div>

            {/* Globe */}
            <div className="absolute bottom-[-60px] left-[-140px] z-30 flex h-20 w-14 items-center justify-center">
              <Globe2
                size={50}
                strokeWidth={1.5}
                className="text-[#3F6B12] drop-shadow-[0_3px_3px_rgba(38,23,13,0.18)]"
              />
            </div>
          </div>
        </div>
      </section>

      <Features />
    </>
  );
}