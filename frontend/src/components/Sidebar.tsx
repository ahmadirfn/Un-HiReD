"use client";

/* eslint-disable react-hooks/set-state-in-effect -- defer theme icon rendering until next-themes has mounted. */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Home, LogOut, Menu, Moon, PanelLeftClose, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { useLanguage } from "../store/languageStore";

export type WorkspaceSection = "profile" | "cv" | "matches" | "pathway" | "impact" | "job-match";

interface SidebarProps {
  activeSection: WorkspaceSection;
  hasUploadedCV: boolean;
  userName: string;
  onNavigate: (section: WorkspaceSection) => void;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const PROFILE_ITEMS: { id: WorkspaceSection; label: string }[] = [
  { id: "profile", label: "Discover yourself" },
];

const EXPLORE_ITEMS: { id: WorkspaceSection; label: string }[] = [
  { id: "matches", label: "Career matches" },
  { id: "job-match", label: "Job Matcher" },
  { id: "pathway", label: "Learning pathway" },
  { id: "impact", label: "SDG impact" },
];

export default function Sidebar({
  activeSection,
  hasUploadedCV,
  userName,
  onNavigate,
  onLogout,
  isOpen,
  onToggle,
}: SidebarProps) {
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { resolvedTheme, setTheme, theme } = useTheme();

  useEffect(() => setMounted(true), []);

  const profileItems = hasUploadedCV
    ? [...PROFILE_ITEMS, { id: "cv" as const, label: "Your CV" }]
    : PROFILE_ITEMS;

  return (
    <>
      <aside
        aria-hidden={!isOpen}
        inert={!isOpen}
        style={{
          pointerEvents: isOpen ? "auto" : "none",
          width: isOpen ? 260 : 0,
          minWidth: isOpen ? 260 : 0,
          opacity: isOpen ? 1 : 0,
          transition: "width 280ms ease, min-width 280ms ease, opacity 180ms ease",
        }}
        className={`sticky top-0 z-40 hidden h-screen shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r bg-[#f2f4f7] dark:bg-[#161b22] md:flex ${isOpen ? "border-slate-300/80 dark:border-slate-800" : "border-transparent"}`}
      >
        <div className="flex h-full w-64 flex-col px-4 py-6">
        <div className="flex items-center justify-between gap-2">
          <Brand onClick={() => onNavigate("matches")} />
          <button type="button" onClick={onToggle} aria-label="Collapse sidebar" title="Collapse sidebar" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white">
            <PanelLeftClose aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-10 flex-1 space-y-8" aria-label="Workspace navigation">
          <NavigationGroup title="MY PROFILE" items={profileItems} activeSection={activeSection} onNavigate={onNavigate} />
          <NavigationGroup title="EXPLORE" items={EXPLORE_ITEMS} activeSection={activeSection} onNavigate={onNavigate} />
        </nav>

        <SidebarFooter
          userName={userName}
          onNavigate={onNavigate}
          onLogout={onLogout}
          mounted={mounted}
          resolvedTheme={resolvedTheme}
          theme={theme}
          setTheme={setTheme}
        />
        </div>
      </aside>

      <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-[#161b22]/95 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Brand onClick={() => onNavigate("matches")} compact />
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open workspace navigation" aria-expanded={mobileOpen} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-[#0f1117] dark:text-slate-200">
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && <motion.div className="fixed inset-0 z-[90] md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <button type="button" aria-label="Close navigation drawer" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" />
          <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ duration: 0.22, ease: "easeOut" }} className="absolute inset-y-0 left-0 flex w-[min(20rem,86vw)] flex-col overflow-y-auto border-r border-slate-200 bg-slate-50 px-4 py-5 shadow-2xl dark:border-slate-800 dark:bg-[#161b22]">
            <div className="flex items-center justify-between gap-3"><Brand onClick={() => { setMobileOpen(false); onNavigate("matches"); }} /><button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation drawer" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"><X aria-hidden="true" className="h-4 w-4" /></button></div>
            <nav className="mt-8 flex-1 space-y-8" aria-label="Workspace navigation"><NavigationGroup title="MY PROFILE" items={profileItems} activeSection={activeSection} onNavigate={(section) => { setMobileOpen(false); onNavigate(section); }} /><NavigationGroup title="EXPLORE" items={EXPLORE_ITEMS} activeSection={activeSection} onNavigate={(section) => { setMobileOpen(false); onNavigate(section); }} /></nav>
            <SidebarFooter userName={userName} onNavigate={(section) => { setMobileOpen(false); onNavigate(section); }} onLogout={() => { setMobileOpen(false); onLogout(); }} mounted={mounted} resolvedTheme={resolvedTheme} theme={theme} setTheme={setTheme} />
          </motion.aside>
        </motion.div>}
      </AnimatePresence>
    </>
  );
}

