interface LogoProps {
  className?: string;
}
 export default function Logo({ className = "" }: LogoProps) {
  return (
    <a href="/" className={className}>
      <img src="/logo.svg" alt="SkillCred" className="h-7 w-auto" />
    </a>
  );
}