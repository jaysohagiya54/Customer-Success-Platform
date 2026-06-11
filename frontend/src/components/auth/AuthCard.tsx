import { ReactNode } from "react";

export interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div
      className="flex min-h-screen w-full items-center justify-center p-6 lg:p-10"
      style={{
        background:
          "linear-gradient(135deg, #3d2510 0%, #2c1a0e 35%, #c8a882 70%, #e8ddd0 100%)",
      }}
    >
      {/* Ambient glow blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 15% 25%, rgba(217,119,87,0.25) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(232,221,208,0.30) 0%, transparent 45%)",
        }}
      />

      {/* Two-panel container */}
      <div className="relative z-10 flex w-full max-w-[900px] min-h-[560px] rounded-3xl overflow-hidden shadow-2xl">

        {/* ── Left: info panel ── */}
        <div
          className="hidden lg:flex lg:w-[48%] flex-col justify-between p-10 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderRight: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          {/* Inner glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 0% 0%, rgba(217,119,87,0.18) 0%, transparent 60%)",
            }}
          />

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white text-xs font-bold"
              style={{ backgroundColor: "var(--accent)" }}
            >
              CS
            </div>
            <span className="text-white/80 font-semibold text-sm tracking-tight">CS Platform</span>
          </div>

          {/* Quote + bullets */}
          <div className="relative z-10 space-y-8">
            <blockquote>
              <p className="text-white/90 text-[1.45rem] font-semibold leading-snug tracking-tight">
                &ldquo;Turn every customer interaction into&nbsp;a growth opportunity.&rdquo;
              </p>
            </blockquote>

            <ul className="flex flex-col gap-3">
              {[
                "AI-powered interaction insights",
                "Real-time sentiment tracking",
                "Unified customer success view",
              ].map((text) => (
                <li key={text} className="flex items-center gap-2.5">
                  <svg
                    className="shrink-0"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: "var(--accent)" }}
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-white/65 text-sm">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <p className="relative z-10 text-white/25 text-xs">
            © {new Date().getFullYear()} CS Platform
          </p>
        </div>

        {/* ── Right: form panel (glass) ── */}
        <div
          className="flex flex-1 flex-col justify-center px-8 py-10 sm:px-10"
          style={{
            background: "rgba(250,246,240,0.92)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold"
              style={{ backgroundColor: "var(--accent)" }}
            >
              CS
            </div>
            <span className="text-sm font-semibold" style={{ color: "#333" }}>CS Platform</span>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-[1.7rem] font-semibold tracking-tight" style={{ color: "#1a1a1a" }}>
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-sm" style={{ color: "#888" }}>{subtitle}</p>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
