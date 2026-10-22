"use client";

import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";

export interface OnboardingProfile {
  first_name: string;
  career_goal: string;
  current_situation: string;
  experience_level: string;
}

export interface BaseProfile extends OnboardingProfile {
  current_role: string;
  current_skills: string[];
  years_experience: number;
  target_role: string;
}

interface ParsedResume {
  current_role?: string;
  current_skills?: string[];
  years_experience?: number;
  detail?: string;
}

interface OnboardingWizardProps {
  loading: boolean;
  onComplete: (profile: BaseProfile) => Promise<void> | void;
}

interface GoalOption {
  id: string;
  title: string;
  description: string;
  suggestedRole: string;
}

const STEPS = [
  "Your name",
  "Your goal",
  "Your situation",
  "Your experience",
  "Your toolkit",
  "Your resume",
];

const GOALS: GoalOption[] = [
  {
    id: "first-job",
    title: "Land my first job",
    description: "Find a clear path into a future-ready role.",
    suggestedRole: "Software and Applications Developer",
  },
  {
    id: "level-up",
    title: "Level up my career",
    description: "Grow into more advanced, higher-impact work.",
    suggestedRole: "AI and Machine Learning Specialist",
  },
  {
    id: "transition",
    title: "Transition into AI",
    description: "Build on what you know and move toward AI work.",
    suggestedRole: "AI and Machine Learning Specialist",
  },
  {
    id: "explore",
    title: "Explore a new direction",
    description: "Compare promising roles that fit your strengths.",
    suggestedRole: "Big Data Specialist",
  },
];

const SITUATIONS = ["Student", "Employed", "Freelancer", "Career changer", "Between roles"];

const EXPERIENCE_LEVELS = [
  { label: "Just starting", detail: "Internship or under 1 year", years: 0 },
  { label: "Early career", detail: "1-2 years", years: 2 },
  { label: "Growing experience", detail: "3-5 years", years: 4 },
  { label: "Experienced", detail: "6-10 years", years: 8 },
  { label: "Seasoned", detail: "10+ years", years: 12 },
];

const SKILL_OPTIONS = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Next.js",
  "React",
  "SQL",
  "HTML/CSS",
  "Pandas",
  "FastAPI",
  "Git",
  "Docker",
  "AWS",
  "Power BI",
  "Excel",
  "Figma",
  "Prompt Engineering",
];

const TARGET_ROLES = [
  "AI and Machine Learning Specialist",
  "Big Data Specialist",
  "Software and Applications Developer",
  "FinTech Engineer",
  "Data Engineer",
  "AI Product Manager",
];

