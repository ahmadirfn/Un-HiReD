"use client";

/* eslint-disable react-hooks/set-state-in-effect -- restore saved language after browser storage becomes available. */

import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "bm" | "zh";

const DICTIONARIES: Record<Language, Record<string, string>> = {
  en: {},
  bm: {
    "MY PROFILE": "PROFIL SAYA", EXPLORE: "TEROKAI", "Discover yourself": "Kenali Diri Anda", "Your CV": "CV Anda", "Career matches": "Padanan Kerjaya", "Job Matcher": "Padanan Pekerjaan", "Learning pathway": "Laluan Pembelajaran", "SDG impact": "Impak SDG", "Main page": "Halaman utama", "How it works": "Cara ia berfungsi", "Your profile": "Profil anda", "Switch to light mode": "Tukar ke mod cerah", "Switch to dark mode": "Tukar ke mod gelap", Goal: "Matlamat", Commands: "Carian", "Career workspace": "Ruang kerja kerjaya", "Resume co-pilot": "Pembantu resume", "Job Match & CV Tailoring": "Padanan Kerja & CV", "Compare your profile to a target role, then create a fact-grounded draft for that same job.": "Bandingkan profil anda dengan jawatan sasaran dan dapatkan cadangan CV berdasarkan pengalaman sebenar.", "Future-ready roles ranked against your profile.": "Senarai kerjaya masa depan berdasarkan profil anda.", "Your goals and experience shape your career recommendations.": "Matlamat dan pengalaman anda membantu kami memberi cadangan kerjaya.", "Review the skills extracted from your uploaded resume.": "Semak kemahiran yang dikenal pasti dalam resume anda.", "Focus areas to help close the gap to your selected role.": "Kemahiran yang boleh dipelajari untuk mencapai jawatan pilihan anda.", "How your potential career direction aligns with global goals.": "Cara kerjaya pilihan anda menyokong matlamat dunia.", "Job Match Analyzer": "Semak Padanan Kerja", "Compare your profile skills with a specific job description.": "Bandingkan kemahiran anda dengan huraian kerja.",
    "Explore your options": "Pilihan kerjaya anda", "Ranked future roles": "Senarai kerjaya masa depan", "Scores reflect how closely each path fits your current profile.": "Skor menunjukkan kesesuaian kerjaya dengan profil anda.", match: "padanan", "Why this match": "Sebab padanan", "Market Insight:": "Maklumat pasaran:", "Reskilling required": "Perlu belajar kemahiran baharu", "Skills to build:": "Kemahiran untuk dipelajari:", "Search pages or actions...": "Cari halaman atau tindakan...", "Navigate and take action": "Halaman dan tindakan", "No matching commands.": "Tiada hasil yang sepadan.", "Navigate with ↑ ↓ and select with ↵": "Guna ↑ ↓ untuk pilih dan tekan ↵ untuk buka",
    "Career impact": "Impak kerjaya", "UN Sustainable Development Goals": "Matlamat Pembangunan Mampan PBB", "Potential alignment of": "Kesesuaian potensi", "this career pathway": "laluan kerjaya ini", "and its skills with global development goals.": "dan kemahirannya dengan matlamat pembangunan global.", "Estimated alignment": "Anggaran kesesuaian", "Related skills:": "Kemahiran berkaitan:",
    "Future changes": "Perubahan masa depan", "Market risk": "Risiko pasaran", "Hold the wheel and move it from left to right.": "Pegang roda dan gerakkannya dari kiri ke kanan.", "Lower risk": "Risiko rendah", "Higher risk": "Risiko tinggi", "Current scenario": "Senario semasa", "Choose a future scenario": "Pilih satu senario", "AI changes work quickly": "Perubahan AI berlaku dengan cepat", "Fewer jobs during a downturn": "Peluang kerja berkurang ketika ekonomi merosot", "More clean technology jobs": "Lebih banyak kerja dalam teknologi hijau", "Stress-test your pathway": "Semak ketahanan laluan kerjaya", "Future market scenarios": "Kemungkinan pasaran akan datang", "Adjust disruption severity to see how your pathway may hold up under changing market conditions.": "Laraskan tahap perubahan pasaran untuk melihat ketahanan laluan kerjaya anda.", "Selected scenario": "Senario dipilih", "Market disruption severity": "Tahap perubahan pasaran", "Lower": "Rendah", Higher: "Tinggi", "Pathway resilience": "Ketahanan laluan", "Estimated job stability": "Anggaran kestabilan kerja", "Baseline Growth Scenario": "Senario Pertumbuhan Asas", "High AI Adoption Scenario": "Senario Penggunaan AI Tinggi", "Rapid AI Automation": "Automasi AI Pantas", "Economic Recession": "Kemelesetan Ekonomi", "Green Tech Boom": "Pertumbuhan Teknologi Hijau", Estimates: "Anggaran", "Time estimate unavailable": "Anggaran masa tiada",
    "Selected career match": "Padanan kerjaya pilihan", "Learning pathway for": "Laluan pembelajaran untuk", "Open a focus area for curated starting points, then use the visual roadmap to explore the full skill tree.": "Pilih kemahiran untuk melihat sumber pembelajaran, kemudian gunakan peta visual untuk melihat keseluruhan laluan.", "Visual career guide": "Panduan visual kerjaya", "The Complete Visual Roadmap": "Peta Laluan Visual Lengkap", "Explore the industry-standard visual guide for": "Lihat panduan visual kerjaya untuk", "Explore roadmap.sh": "Lihat roadmap.sh",
  },
  zh: {
    "MY PROFILE": "我的资料", EXPLORE: "探索", "Discover yourself": "了解自己", "Your CV": "我的简历", "Career matches": "职业推荐", "Job Matcher": "职位匹配", "Learning pathway": "学习计划", "SDG impact": "可持续发展目标", "Main page": "主页", "How it works": "使用说明", "Your profile": "个人资料", "Switch to light mode": "切换到浅色模式", "Switch to dark mode": "切换到深色模式", Goal: "目标", Commands: "搜索", "Career workspace": "职业工作区", "Resume co-pilot": "简历助手", "Job Match & CV Tailoring": "职位匹配与简历建议", "Compare your profile to a target role, then create a fact-grounded draft for that same job.": "比较您的资料与目标职位，并获取基于真实经历的简历建议。", "Future-ready roles ranked against your profile.": "根据您的资料推荐未来职业。", "Your goals and experience shape your career recommendations.": "您的目标和经验将帮助我们提供职业建议。", "Review the skills extracted from your uploaded resume.": "查看从简历中识别出的技能。", "Focus areas to help close the gap to your selected role.": "为目标职位补充技能的学习重点。", "How your potential career direction aligns with global goals.": "了解职业方向如何支持全球发展目标。", "Job Match Analyzer": "职位匹配分析", "Compare your profile skills with a specific job description.": "将您的技能与职位描述进行比较。",
    "Explore your options": "适合您的职业", "Ranked future roles": "未来职业推荐", "Scores reflect how closely each path fits your current profile.": "分数表示职业与您当前资料的匹配程度。", match: "匹配", "Why this match": "匹配原因", "Market Insight:": "市场信息：", "Reskilling required": "需要学习新技能", "Skills to build:": "建议学习：", "Search pages or actions...": "搜索页面或操作...", "Navigate and take action": "页面与操作", "No matching commands.": "没有找到相关结果。", "Navigate with ↑ ↓ and select with ↵": "使用 ↑ ↓ 选择，按 ↵ 打开",
    "Career impact": "职业影响", "UN Sustainable Development Goals": "联合国可持续发展目标", "Potential alignment of": "以下职业与目标的潜在关联：", "this career pathway": "此职业路径", "and its skills with global development goals.": "及其技能与全球发展目标的关系。", "Estimated alignment": "预计关联度", "Related skills:": "相关技能：",
    "Future changes": "\u672a\u6765\u53d8\u5316", "Market risk": "\u5e02\u573a\u98ce\u9669", "Hold the wheel and move it from left to right.": "\u6309\u4f4f\u8f6c\u8f6e\u5e76\u4ece\u5de6\u5411\u53f3\u79fb\u52a8", "Lower risk": "\u4f4e\u98ce\u9669", "Higher risk": "\u9ad8\u98ce\u9669", "Current scenario": "\u5f53\u524d\u60c5\u51b5", "Choose a future scenario": "\u9009\u62e9\u672a\u6765\u60c5\u51b5", "AI changes work quickly": "AI\u5feb\u901f\u6539\u53d8\u5de5\u4f5c", "Fewer jobs during a downturn": "\u7ecf\u6d4e\u4e0b\u884c\u65f6\u5de5\u4f5c\u51cf\u5c11", "More clean technology jobs": "\u6e05\u6d01\u6280\u672f\u76f8\u5173\u5de5\u4f5c\u589e\u591a", "Stress-test your pathway": "评估职业计划的适应力", "Future market scenarios": "未来市场情景", "Adjust disruption severity to see how your pathway may hold up under changing market conditions.": "调整市场变化程度，查看职业计划在不同情况下的适应力。", "Selected scenario": "当前情景", "Market disruption severity": "市场变化程度", Lower: "较低", Higher: "较高", "Pathway resilience": "职业计划适应力", "Estimated job stability": "预计工作稳定性", "Baseline Growth Scenario": "基准增长情景", "High AI Adoption Scenario": "人工智能普及情景", "Rapid AI Automation": "人工智能快速自动化", "Economic Recession": "经济衰退", "Green Tech Boom": "绿色科技增长", Estimates: "估算", "Time estimate unavailable": "暂无时间估算",
    "Selected career match": "已选职业", "Learning pathway for": "学习计划：", "Open a focus area for curated starting points, then use the visual roadmap to explore the full skill tree.": "点击技能查看学习资源，也可通过可视化路线图了解完整技能路径。", "Visual career guide": "职业路线图", "The Complete Visual Roadmap": "完整可视化路线图", "Explore the industry-standard visual guide for": "查看此职业的可视化指南：", "Explore roadmap.sh": "打开 roadmap.sh",
  },
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (text: string) => string;
  hydrated: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem("unhired.language");
    if (savedLanguage === "en" || savedLanguage === "bm" || savedLanguage === "zh") setLanguageState(savedLanguage);
    localStorage.removeItem("unhired.lite-mode");
    setHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "bm" ? "ms" : language === "zh" ? "zh-Hans" : "en";
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: (next) => {
      setLanguageState(next);
      localStorage.setItem("unhired.language", next);
    },
    t: (text) => DICTIONARIES[language][text] ?? text,
    hydrated,
  }), [language, hydrated]);

  return createElement(LanguageContext.Provider, { value }, children);
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
