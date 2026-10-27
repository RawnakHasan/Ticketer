import { Outlet } from "react-router";
import Sidebar from "@/components/Sidebar";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default function AppLayout() {
  return (
    <div className="flex h-dvh overflow-hidden bg-surface-container">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center px-4 justify-between">
          <span></span>
          <ThemeSwitcher />
        </header>

        <main className="min-h-0 flex-1 overflow-hidden rounded-tl-3xl bg-surface">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