export default function OnboardingWizard({
  loading,
  onComplete,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [goal, setGoal] = useState<GoalOption | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [situation, setSituation] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [yearsExperience, setYearsExperience] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkills, setCustomSkills] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [parsingResume, setParsingResume] = useState(false);
  const [error, setError] = useState("");
  const [animating, setAnimating] = useState(false);
  const stepPanelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const panel = stepPanelRef.current;
    if (!panel) return;
    setAnimating(true);
    const animation = panel.animate(
      [
        { opacity: 0, transform: "translateY(10px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 280, easing: "ease-out" },
    );
    animation.onfinish = () => setAnimating(false);
    return () => animation.cancel();
  }, [step]);

  function moveToStep(nextStep: number) {
    setError("");
    setStep(Math.max(0, Math.min(STEPS.length - 1, nextStep)));
  }

  function validateCurrentStep() {
    if (step === 0 && !firstName.trim()) {
      setError("Add your first name to continue.");
      return false;
    }
    if (step === 1 && (!goal || !targetRole)) {
      setError("Choose a goal and a role to explore.");
      return false;
    }
    if (step === 2 && !situation) {
      setError("Choose the option that best describes you.");
      return false;
    }
    if (step === 3 && !experienceLevel) {
      setError("Choose an experience level to continue.");
      return false;
    }
    setError("");
    return true;
  }

  function handleFile(candidate: File | undefined) {
    if (!candidate) return;
    const filename = candidate.name.toLowerCase();
    if (!filename.endsWith(".pdf") && !filename.endsWith(".docx")) {
      setError("Choose a PDF or DOCX resume.");
      setResumeFile(null);
      return;
    }
    if (candidate.size > 10 * 1024 * 1024) {
      setError("Resume files must be 10 MB or smaller.");
      setResumeFile(null);
      return;
    }
    setError("");
    setResumeFile(candidate);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files[0]);
  }

  async function finishOnboarding(skipResume = false) {
    if (loading || parsingResume) return;
    setError("");
    setParsingResume(Boolean(resumeFile && !skipResume));

    let parsed: ParsedResume = {};
    if (resumeFile && !skipResume) {
      try {
        const formData = new FormData();
        formData.append("file", resumeFile);
        const response = await fetch("/api/resume/parse", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          const responseText = await response.text();
          let message = responseText || `Resume parsing failed (${response.status})`;
          try {
            const errorPayload = JSON.parse(responseText) as { detail?: unknown };
            if (typeof errorPayload.detail === "string") {
              message = errorPayload.detail;
            }
          } catch {
            // Keep the response text so plain-text server errors stay readable.
          }
          throw new Error(message);
        }
        parsed = (await response.json()) as ParsedResume;
      } catch (requestError) {
        setParsingResume(false);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to read this resume. You can skip the upload and continue.",
        );
        return;
      }
    }

    const extraSkills = customSkills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
    const allSkills = [
      ...selectedSkills,
      ...extraSkills,
      ...(parsed.current_skills ?? []),
    ].filter((skill, index, skills) =>
      skills.findIndex((candidate) => candidate.toLowerCase() === skill.toLowerCase()) === index,
    );
    const profile: BaseProfile = {
      first_name: firstName.trim(),
      career_goal: goal?.title ?? "",
      current_situation: situation,
      experience_level: experienceLevel,
      current_role: currentRole.trim() || parsed.current_role || situation,
      current_skills: allSkills,
      years_experience: parsed.years_experience || yearsExperience,
      target_role: targetRole,
    };

    try {
      // Skipping the resume intentionally bypasses multipart parsing. The page
      // sends this collected wizard profile as JSON to /api/recommendation.
      await onComplete(profile);
    } finally {
      setParsingResume(false);
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100;
  const busy = loading || parsingResume;

  return (
    <section className="mx-auto w-full max-w-2xl rounded-3xl border border-gray-800 bg-gray-950 p-6 shadow-2xl shadow-black/30 sm:p-9">
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
          <span>Getting started</span>
          <span>STEP {String(step + 1).padStart(2, "0")} / 06</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-400 transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between gap-1" aria-hidden="true">
          {STEPS.map((label, index) => (
            <span
              key={label}
              className={`h-1 w-1 rounded-full ${index <= step ? "bg-rose-400" : "bg-gray-700"}`}
            />
          ))}
        </div>
      </div>

      <div ref={stepPanelRef} aria-live="polite" className={animating ? "will-change-transform" : ""}>
        <p className="text-sm font-medium text-rose-300">{STEPS[step]}</p>
        {step === 0 && (
          <div className="mt-3 space-y-5">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              First, what should we call you?
            </h1>
            <p className="text-sm leading-6 text-gray-400">We’ll use your name to personalize your career workspace.</p>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && validateCurrentStep() && moveToStep(1)}
              placeholder="Your first name"
              autoComplete="given-name"
              className="w-full rounded-xl border border-gray-800 bg-black px-4 py-4 text-lg text-white outline-none placeholder:text-gray-600 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/30"
            />
          </div>
        )}

        {step === 1 && (
          <div className="mt-3 space-y-5">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">What would you like to do next?</h1>
              <p className="mt-2 text-sm text-gray-400">Choose a goal, then select a role to explore.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {GOALS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={goal?.id === option.id}
                  onClick={() => {
                    setGoal(option);
                    setTargetRole(option.suggestedRole);
                    setError("");
                  }}
                  className={`rounded-2xl border p-4 text-left transition ${goal?.id === option.id ? "border-rose-400/60 bg-rose-500/10" : "border-gray-800 bg-black/60 hover:border-gray-600"}`}
                >
                  <span className="block font-medium text-white">{option.title}</span>
                  <span className="mt-1 block text-sm leading-5 text-gray-400">{option.description}</span>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <label htmlFor="wizard-target-role" className="block text-sm font-medium text-gray-300">Role to explore</label>
              <select
                id="wizard-target-role"
                value={targetRole}
                onChange={(event) => setTargetRole(event.target.value)}
                className="w-full rounded-xl border border-gray-800 bg-black px-4 py-3 text-white outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/30"
              >
                {TARGET_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-3 space-y-5">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Where are you right now?</h1>
              <p className="mt-2 text-sm text-gray-400">This helps us tailor the starting point.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SITUATIONS.map((option) => (
                <ChoicePill key={option} selected={situation === option} onClick={() => setSituation(option)}>{option}</ChoicePill>
              ))}
            </div>
            <div className="space-y-2">
              <label htmlFor="current-role" className="block text-sm font-medium text-gray-300">Current role or field <span className="text-gray-600">(optional)</span></label>
              <input
                id="current-role"
                value={currentRole}
                onChange={(event) => setCurrentRole(event.target.value)}
                placeholder="e.g. Web developer, business student"
                className="w-full rounded-xl border border-gray-800 bg-black px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/30"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-3 space-y-5">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">How much experience do you have?</h1>
              <p className="mt-2 text-sm text-gray-400">Choose the closest range. You can refine your skills next.</p>
            </div>
            <div className="space-y-2">
              {EXPERIENCE_LEVELS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  aria-pressed={experienceLevel === option.label}
                  onClick={() => {
                    setExperienceLevel(option.label);
                    setYearsExperience(option.years);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${experienceLevel === option.label ? "border-rose-400/60 bg-rose-500/10" : "border-gray-800 bg-black/60 hover:border-gray-600"}`}
                >
                  <span className="font-medium text-white">{option.label}</span>
                  <span className="text-sm text-gray-500">{option.detail}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="mt-3 space-y-5">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">What tools do you work with?</h1>
              <p className="mt-2 text-sm text-gray-400">Select everything you know. These become your current skills.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => (
                <ChoicePill
                  key={skill}
                  selected={selectedSkills.includes(skill)}
                  onClick={() => setSelectedSkills((current) => current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill])}
                >
                  {skill}
                </ChoicePill>
              ))}
            </div>
            <div className="space-y-2">
              <label htmlFor="custom-skills" className="block text-sm font-medium text-gray-300">Add another skill <span className="text-gray-600">(optional)</span></label>
              <input
                id="custom-skills"
                value={customSkills}
                onChange={(event) => setCustomSkills(event.target.value)}
                placeholder="Separate additional skills with commas"
                className="w-full rounded-xl border border-gray-800 bg-black px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/30"
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="mt-3 space-y-5">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Have a resume handy?</h1>
              <p className="mt-2 text-sm text-gray-400">We can use it to add skills to your profile. Your resume is parsed locally by the backend.</p>
            </div>
            <div
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`rounded-2xl border border-dashed px-5 py-10 text-center transition ${dragging ? "border-rose-400 bg-rose-500/10" : "border-gray-700 bg-black/50 hover:border-gray-500"}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => handleFile(event.target.files?.[0])}
                className="sr-only"
                id="wizard-resume"
              />
              <svg className="mx-auto h-9 w-9 text-rose-300" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5v3A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-3 font-medium text-white">Drop your resume here</p>
              <p className="mt-1 text-sm text-gray-500">PDF or DOCX, up to 10 MB</p>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-4 text-sm font-medium text-rose-300 underline underline-offset-4 hover:text-rose-200">
                Browse files
              </button>
              {resumeFile && <p className="mt-4 text-sm text-emerald-300">Selected: {resumeFile.name}</p>}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void finishOnboarding(true)}
              className="text-sm text-gray-500 underline decoration-gray-700 underline-offset-4 transition hover:text-gray-300 disabled:opacity-50"
            >
              I do not have one yet
            </button>
          </div>
        )}
      </div>

      {error && <p role="alert" className="mt-5 rounded-xl border border-rose-900/70 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">{error}</p>}

      <div className="mt-8 flex items-center justify-between border-t border-gray-800 pt-5">
        <button
          type="button"
          disabled={step === 0 || busy}
          onClick={() => moveToStep(step - 1)}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={busy || animating}
            onClick={() => validateCurrentStep() && moveToStep(step + 1)}
            className="rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/40 transition hover:bg-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void finishOnboarding()}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-950/40 transition hover:bg-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
            {parsingResume ? "Analyzing Resume..." : loading ? "Building your dashboard..." : "Build my dashboard"}
          </button>
        )}
      </div>
    </section>
  );
}

interface ChoicePillProps {
  children: string;
  selected: boolean;
  onClick: () => void;
}

function ChoicePill({ children, selected, onClick }: ChoicePillProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm transition ${selected ? "border-rose-400/60 bg-rose-500/15 text-rose-100" : "border-gray-800 bg-black/50 text-gray-400 hover:border-gray-600 hover:text-gray-200"}`}
    >
      {children}
    </button>
  );
}
