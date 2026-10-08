const logos: string[] = [
  "/institution-logos/AltSchool.svg",
  "/institution-logos/AppClick.svg",
  "/institution-logos/ApTech.svg",
  "/institution-logos/HNG.svg",
  "/institution-logos/SQICollege.svg",
  "/institution-logos/TSacademy.svg",
];

export default function TrustedLogos() {
  return (
    <section className="bg-[#FFF8F3] pb-14">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <p className="text-[10px] font-medium uppercase tracking-widest text-[#5A4A40]">
          Trusted by institutions across Nigeria
        </p>

        {/* NEW: Faded edges around the slideshow */}
        <div className="relative mt-6 overflow-hidden">
          {/* NEW: Left fade */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-[#FFF8F3] to-transparent" />

          {/* NEW: Sliding logos */}
          <div className="flex w-max animate-[logo-scroll_25s_linear_infinite] items-center gap-12">
            {[...logos, ...logos].map((logo, index) => (
              <div
                key={`${logo}-${index}`}
                className="flex h-16 w-36 shrink-0 items-center justify-center"
              >
                <img
                  src={logo}
                  alt="Institution logo"
                  className="max-h-12 max-w-32 object-contain"
                />
              </div>
            ))}
          </div>

          {/* NEW: Right fade */}
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-[#FFF8F3] to-transparent" />
        </div>
      </div>
    </section>
  );
}