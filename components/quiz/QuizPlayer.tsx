import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ClipboardCheck,
  Clock,
  Target,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  CheckSquare,
  Square,
  Trophy,
  RotateCcw,
  Loader2,
  XCircle,
  History,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { quizAttemptQueries } from "@/lib/db/quizzes";
import type { Quiz, QuizAttempt, QuizQuestion } from "@/lib/db/types";

type Stage = "intro" | "active" | "submitting" | "results";

// Fisher–Yates, used only for the on-screen question order — the graded
// answer key never touches the client in a way order could leak.
function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// A short burst of rising, fading dots behind the score — a lightweight,
// dependency-free stand-in for confetti that respects prefers-reduced-motion
// via the app-wide CSS override in index.css.
function Sparkle() {
  const dots = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 220,
        delay: Math.random() * 0.3,
        size: 4 + Math.random() * 5,
        hue: ["bg-accent", "bg-primary", "bg-ember", "bg-success"][i % 4],
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-hidden">
      {dots.map(d => (
        <motion.span
          key={d.id}
          initial={{ opacity: 0.001, y: 40, x: d.x, scale: 0.4 }}
          animate={{ opacity: [0.001, 1, 0], y: -70, scale: 1 }}
          transition={{ duration: 1.1, delay: d.delay, ease: "easeOut" }}
          className={`absolute top-1/2 rounded-pill ${d.hue}`}
          style={{ width: d.size, height: d.size }}
        />
      ))}
    </div>
  );
}

