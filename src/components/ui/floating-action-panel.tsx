import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type FloatingPanelMode = "actions" | "note";

export interface ActionItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
}

export interface FloatingActionPanelProps {
  trigger: React.ReactNode;
  actions?: ActionItem[];
  noteContent?: React.ReactNode;
  mode?: FloatingPanelMode;
  align?: "start" | "end" | "center";
  side?: "top" | "bottom";
  className?: string;
  panelClassName?: string;
  onNoteSubmit?: (value: string) => void | Promise<void>;
}

export function FloatingActionPanel({
  trigger,
  actions = [],
  noteContent,
  mode = "actions",
  align = "end",
  side = "bottom",
  className,
  panelClassName,
  onNoteSubmit,
}: FloatingActionPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [noteValue, setNoteValue] = React.useState("");
  const panelRef = React.useRef<HTMLDivElement>(null);

  const handleClose = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, handleClose]);

  const alignClasses: Record<string, string> = {
    start: "left-0",
    end: "right-0",
    center: "left-1/2 -translate-x-1/2",
  };

  const sideClasses: Record<string, string> = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
  };

  return (
    <div className={cn("relative inline-flex", className)} ref={panelRef}>
      <div
        className="cursor-pointer"
        onClick={() => setOpen((o) => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen((o) => !o)}
      >
        {trigger}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: side === "bottom" ? -8 : 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: side === "bottom" ? -8 : 8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-50 min-w-[200px] rounded-xl border border-border/80 bg-popover/95 backdrop-blur-xl shadow-xl",
              alignClasses[align],
              sideClasses[side],
              panelClassName
            )}
          >
            {mode === "actions" && actions.length > 0 && (
              <div className="p-2 space-y-1">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => {
                      action.onClick();
                      handleClose();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      action.variant === "destructive"
                        ? "text-destructive hover:bg-destructive/10"
                        : "text-foreground hover:bg-accent/50 hover:text-accent-foreground"
                    )}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {mode === "note" && (
              <div className="p-4 space-y-3">
                {noteContent}
                {onNoteSubmit && (
                  <>
                    <textarea
                      value={noteValue}
                      onChange={(e) => setNoteValue(e.target.value)}
                      placeholder="Add a note..."
                      className="w-full min-h-[80px] rounded-lg border border-input bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        await onNoteSubmit(noteValue);
                        setNoteValue("");
                        handleClose();
                      }}
                      className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Save Note
                    </button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
