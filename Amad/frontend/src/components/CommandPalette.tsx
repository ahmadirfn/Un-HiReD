"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { ArrowRight, FileText, MessageSquareText, Search, Sparkles } from "lucide-react";
import MagneticButton from "./MagneticButton";

export type DashboardCommand = "optimize-resume" | "mock-interview" | "analyze-skill-gaps";

interface CommandPaletteProps {
  onCommand: (command: DashboardCommand) => void;
}

const COMMANDS: { id: DashboardCommand; label: string; description: string; icon: typeof FileText }[] = [
  { id: "optimize-resume", label: "/optimize-resume", description: "Open your CV and resume profile", icon: FileText },
  { id: "mock-interview", label: "/mock-interview", description: "Open interview practice command", icon: MessageSquareText },
  { id: "analyze-skill-gaps", label: "/analyze-skill-gaps", description: "Review your learning pathway and skill gaps", icon: Sparkles },
];

export default function CommandPalette({ onCommand }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const normalizedSearch = search
    .trim()
    .toLowerCase()
    .replace(/^\//, "")
    .replace(/[-_]+/g, " ");
  const searchTerms = normalizedSearch.split(/\s+/).filter(Boolean);
  const filteredCommands = COMMANDS.filter((command) => {
    const searchSpace = `${command.id} ${command.label} ${command.description} ${command.id.replace(/-/g, " ")}`
      .toLowerCase()
      .replace(/[/-]+/g, " ");
    return searchTerms.every((term) => searchSpace.includes(term));
  });

  useEffect(() => {
    if (!isOpen) setSearch("");
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((open) => !open);
      } else if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    function openPalette() {
      setIsOpen(true);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("unhired:open-command-palette", openPalette);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("unhired:open-command-palette", openPalette);
    };
  }, []);

  function selectCommand(command: DashboardCommand) {
    setIsOpen(false);
    setSearch("");
    onCommand(command);
  }

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setSearch("");
      }}
      label="Un-HiReD command palette"
      overlayClassName="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md"
      contentClassName="fixed left-1/2 top-[14vh] z-[101] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-rose-300/20 bg-white text-slate-900 shadow-2xl shadow-black/50 ring-1 ring-white/10 outline-none dark:border-rose-300/20 dark:bg-[#11141b] dark:text-white"
    >
      <Command className="overflow-hidden rounded-2xl" loop shouldFilter={false}>
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-white/10">
          <Search className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-300" aria-hidden="true" />
          <Command.Input
            autoFocus
            placeholder="Search a command..."
            value={search}
            onValueChange={setSearch}
            className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-slate-500 dark:placeholder:text-slate-500"
          />
          <kbd className="hidden shrink-0 rounded-md border border-slate-200 px-2 py-1 text-[10px] text-slate-500 dark:border-white/10 dark:text-slate-400 sm:inline">ESC</kbd>
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <Command.Empty className="px-3 py-8 text-center text-sm text-slate-500">No matching commands.</Command.Empty>
          ) : (
          <Command.Group heading="Career actions" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:text-slate-500">
            {filteredCommands.map(({ id, label, description, icon: Icon }) => (
              <MagneticButton key={id} className="w-full" strength={0.025}>
              <Command.Item
                value={`${label} ${description}`}
                onSelect={() => selectCommand(id)}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-700 outline-none transition aria-selected:bg-rose-50 aria-selected:text-rose-950 dark:text-slate-200 dark:aria-selected:bg-rose-400/10 dark:aria-selected:text-rose-100"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-rose-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-rose-300"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="block font-medium">{label}</span><span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{description}</span></span>
                <ArrowRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </Command.Item>
              </MagneticButton>
            ))}
          </Command.Group>
          )}
        </Command.List>
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-[10px] text-slate-500 dark:border-white/10 dark:text-slate-500"><span>Navigate with ↑ ↓ and select with ↵</span><span>UN-HIRED CO-PILOT</span></div>
      </Command>
    </Command.Dialog>
  );
}
