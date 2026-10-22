import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";

export interface BaseProfile {
  current_role: string;
  current_skills: string[];
  years_experience: number;
  target_role: string;
}

interface ParsedResume {
  current_role?: string;
  current_skills?: string[];
  years_experience?: number;
  extraction_note?: string;
  detail?: string;
}

interface SkillIntakeProps {
  loading: boolean;
  initialTargetRole: string;
  onProfileSubmit: (profile: BaseProfile) => Promise<void> | void;
}

type IntakeMode = "resume" | "manual";

export default function SkillIntake({
  loading,
  initialTargetRole,
  onProfileSubmit,
}: SkillIntakeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<IntakeMode>("resume");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [targetRole, setTargetRole] = useState(initialTargetRole);

  useEffect(() => {
    setTargetRole(initialTargetRole);
  }, [initialTargetRole]);

  function chooseFile(candidate: File | undefined) {
    if (!candidate) return;
    const filename = candidate.name.toLowerCase();
    if (!filename.endsWith(".pdf") && !filename.endsWith(".docx")) {
      setError("Choose a PDF or DOCX resume.");
      setFile(null);
      return;
    }
    if (candidate.size > 10 * 1024 * 1024) {
      setError("Resume files must be 10 MB or smaller.");
      setFile(null);
      return;
    }
    setError("");
    setFile(candidate);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!targetRole.trim()) {
      setError("Enter the future role you want to explore.");
      return;
    }

    if (mode === "manual") {
      await onProfileSubmit({
        current_role: currentRole.trim(),
        current_skills: skillsText
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        years_experience: Number(yearsExperience) || 0,
        target_role: targetRole.trim(),
      });
      return;
    }

    if (!file) {
      setError("Choose a PDF or DOCX resume to continue.");
      return;
    }

    setParsing(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/resume/parse", {
        method: "POST",
        body,
      });
      const parsed = (await response.json()) as ParsedResume;
      if (!response.ok) {
        throw new Error(parsed.detail ?? `Resume parsing failed (${response.status})`);
      }

      const profile: BaseProfile = {
        current_role: parsed.current_role ?? "",
        current_skills: parsed.current_skills ?? [],
        years_experience: parsed.years_experience ?? 0,
        target_role: targetRole.trim(),
      };
      setCurrentRole(profile.current_role);
      setSkillsText(profile.current_skills.join(", "));
      setYearsExperience(String(profile.years_experience));
      await onProfileSubmit(profile);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to read this resume. Please try a PDF or DOCX file.",
      );
    } finally {
      setParsing(false);
    }
  }

  const busy = loading || parsing;

  return (
    <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20 sm:p-8">
      <div>
        <p className="text-sm font-medium text-blue-400">Start with you</p>
        <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
          Build your career snapshot
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Upload a resume for a quick profile extraction or enter your experience
          yourself.
        </p>
      </div>

      <div className="grid grid-cols-2 rounded-xl border border-slate-800 bg-slate-950 p-1">
        {(["resume", "manual"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            aria-pressed={mode === tab}
            onClick={() => {
              setMode(tab);
              setError("");
            }}
            className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              mode === tab
                ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab === "resume" ? "Upload Resume" : "Manual Entry"}
          </button>
        ))}
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {mode === "resume" ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="resume-file">
              Resume file
            </label>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`rounded-2xl border border-dashed p-7 text-center transition ${
                dragging
                  ? "border-blue-400 bg-blue-500/10"
                  : "border-slate-700 bg-slate-950/60 hover:border-slate-500"
              }`}
            >
              <input
                ref={fileInputRef}
                id="resume-file"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(event) => chooseFile(event.target.files?.[0])}
              />
              <svg className="mx-auto h-8 w-8 text-blue-300" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5v3A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-3 text-sm font-medium text-slate-200">
                Drop your resume here, or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-300 underline underline-offset-4 hover:text-blue-200"
                >
                  browse files
                </button>
              </p>
              <p className="mt-1 text-xs text-slate-500">PDF or DOCX, up to 10 MB</p>
              {file && (
                <p className="mt-4 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                  {file.name}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="current-role"
              label="Current role"
              value={currentRole}
              onChange={setCurrentRole}
              placeholder="Frontend Developer"
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200" htmlFor="years-experience">
                Years of experience
              </label>
              <input
                id="years-experience"
                type="number"
                min="0"
                max="60"
                value={yearsExperience}
                onChange={(event) => setYearsExperience(event.target.value)}
                placeholder="3"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="block text-sm font-medium text-slate-200" htmlFor="skills">
                Skills
              </label>
              <input
                id="skills"
                type="text"
                value={skillsText}
                onChange={(event) => setSkillsText(event.target.value)}
                placeholder="HTML/CSS, JavaScript, Python, SQL"
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500">Separate skills with commas.</p>
            </div>
          </div>
        )}

        <Field
          id="target-role"
          label="Future role to explore"
          value={targetRole}
          onChange={setTargetRole}
          placeholder="AI and Machine Learning Specialist"
          required
        />

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-lg shadow-blue-950/50 transition-all hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {busy && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
          )}
          {parsing ? "Analyzing Resume..." : loading ? "Building your dashboard..." : mode === "resume" ? "Analyze Resume & Career Path" : "Analyze My Career Path"}
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-xl border border-red-900/70 bg-red-950/50 p-4 text-sm text-red-200">
          {error}
        </p>
      )}
    </section>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}

function Field({ id, label, value, onChange, placeholder, required }: FieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-200" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
