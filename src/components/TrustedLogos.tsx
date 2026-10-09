const logos = [
  { name: "AltSchool", src: "/institution-logos/AltSchool.svg" },
  { name: "AppClick ICT Academy", src: "/institution-logos/AppClick.svg" },
  { name: "Aptech Learning", src: "/institution-logos/ApTech.svg" },
  { name: "SQI College", src: "/institution-logos/SQICollege.svg" },
  { name: "HNG", src: "/institution-logos/HNG.svg" },
  { name: "TS Academy", src: "/institution-logos/TSacademy.svg" },
];

export default function TrustedLogos() {
  return (
    <section className="trusted-section" aria-labelledby="trusted-title">
      <div className="landing-container">
        <h2 id="trusted-title" className="landing-eyebrow trusted-title">
          Trusted by institutions across Nigeria
        </h2>
        <div
          id="institution-logo-slideshow"
          className="trusted-viewport"
          tabIndex={0}
          role="group"
          aria-label="Partner institutions"
        >
          <div className="trusted-track">
            {[false, true].map((duplicate) => (
              <ul className="trusted-group" key={String(duplicate)} aria-hidden={duplicate || undefined}>
                {logos.map(({ name, src }) => (
                  <li key={name}><img src={src} alt={duplicate ? "" : name} /></li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
