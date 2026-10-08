export default function InstitutionBanner() {
  return (
    <section id="institutions" className="bg-[#FFF8F3] pb-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-2xl bg-[#6B3A1F] px-8 py-10 text-white">
        
          <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute bottom-[-30px] right-40 h-24 w-24 rounded-full bg-white/10" />

          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
                For institutions
              </p>
              <h2 className="mt-2 text-2xl font-bold md:text-3xl">
                Confirm what your learners <br className="hidden md:block" />
                really did.
              </h2>
              <p className="mt-3 max-w-sm text-xs leading-relaxed text-white/80">
                Review claims from your programmes in one queue. Verify in a
                click, or ask for changes with a reason.
              </p>
            </div>

            <a
              href="/institutions/register"
              className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-[#2B1A10] transition hover:bg-[#FCE3D3]"
            >
              Register your institution
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}