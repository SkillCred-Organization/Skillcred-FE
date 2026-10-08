import Logo from "./Logo";

export default function Navbar() {
  return (
    <header className="bg-[#FFF8F3]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-10">
          <Logo />
          <ul className="hidden items-center gap-6 text-sm text-[#2B1A10] md:flex">
            <li><a href="#learners" className="hover:text-[#3F6B12]">For learners</a></li>
            <li><a href="#institutions" className="hover:text-[#3F6B12]">For institutions</a></li>
            <li><a href="#about" className="hover:text-[#3F6B12]">About us</a></li>
          </ul>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <a href="/login" className="text-[#2B1A10] underline-offset-4 hover:underline">Log in</a>
          <a
            href="/signup"
            className="rounded-full bg-[#542C18] px-5 py-2 font-medium text-white transition hover:bg-[#432313]">
            Get started
          </a>
        </div>
      </nav>
    </header>
  );
}