export default function QuizPlayer({ quiz }: { quiz: Quiz }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const T = (key: string) => t(`components.quiz.QuizPlayer.${key}`);

  const [stage, setStage] = useState<Stage>("intro");
  const [orderedQuestions, setOrderedQuestions] = useState<QuizQuestion[]>(quiz.quiz_questions ?? []);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [error, setError] = useState("");
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    quizAttemptQueries
      .getHistory(quiz.id, user.id)
      .then(setHistory)
      .catch(() => {});
  }, [quiz.id, user]);

  const questions = orderedQuestions;
  const answeredCount = Object.values(answers).filter(v => v.length > 0).length;
  const bestScore = history.length > 0 ? Math.max(...history.map(h => h.score)) : null;

  const start = () => {
    setOrderedQuestions(quiz.shuffle_questions ? shuffled(quiz.quiz_questions ?? []) : quiz.quiz_questions ?? []);
    setAnswers({});
    setCurrent(0);
    setResult(null);
    setError("");
    setSecondsLeft(quiz.time_limit_minutes ? quiz.time_limit_minutes * 60 : null);
    setStage("active");
  };

  const submit = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setStage("submitting");
    try {
      const payload = questions.map(q => ({ question_id: q.id, option_ids: answers[q.id] ?? [] }));
      const attempt = await quizAttemptQueries.submit(quiz.id, payload);
      setResult(attempt);
      setHistory(prev => [attempt, ...prev]);
      setStage("results");
    } catch (err) {
      console.error("[QuizPlayer] submit error:", err);
      setError(T("errorSubmit"));
      setStage("active");
    } finally {
      submittingRef.current = false;
    }
  };

  // Countdown timer — auto-submits whatever's answered so far the instant
  // it hits zero, same "time's up, we take what you've got" behavior every
  // timed test platform uses rather than blocking the student mid-question.
  useEffect(() => {
    if (stage !== "active" || secondsLeft === null) return;
    if (secondsLeft <= 0) {
      submit();
      return;
    }
    const id = window.setTimeout(() => setSecondsLeft(s => (s !== null ? s - 1 : s)), 1000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, secondsLeft]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const toggleAnswer = (question: QuizQuestion, optionId: string) => {
    setAnswers(prev => {
      const existing = prev[question.id] ?? [];
      if (question.multi_select) {
        const next = existing.includes(optionId) ? existing.filter(id => id !== optionId) : [...existing, optionId];
        return { ...prev, [question.id]: next };
      }
      return { ...prev, [question.id]: [optionId] };
    });
  };

  if (!user || questions.length === 0) return null;

  const q = questions[current];
  const isLast = current === questions.length - 1;
  const scorePct = result?.score ?? 0;
  const ringOffset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * scorePct) / 100;

  return (
    <div className="lesson-card overflow-hidden rounded-card border border-line">
      <div className="flex items-center gap-tight border-b border-line bg-mist/60 px-stack py-tight">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-accent/10 text-accent">
          <ClipboardCheck size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{quiz.title}</p>
          <p className="text-xs text-slate">
            {questions.length} {T("questions")}
            {bestScore !== null && stage === "intro" ? ` · ${T("bestScore")} ${bestScore}%` : ""}
          </p>
        </div>
        {stage === "active" && secondsLeft !== null ? (
          <span
            className={`flex shrink-0 items-center gap-1 rounded-pill px-stack py-1 text-xs font-medium ${
              secondsLeft <= 30 ? "bg-danger/10 text-danger" : "bg-mist text-slate"
            }`}
          >
            <Clock size={12} aria-hidden="true" />
            {formatTime(secondsLeft)}
          </span>
        ) : null}
      </div>

      <div className="px-stack py-block">
        <AnimatePresence mode="wait">
          {stage === "intro" ? (
            <motion.div key="intro" initial={{ opacity: 0.001, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0.001 }} className="flex flex-col items-center gap-stack text-center">
              {quiz.description ? <p className="max-w-prose text-sm text-slate">{quiz.description}</p> : null}
              <div className="flex flex-wrap items-center justify-center gap-tight text-xs text-slate">
                <span className="flex items-center gap-1 rounded-pill bg-mist px-stack py-1">
                  <Target size={12} aria-hidden="true" /> {T("passAt")} {quiz.passing_score}%
                </span>
                {quiz.time_limit_minutes ? (
                  <span className="flex items-center gap-1 rounded-pill bg-mist px-stack py-1">
                    <Clock size={12} aria-hidden="true" /> {quiz.time_limit_minutes} {T("minutes")}
                  </span>
                ) : null}
                {history.length > 0 ? (
                  <span className="flex items-center gap-1 rounded-pill bg-mist px-stack py-1">
                    <History size={12} aria-hidden="true" /> {history.length} {T("attempts")}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={start}
                className="gradient-brand rounded-control px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover"
              >
                {history.length > 0 ? T("retake") : T("start")}
              </button>
            </motion.div>
          ) : null}

          {stage === "active" ? (
            <motion.div key={`q-${current}`} initial={{ opacity: 0.001, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0.001, x: -16 }} transition={{ duration: 0.18 }}>
              <div className="mb-stack h-1.5 w-full overflow-hidden rounded-pill bg-line">
                <motion.div
                  className="gradient-brand h-full rounded-pill"
                  animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
                  transition={{ duration: 0.25 }}
                />
              </div>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-slate">
                {T("question")} {current + 1} / {questions.length}
                {q.multi_select ? ` · ${T("selectAll")}` : ""}
              </p>
              <p className="mb-stack text-base font-medium text-ink">{q.prompt}</p>
              {q.image_url ? (
                <img
                  src={q.image_url}
                  alt=""
                  className="mb-stack max-h-64 w-full rounded-control border border-line object-contain bg-mist"
                />
              ) : null}

              <div className="flex flex-col gap-tight">
                {(q.quiz_options ?? []).map(o => {
                  const selected = (answers[q.id] ?? []).includes(o.id);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => toggleAnswer(q, o.id)}
                      className={`flex items-center gap-tight rounded-control border px-stack py-tight text-left text-sm transition-colors duration-base ${
                        selected ? "border-accent bg-accent/5 text-ink" : "border-line text-ink hover:border-accent/50 hover:bg-mist"
                      }`}
                    >
                      {q.multi_select ? (
                        selected ? <CheckSquare size={17} className="shrink-0 text-accent" /> : <Square size={17} className="shrink-0 text-slate" />
                      ) : selected ? (
                        <CheckCircle2 size={17} className="shrink-0 text-accent" />
                      ) : (
                        <Circle size={17} className="shrink-0 text-slate" />
                      )}
                      {o.image_url ? (
                        <img src={o.image_url} alt="" className="h-14 w-14 shrink-0 rounded-control border border-line object-cover" />
                      ) : null}
                      {o.label ? <span>{o.label}</span> : null}
                    </button>
                  );
                })}
              </div>

              {error ? <p className="mt-tight text-xs text-danger">{error}</p> : null}

              <div className="mt-stack flex items-center justify-between gap-tight">
                <button
                  type="button"
                  onClick={() => setCurrent(c => Math.max(0, c - 1))}
                  disabled={current === 0}
                  className="flex items-center gap-1 rounded-control border border-line px-stack py-tight text-sm text-slate transition-colors duration-base hover:text-ink disabled:opacity-30"
                >
                  <ChevronLeft size={15} aria-hidden="true" /> {T("previous")}
                </button>
                <span className="text-xs text-slate">
                  {answeredCount}/{questions.length} {T("answered")}
                </span>
                {isLast ? (
                  <button
                    type="button"
                    onClick={submit}
                    className="gradient-brand rounded-control px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover"
                  >
                    {T("submit")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))}
                    className="flex items-center gap-1 rounded-control border border-line px-stack py-tight text-sm text-ink transition-colors duration-base hover:border-accent"
                  >
                    {T("next")} <ChevronRight size={15} aria-hidden="true" />
                  </button>
                )}
              </div>
            </motion.div>
          ) : null}

          {stage === "submitting" ? (
            <motion.div key="submitting" initial={{ opacity: 0.001 }} animate={{ opacity: 1 }} exit={{ opacity: 0.001 }} className="flex flex-col items-center gap-tight py-block text-slate">
              <Loader2 size={22} className="animate-spin text-accent" aria-hidden="true" />
              <p className="text-sm">{T("grading")}</p>
            </motion.div>
          ) : null}

          {stage === "results" && result ? (
            <motion.div key="results" initial={{ opacity: 0.001 }} animate={{ opacity: 1 }} exit={{ opacity: 0.001 }} className="flex flex-col items-center gap-stack">
              <div className="relative flex flex-col items-center">
                {result.passed ? <Sparkle /> : null}
                <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
                  <circle cx="64" cy="64" r={RING_RADIUS} fill="none" stroke="var(--color-line)" strokeWidth="10" />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r={RING_RADIUS}
                    fill="none"
                    stroke={result.passed ? "var(--color-success)" : "var(--color-ember)"}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    initial={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                    animate={{ strokeDashoffset: ringOffset }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-gradient-head text-3xl font-heading font-medium">{result.score}%</span>
                  <span className="text-[10px] uppercase tracking-widest text-slate">
                    {result.points_earned}/{result.points_possible} {T("points")}
                  </span>
                </div>
              </div>

              <div className={`flex items-center gap-1.5 rounded-pill px-stack py-1 text-sm font-medium ${result.passed ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}>
                {result.passed ? <Trophy size={15} aria-hidden="true" /> : <XCircle size={15} aria-hidden="true" />}
                {result.passed ? T("passed") : T("failed")}
              </div>

              <div className="flex w-full flex-col gap-1 border-t border-line pt-stack">
                {questions.map((question, i) => {
                  const response = result.responses.find(r => r.question_id === question.id);
                  const correctLabels = (question.quiz_options ?? [])
                    .filter(o => response?.correct_option_ids.includes(o.id))
                    .map(o => o.label || T("imageOption"));
                  const selectedLabels = (question.quiz_options ?? [])
                    .filter(o => response?.selected_option_ids.includes(o.id))
                    .map(o => o.label || T("imageOption"));
                  const correct = !!response?.correct;
                  return (
                    <div key={question.id} className="flex items-start gap-tight rounded-control px-tight py-tight text-left hover:bg-mist">
                      {correct ? (
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" aria-hidden="true" />
                      ) : (
                        <XCircle size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-ink">
                          {i + 1}. {question.prompt}
                        </p>
                        {!correct ? (
                          <p className="mt-0.5 text-xs text-slate">
                            {T("yourAnswer")}: {selectedLabels.join(", ") || T("noAnswer")} · {T("correctAnswer")}: {correctLabels.join(", ")}
                          </p>
                        ) : null}
                        {question.explanation ? <p className="mt-0.5 text-xs italic text-slate">{question.explanation}</p> : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={start}
                className="flex items-center gap-1.5 rounded-control border border-line px-block py-tight text-sm text-ink transition-colors duration-base hover:border-accent"
              >
                <RotateCcw size={14} aria-hidden="true" /> {T("retake")}
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
