const logos: string[] = ["AltSchool", "AppClick", "Aptech", "Institute", "HNG", "Academy"];

export default function TrustedLogos() {
  return (
    <section className="bg-[#FFF8F3] pb-14">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <p className="text-[10px] font-medium uppercase tracking-widest text-[#5A4A40]">
          Trusted by institutions across Nigeria
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {logos.map((name) => (
            // Swap these text placeholders for <img src="/logos/xxx.png" alt={name} /> later
            <li key={name} className="text-lg font-bold text-[#2B1A10]/60">
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}