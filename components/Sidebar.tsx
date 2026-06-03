"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Clapperboard,
  Image as ImageIcon,
  LayoutDashboard,
  Lightbulb,
  Settings,
  Sparkles,
  Users
} from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Comptes", icon: Users },
  { href: "/ideas", label: "Idées/Inspi", icon: Lightbulb },
  { href: "/production", label: "Production", icon: Clapperboard },
  { href: "/calendar", label: "Calendrier", icon: CalendarDays },
  { href: "/assets", label: "Assets", icon: ImageIcon },
  { href: "/performances", label: "Performances", icon: BarChart3 },
  { href: "/settings", label: "Réglages", icon: Settings }
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-white/70 bg-white/75 p-5 backdrop-blur-xl lg:block">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-lg">
            <Sparkles size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black">Content OS</h1>
            <p className="text-xs text-zinc-500">Pilotage éditorial</p>
          </div>
        </div>

        <nav className="space-y-2">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                isActive(pathname, href)
                  ? "bg-zinc-950 text-white shadow-lg"
                  : "text-zinc-600 hover:bg-white hover:text-zinc-950"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <nav className="fixed bottom-4 left-4 right-4 z-20 overflow-x-auto rounded-3xl bg-zinc-950 p-2 shadow-2xl lg:hidden">
        <div className="flex min-w-max gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex min-w-[76px] flex-col items-center justify-center rounded-2xl px-3 py-2 ${
                isActive(pathname, href) ? "bg-white text-zinc-950" : "text-white/60"
              }`}
            >
              <Icon size={18} />
              <span className="mt-1 text-[10px] font-bold">{label.split("/")[0]}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
