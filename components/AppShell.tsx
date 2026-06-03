"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <div className="min-h-screen bg-[#f7f4ff] text-zinc-950">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f4ff] text-zinc-950">
      <Sidebar />
      <main className="min-w-0 pb-40 lg:ml-72 lg:pb-0">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