function SidebarFooter({
  userName,
  onNavigate,
  onLogout,
  mounted,
  resolvedTheme,
  theme,
  setTheme,
  compact = false,
}: {
  userName: string;
  onNavigate: (section: WorkspaceSection) => void;
  onLogout: () => void;
  mounted: boolean;
  resolvedTheme?: string;
  theme?: string;
  setTheme: (theme: string) => void;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className={`${compact ? "mt-2 border-t border-slate-200/80 pt-2 dark:border-slate-800" : "border-t border-slate-200/80 pt-4 dark:border-slate-800"}`}>
      <div className="grid grid-cols-1 gap-2">
        <button type="button" onClick={() => onNavigate("profile")} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 dark:border-slate-800 dark:bg-[#161b22] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">
          <Home aria-hidden="true" className="h-3.5 w-3.5" />
          {t("Main page")}
        </button>
      </div>
      <div className="mt-3 flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white p-2 dark:border-slate-800 dark:bg-[#0f1117]">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={userName} />
          <div className="min-w-0">
            <p title={userName || t("Your profile")} className={`truncate font-medium text-slate-900 dark:text-white ${compact ? "text-xs" : "text-sm"}`}>{userName || t("Your profile")}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle mounted={mounted} resolvedTheme={resolvedTheme} theme={theme} setTheme={setTheme} />
          <button type="button" onClick={onLogout} aria-label="Log out and return to onboarding" title="Logout" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-red-950/40 dark:hover:text-red-400"><LogOut aria-hidden="true" className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

interface NavigationGroupProps {
  title: string;
  items: { id: WorkspaceSection; label: string }[];
  activeSection: WorkspaceSection;
  onNavigate: (section: WorkspaceSection) => void;
}

function NavigationGroup({ title, items, activeSection, onNavigate }: NavigationGroupProps) {
  const { t } = useLanguage();
  return (
    <section>
      <h2 className="mb-3 px-3 text-[10px] font-semibold tracking-[0.2em] text-slate-600 dark:text-gray-400">{t(title)}</h2>
      <div className="space-y-1">
        {items.map((item) => <NavButton key={item.id} item={item} active={activeSection === item.id} onNavigate={onNavigate} />)}
      </div>
    </section>
  );
}

interface NavButtonProps {
  item: { id: WorkspaceSection; label: string };
  active: boolean;
  onNavigate: (section: WorkspaceSection) => void;
  compact?: boolean;
}

function NavButton({ item, active, onNavigate, compact = false }: NavButtonProps) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      onClick={() => onNavigate(item.id)}
      className={`${compact ? "shrink-0 px-3" : "w-full px-3"} rounded-lg py-2.5 text-left text-sm transition ${active ? "bg-rose-500/10 text-rose-800 dark:text-rose-200" : "text-slate-700 hover:bg-slate-200/70 hover:text-slate-950 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white"}`}
    >
      {t(item.label)}
    </button>
  );
}

interface BrandProps {
  onClick: () => void;
  compact?: boolean;
}

function Brand({ onClick, compact = false }: BrandProps) {
  const [logoAvailable, setLogoAvailable] = useState(true);

  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-3 self-start rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-rose-400">
      {logoAvailable ? (
        <Image
          src="/logo.png"
          width={28}
          height={28}
          className="h-7 w-7 rounded-md border border-slate-200 object-contain dark:border-slate-700"
          alt="Un-HiReD"
          onError={() => setLogoAvailable(false)}
        />
      ) : (
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/10 text-rose-500 dark:text-rose-300">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <rect x="3.5" y="4" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M9 4v16M12.5 8h4.5M12.5 12h4.5M12.5 16h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      )}
      <span className={`font-semibold tracking-tight text-gray-900 dark:text-white ${compact ? "text-base" : "text-lg"}`}>Un-HiReD</span>
    </button>
  );
}

function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "U";
  return <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-800 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200">{initial}</span>;
}

function ThemeToggle({
  mounted,
  resolvedTheme,
  theme,
  setTheme,
}: {
  mounted: boolean;
  resolvedTheme?: string;
  theme?: string;
  setTheme: (theme: string) => void;
}) {
  const { t } = useLanguage();
  const isDark = mounted && (resolvedTheme === "dark" || (!resolvedTheme && theme === "dark"));
  const Icon = isDark ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      disabled={!mounted}
      aria-label={t(`Switch to ${isDark ? "light" : "dark"} mode`)}
      title={t(`Switch to ${isDark ? "light" : "dark"} mode`)}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}
