export default function Footer() {
  return (
    <footer className="bg-[#5A2E16] text-white">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 px-6 py-10 md:flex-row md:items-center">
        <div>
          <p className="text-lg font-bold">SkillCred</p>
          <p className="mt-1 text-[11px] text-white/70">
            Your skills. Verified. Greater opportunities.
          </p>
        </div>
        <div className="flex items-center gap-6 text-[11px] text-white/80">
          <a href="/privacy" className="underline-offset-4 hover:underline">Privacy</a>
          <a href="/terms" className="underline-offset-4 hover:underline">Terms</a>
          <span>© {new Date().getFullYear()} SkillCred</span>
        </div>
      </div>
    </footer>
  );
}
