import { USE_CUSTOM_WINDOW_CONTROLS } from "@/lib/platform";
import {
  Cancel01Icon,
  Minimize01Icon,
  SquareArrowExpand01Icon,
  SquareArrowShrink01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

export function WindowControls() {
  if (!USE_CUSTOM_WINDOW_CONTROLS) return null;

  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    const win = getCurrentWindow();
    let alive = true;
    void win.isMaximized().then((v) => {
      if (alive) setMaximized(v);
    });

    const unlisten = win.onResized(() => {
      void win.isMaximized().then((v) => {
        if (alive) setMaximized(v);
      });
    });

    return () => {
      alive = false;
      void unlisten.then((fn) => fn());
    };
  }, []);

  return (
    <div className="flex h-full shrink-0 items-center">
      <button
        type="button"
        aria-label="Minimize"
        onClick={() => void getCurrentWindow().minimize()}
        className="grid h-full w-10 place-items-center text-muted-foreground hover:bg-card/60 hover:text-white"
      >
        <HugeiconsIcon icon={Minimize01Icon} size={14} strokeWidth={2} />
      </button>
      <button
        type="button"
        aria-label={maximized ? "Restore" : "Maximize"}
        onClick={() => void getCurrentWindow().toggleMaximize()}
        className="grid h-full w-10 place-items-center text-muted-foreground hover:bg-card/60 hover:text-white"
      >
        <HugeiconsIcon
          icon={maximized ? SquareArrowShrink01Icon : SquareArrowExpand01Icon}
          size={14}
          strokeWidth={2}
        />
      </button>
      <button
        type="button"
        aria-label="Close"
        onClick={() => void getCurrentWindow().close()}
        className="grid h-full w-10 place-items-center text-muted-foreground hover:bg-red-500/80 hover:text-white"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
