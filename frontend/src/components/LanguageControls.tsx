"use client";

import { Globe2 } from "lucide-react";
import { useLanguage, type Language } from "../store/languageStore";

export default function LanguageControls() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-slate-100 px-2.5 text-slate-700 dark:border-slate-800 dark:bg-[#161b22] dark:text-slate-300">
        <Globe2 aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">Choose language</span>
        <select aria-label="Choose language" value={language} onChange={(event) => setLanguage(event.target.value as Language)} className="max-w-24 cursor-pointer bg-transparent text-xs font-semibold text-slate-900 outline-none dark:text-slate-100">
          <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100" value="en">EN</option>
          <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100" value="bm">BM</option>
          <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100" value="zh">{"\u4e2d\u6587"}</option>
        </select>
      </label>
    </div>
  );
}
