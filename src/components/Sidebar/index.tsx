import { Fragment } from "react";
import { Logo } from "@/components/Logo";
import { Divider } from "@/components/ui/Divider";

const SECTIONS = 6;
const ITEMS_PER_SECTION = 4;

export default function Sidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col">
      <div className="flex h-16 shrink-0 items-center px-6">
        <Logo className="size-8" />
        <span className="ml-3 text-xl text-on-surface font-black">Ticketer</span>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto">
        {Array.from({ length: SECTIONS }, (_, s) => (
          <Fragment key={s}>
            {s > 0 && <Divider inset="middle" className="my-2" />}
            <div className="flex flex-col gap-2 p-3">
              {Array.from({ length: ITEMS_PER_SECTION }, (_, i) => (
                <div key={i} className="h-12 rounded-lg bg-current/10" />
              ))}
            </div>
          </Fragment>
        ))}
      </nav>
    </aside>
  );
}
