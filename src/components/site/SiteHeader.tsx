"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

type HeaderVariant = "dark" | "light";

type NavItem = {
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Kart", href: "/kart" },
  { label: "Send inn", href: "/observasjoner" },
  { label: "Profil", href: "/profil" },
  { label: "Om prosjektet", href: "/om" },
  { label: "Galleri", href: "/galleri" },
  { label: "Admin", href: "/admin" },
];

export default function SiteHeader({ variant = "dark" }: { variant?: HeaderVariant }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [initial, setInitial] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      const email = data.user?.email ?? "";
      const fallback = email ? email[0]?.toUpperCase() ?? null : null;
      const metaInitial = data.user?.user_metadata?.username?.[0]?.toUpperCase();
      setInitial(metaInitial || fallback || null);
    }

    loadUser();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const classes = useMemo(() => {
    if (variant === "light") {
      return {
        wrapper: "border-b border-slate-200 bg-white text-slate-900",
        link: "text-slate-600 hover:text-slate-900",
        button:
          "border-slate-200 text-slate-700 hover:bg-slate-100",
        menu:
          "border-slate-200 bg-white text-slate-700",
        menuItem: "hover:bg-slate-100",
        avatar: "border-slate-200 bg-slate-100 text-slate-700",
      };
    }

    return {
      wrapper: "border-b border-white/10 bg-[#070b2f]/95 text-white",
      link: "text-white/80 hover:text-white",
      button:
        "border-white/30 text-white hover:bg-white/10",
      menu:
        "border-white/15 bg-[#0b1438] text-white/90",
      menuItem: "hover:bg-white/10",
      avatar: "border-white/30 bg-white/10 text-white",
    };
  }, [variant]);

  return (
    <header className={`sticky top-0 z-30 backdrop-blur ${classes.wrapper}`}>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <a
          href="/"
          className="text-sm font-semibold uppercase tracking-[0.2em]"
        >
          Kystobservatørene
        </a>
        <nav className="relative flex items-center gap-2 text-sm md:gap-4">
          <a className={`hidden md:block transition ${classes.link}`} href="/kart">
            Kart
          </a>
          <a className={`hidden md:block transition ${classes.link}`} href="/om">
            Om prosjektet
          </a>
          <a
            href="/observasjoner"
            className="rounded-full bg-[#60a5fa] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#070b2f] transition hover:bg-[#93c5fd] md:px-5 md:text-sm"
          >
            Send inn
          </a>
          <div className="relative">
            <button
              type="button"
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase transition md:px-4 md:tracking-[0.2em] ${classes.button}`}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="hidden md:inline">Navigering</span>
              <span className="text-base leading-none md:hidden">☰</span>
              <span className="hidden text-sm md:inline">▾</span>
            </button>
            {menuOpen && (
              <div
                className={`absolute right-0 mt-3 w-48 rounded-2xl border p-2 shadow-xl ${classes.menu}`}
              >
                {NAV_ITEMS.map((item) => (
                  <a
                    key={item.label}
                    className={`block rounded-xl px-3 py-2 text-sm transition ${classes.menuItem}`}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          {initial ? (
            <a
              href="/profil"
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${classes.avatar}`}
              aria-label="Profil"
            >
              {initial}
            </a>
          ) : (
            <a
              className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase transition md:px-4 md:tracking-[0.2em] ${classes.button}`}
              href={`/login?redirect=${encodeURIComponent(pathname)}`}
            >
              Logg inn
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
