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
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f7f4ff] text-zinc-950">
      <Sidebar />
      <main className="w-full min-w-0 max-w-full overflow-x-hidden pb-32 lg:ml-72 lg:pb-0">
        <div className="w-full max-w-full p-3 sm:p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
