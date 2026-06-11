import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in · Foxly Admin",
};

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen lg:grid-cols-2">
      {/* Left: brand / marketing panel */}
      <section className="relative hidden overflow-hidden bg-sidebar lg:block">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, oklch(0.62 0.20 42 / 0.5), transparent 45%), radial-gradient(circle at 80% 70%, oklch(0.54 0.18 40 / 0.4), transparent 50%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-sidebar-foreground">
          <div className="flex items-center gap-3">
            <FoxlyMark />
            <span className="text-lg font-semibold tracking-tight">Foxly</span>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">
              Internal control panel for the Foxly Shopify app.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-sidebar-muted">
              Monitor installs, active shops and merchant activity, and manage
              every record powering the app from one secure place.
            </p>
          </div>

          <div className="flex items-center gap-6 text-sm text-sidebar-muted">
            <span>© {new Date().getFullYear()} Foxly</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              All systems operational
            </span>
          </div>
        </div>
      </section>

      {/* Right: login form */}
      <section className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <FoxlyMark />
            <span className="text-lg font-semibold tracking-tight">Foxly</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in with your internal staff account to continue.
            </p>
          </div>

          <LoginForm />

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Protected area. Authorized personnel only.
          </p>
        </div>
      </section>
    </main>
  );
}

function FoxlyMark() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path
          d="M4 3l3 4 5-2 5 2 3-4-2 9c0 4-3.5 7-6 7s-6-3-6-7L4 3z"
          fill="currentColor"
        />
        <circle cx="9.5" cy="12" r="1" fill="oklch(0.62 0.20 42)" />
        <circle cx="14.5" cy="12" r="1" fill="oklch(0.62 0.20 42)" />
      </svg>
    </span>
  );
}
