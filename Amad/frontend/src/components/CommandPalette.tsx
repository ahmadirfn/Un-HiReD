"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { ArrowRight, BriefcaseBusiness, FileText, GraduationCap, MessageSquareText, Search, Sparkles, Target, UserRound } from "lucide-react";
import MagneticButton from "./MagneticButton";
import { useLanguage } from "../store/languageStore";

export type DashboardCommand = "optimize-resume" | "mock-interview" | "analyze-skill-gaps";
type NavigationCommand = "discover" | "your-cv" | "career-matches" | "job-match" | "learning-pathway" | "sdg-impact";
type PaletteCommand = DashboardCommand | NavigationCommand;

interface CommandPaletteProps {
  onCommand: (command: DashboardCommand) => void;
}

const COMMANDS: { id: PaletteCommand; label: string; description: string; icon: typeof FileText; href?: string }[] = [
  { id: "discover", label: "Discover yourself", description: "Review your profile", icon: UserRound, href: "/?section=profile" },
  { id: "your-cv", label: "Your CV", description: "View your resume and skills", icon: FileText, href: "/?section=cv" },
  { id: "career-matches", label: "Career matches", description: "Browse recommended roles", icon: BriefcaseBusiness, href: "/?section=matches" },
  { id: "job-match", label: "Job matcher", description: "Compare your skills with a job", icon: Target, href: "/dashboard/job-match" },
  { id: "learning-pathway", label: "Learning pathway", description: "Open your learning plan", icon: GraduationCap, href: "/?section=pathway" },
  { id: "sdg-impact", label: "SDG impact", description: "See how your career can help", icon: Sparkles, href: "/?section=impact" },
  { id: "optimize-resume", label: "Optimize resume", description: "Tailor your CV for a job", icon: FileText },
  { id: "mock-interview", label: "Mock interview", description: "Practice for an interview", icon: MessageSquareText },
  { id: "analyze-skill-gaps", label: "Analyze skill gaps", description: "Review skills to learn next", icon: Sparkles },
];

export default function CommandPalette({ onCommand }: CommandPaletteProps) {
  const router = useRouter();
  const { t } = useLanguage();
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
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (isOpen) setSearch("");
        setIsOpen(!isOpen);
      } else if (event.key === "Escape") {
        setSearch("");
        setIsOpen(false);
      }
    }

    function openPalette() {
      setSearch("");
      setIsOpen(true);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("unhired:open-command-palette", openPalette);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("unhired:open-command-palette", openPalette);
    };
  }, [isOpen]);

  function selectCommand(command: PaletteCommand) {
    setIsOpen(false);
    setSearch("");
    const routeCommand = COMMANDS.find((item) => item.id === command);
    if (routeCommand?.href) router.push(routeCommand.href);
    else onCommand(command as DashboardCommand);
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
          placeholder={t("Search pages or actions...")}
            value={search}
            onValueChange={setSearch}
            className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-slate-500 dark:placeholder:text-slate-500"
          />
          <kbd className="hidden shrink-0 rounded-md border border-slate-200 px-2 py-1 text-[10px] text-slate-500 dark:border-white/10 dark:text-slate-400 sm:inline">ESC</kbd>
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <Command.Empty className="px-3 py-8 text-center text-sm text-slate-600 dark:text-slate-400">{t("No matching commands.")}</Command.Empty>
          ) : (
          <Command.Group heading={t("Navigate and take action")} className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:text-slate-600 dark:[&_[cmdk-group-heading]]:text-slate-400">
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
