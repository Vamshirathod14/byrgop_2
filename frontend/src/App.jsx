import { lazy, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import api, { setAdminTokenGetter } from './api/client.js';
import AnimatedBackground from './components/AnimatedBackground.jsx';
import GlobalCopyGuard from './components/GlobalCopyGuard.jsx';
import PrimaryButton from './components/PrimaryButton.jsx';
import IntroScreen from './screens/IntroScreen.jsx';
import QuestionScreen from './screens/QuestionScreen.jsx';
import ResultScreen from './screens/ResultScreen.jsx';
import DomainSelectionScreen from './screens/DomainSelectionScreen.jsx';
import BusinessTypeScreen from './screens/BusinessTypeScreen.jsx';
import KnowYourselfScreen from './screens/KnowYourselfScreen.jsx';
import KnowYourselfResult from './screens/KnowYourselfResult.jsx';
import DisclaimerScreen from './screens/DisclaimerScreen.jsx';
import ResumeModal from './screens/ResumeModal.jsx';
import LoginScreen from './screens/LoginScreen.jsx';
import {
  getBrowserId,
  getRejectedResumeSession,
  getSavedBusinessType,
  getSavedEmail,
  NOT_APPLICABLE_VALUE,
  saveBusinessType,
  saveEmail,
  setRejectedResumeSession,
} from './lib/kyIdentity.js';
import { brand } from './theme/brand.js';
import { applyServerResult, buildLocalQuestion, makeSnapshotResult, optionColorFrom, optionStageFrom } from './onboarding.js';

const ease = [0.22, 1, 0.36, 1];
const AboutScreenLazy = lazy(() => import('./screens/AboutScreen.jsx'));

const STORAGE_KEY = 'byrgop_testing_session';

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.user) return parsed;
    return null;
  } catch (_) {
    return null;
  }
}

function saveSession(session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (_) {}
}

function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
}

export default function App() {
  // ─── Auth state ─────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState(null);

  // ─── Onboarding state ───────────────────────────────────
  const [screen, setScreen] = useState('intro');
  const [beginLoading, setBeginLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [index, setIndex] = useState(0);
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const answeredRef = useRef(false);
  const sessionIdRef = useRef(null);
  // The last screen the app actually rendered. Used by the global scroll
  // reset below to detect a real navigation (screen value change).
  const prevScreenRef = useRef('intro');
  // Business type selected on the Intro screen and the three onboarding
  // questions resolved for it (from the backend onboarding config). There is
  // no local default bank — an unavailable type is gated on the Intro screen.
  const [introBusinessType, setIntroBusinessType] = useState(null);
  const [onboardingQuestions, setOnboardingQuestions] = useState([]);

  // Restore session on mount
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setIsLoggedIn(true);
      setCurrentUser(session.user);
      setIsAdmin(session.isAdmin || false);
      if (session.adminToken) setAdminToken(session.adminToken);
    }
  }, []);

  // Provide admin token to API client and handle admin auth errors
  useEffect(() => {
    setAdminTokenGetter(() => adminToken);
  }, [adminToken]);

  useEffect(() => {
    const handleError = (e) => {
      if (e?.isAdminAuthError) {
        handleLogout();
      }
    };
    window.addEventListener('unhandledrejection', handleError);
    return () => window.removeEventListener('unhandledrejection', handleError);
  }, []);

  const handleLogin = useCallback((username) => {
    setIsLoggedIn(true);
    setCurrentUser(username);
    setIsAdmin(false);
    setAdminToken(null);
    saveSession({ user: username, isAdmin: false });
    setScreen('intro');
  }, []);

  const handleAdminLogin = useCallback((token, admin) => {
    setIsLoggedIn(true);
    setCurrentUser(admin.email);
    setIsAdmin(true);
    setAdminToken(token);
    saveSession({ user: admin.email, isAdmin: true, adminToken: token });
    // Admin goes to dashboard - for now redirect to intro, but ideally to admin dashboard
    setScreen('intro');
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setIsAdmin(false);
    setAdminToken(null);
    clearSession();
    // Reset all app state
    setScreen('intro');
    setBeginLoading(false);
    setSessionId(null);
    setIndex(0);
    setQuestion(null);
    setAnswers([]);
    setResult(null);
    setError(null);
    setIntroBusinessType(null);
    setOnboardingQuestions([]);
    bg.current.sessionReady = null;
    bg.current.chain = Promise.resolve();
    // Reset KY state
    setKySessionId(null);
    setKyQuestions([]);
    setKyIndex(0);
    setKyQuestion(null);
    setKyResult(null);
    setKyBusinessType(null);
    setKyAnswers([]);
    setKySubmitting(false);
    setKyFinalizeError(false);
    setKyEmail('');
    setKyDomain(null);
    setKySelectionMode('select');
    setKyDomainNonce(0);
    kyPendingRef.current = [];
    suppressResumeRef.current = false;
    resumeCheckRanRef.current = false;
  }, []);

  // The three onboarding questions are shown straight from memory the instant
  // the user taps "Let's Begin" — nothing waits on the network. In the
  // background a real assessment session is still created and each answer
  // recorded through the same /next + /answer endpoints so admin reports keep
  // scoring and completing. The whole background write path runs on a single
  // serialized promise chain so it can never race itself.
  const bg = useRef({
    sessionReady: null,
    chain: Promise.resolve(),
  });

  // Real backend question (per category) fetched in the background the moment
  // "Let's Begin" is tapped. The option's Admin-configured stage/colour is read
  // from it so the instant snapshot already uses the selected option's real
  // colour — never a derived or hardcoded one. The backend result then replaces
  // these seeds with the authoritative value.
  const prefetchedQRef = useRef({});

  // Know Yourself state
  const [kySessionId, setKySessionId] = useState(null);
  const [kyQuestions, setKyQuestions] = useState([]);
  const [kyIndex, setKyIndex] = useState(0);
  const [kyQuestion, setKyQuestion] = useState(null);
  const [kyResult, setKyResult] = useState(null);
  // Where the Know Yourself disclaimer was opened from, so the disclaimer's
  // Go Back returns the user to that screen ('result' or 'about').
  const [kyDisclaimerOrigin, setKyDisclaimerOrigin] = useState('result');
  const [kyBusinessType, setKyBusinessType] = useState(null);
  // optionId per question index — keeps selections when navigating back.
  const [kyAnswers, setKyAnswers] = useState([]);
  const [kySubmitting, setKySubmitting] = useState(false);
  const [kyFinalizeError, setKyFinalizeError] = useState(false);
  const kyFetchingRef = useRef(false);
  const kyPendingRef = useRef([]);
  // Non-null while an unfinished assessment has been detected and the Resume
  // modal is visible for the user to Continue or Start New.
  const [kyResumeCandidate, setKyResumeCandidate] = useState(null);
  // Monotonic guard so an in-flight resume lookup never fires a stale popup
  // after the user has already started a fresh assessment.
  const kyResumeCheckRef = useRef(0);
  // Set once the user explicitly picks "Start New", so the automatic Resume
  // prompt is not re-shown for the rest of this page visit. The previous
  // in-progress assessment is left untouched in the backend (visible in Admin),
  // and a fresh page load will offer it again.
  const suppressResumeRef = useRef(false);

  // Know Yourself selections (email comes from the Disclaimer consent step)
  const [kyEmail, setKyEmail] = useState('');
  const [kyDomain, setKyDomain] = useState(null); // { slug, label }
  const [kySelectionMode, setKySelectionMode] = useState('select'); // 'select' | 'change'
  // Incremented every time the user re-enters Domain Selection, so the screen
  // always remounts fresh and never carries stale `selected` state across a
  // change-Business or change-Domain round trip.
  const [kyDomainNonce, setKyDomainNonce] = useState(0);

  // ─── Onboarding ──────────────────────────────────────────

  // Create the assessment session in the background exactly once. The promise
  // resolves to the sessionId (or null if the backend is unreachable), and the
  // UI never blocks on it.
  const startBackgroundSession = useCallback((businessTypeKey) => {
    const b = bg.current;
    if (!b.sessionReady) {
      b.sessionReady = api
        .startAssessment(
          businessTypeKey ? { businessType: businessTypeKey } : {}
        )
        .then((s) => {
          sessionIdRef.current = s.sessionId;
          setSessionId(s.sessionId);
          return s.sessionId;
        })
        .catch(() => null);
    }
    return b.sessionReady;
  }, []);

  // Fetch the three onboarding categories' real questions in the background so
  // the selected option's configured stage/colour is on hand for the instant
  // snapshot. Serialized on the same chain as the answer writes.
  const prefetchOnboardingQuestions = useCallback((questions) => {
    const b = bg.current;
    const list = questions && questions.length ? questions : [];
    b.chain = b.chain
      .catch(() => {})
      .then(async () => {
        const sid = await b.sessionReady;
        if (!sid) return;
        await Promise.all(
          list.map(async (q) => {
            try {
              const data = await api.nextQuestion(sid, q.category);
              prefetchedQRef.current[q.category] = data && data.question;
            } catch (_) {}
          })
        );
      })
      .then(() => undefined, () => undefined);
  }, []);

  // Persist one local answer on the background chain: reuse the prefetched
  // question for that category (or fetch it), match the option by its Yes/No
  // text, and submit the answer. Best-effort — a failure never disturbs the
  // visible flow.
  const persistAnswerLocal = useCallback((categoryKey, optionText) => {
    const b = bg.current;
    const run = b.chain
      .catch(() => {})
      .then(async () => {
        const sid = await b.sessionReady;
        if (!sid) return;
        let q = prefetchedQRef.current[categoryKey];
        if (!q) {
          const data = await api.nextQuestion(sid, categoryKey);
          q = data && data.question;
          if (q) prefetchedQRef.current[categoryKey] = q;
        }
        if (!q) return;
        const keyword = String(optionText).trim().toLowerCase();
        const opt = (q.options || []).find((o) =>
          String(o.text).trim().toLowerCase().startsWith(keyword)
        );
        if (!opt) return;
        await api.submitAnswer(sid, {
          questionId: q.questionId,
          optionId: opt.optionId,
          categoryKey,
        });
      })
      .catch(() => {});
    b.chain = run.then(() => undefined, () => undefined);
    return run;
  }, []);

  // After the last answer, compute the server-side result so the session is
  // marked completed (and admin reports see the scored dimensions). Resolves
  // to the backend result (each category's calculated stage/colour) or null.
  const finishBackground = useCallback(() => {
    const b = bg.current;
    const run = b.chain
      .catch(() => {})
      .then(async () => {
        const sid = await b.sessionReady;
        if (!sid) return null;
        return api.getResult(sid).catch(() => null);
      })
      .catch(() => null);
    b.chain = run.then(() => undefined, () => undefined);
    return run;
  }, []);

  // Instant: switch to the first question (in-memory) right away and kick off
  // session creation in the background. `questions` are the three resolved
  // onboarding questions the Intro screen resolved for the selected type.
  const handleBegin = useCallback(
    (key, label, questions) => {
      const qs = questions && questions.length ? questions : null;
      // The Intro screen gates on availability; guard here too so a stale
      // tap can never start a flow with no questions.
      if (!qs) return;
      setError(null);
      setBeginLoading(false);
      answeredRef.current = false;
      setAnswers([]);
      setIndex(0);
      setResult(null);
      setIntroBusinessType({ key, label });
      setOnboardingQuestions(qs);
      setQuestion(buildLocalQuestion(qs[0]));
      setScreen('question');
      startBackgroundSession(key);
      prefetchOnboardingQuestions(qs);
    },
    [startBackgroundSession, prefetchOnboardingQuestions]
  );

  // Instant: advance to the next in-memory question (or to the snapshot
  // result) the moment an option is picked. The answer is also handed to the
  // background writer.
  const handleAnswer = useCallback(
    (optionId) => {
      if (!question || answeredRef.current) return;
      answeredRef.current = true;
      const q = onboardingQuestions[index];
      const opt = (q.options || []).find((o) => o.optionId === optionId);
      if (!opt) {
        answeredRef.current = false;
        return;
      }
      // The selected option's Admin-configured stage (with its colour) comes
      // from the real backend question for that category — never a local rule.
      const entry = {
        category: q.category,
        name: q.name,
        answer: opt.optionId,
        optionText: opt.text,
        stage: optionStageFrom(prefetchedQRef.current[q.category], opt.text),
        optionColor: optionColorFrom(prefetchedQRef.current[q.category], opt.text),
      };
      const next = [...answers, entry];
      setAnswers(next);
      persistAnswerLocal(q.category, opt.text);

      if (index < onboardingQuestions.length - 1) {
        const nextIndex = index + 1;
        setIndex(nextIndex);
        answeredRef.current = false;
        setQuestion(buildLocalQuestion(onboardingQuestions[nextIndex]));
      } else {
        // Render the instant snapshot now; upgrade the donut colours to the
        // Admin-configured stage colours as soon as the backend result lands.
        const snapshot = makeSnapshotResult(next);
        setResult(snapshot);
        setScreen('result');
        finishBackground().then((server) => {
          if (server) {
            const merged = applyServerResult(snapshot, server);
            setResult(merged);
          }
        });
      }
    },
    [question, index, answers, onboardingQuestions, persistAnswerLocal, finishBackground]
  );

  // Reset onboarding state and return to landing (timer expiry or logo click)
  const handleRestartOnboarding = useCallback(() => {
    answeredRef.current = false;
    setScreen('intro');
    setSessionId(null);
    setIndex(0);
    setQuestion(null);
    setAnswers([]);
    setResult(null);
    setError(null);
    setBeginLoading(false);
    bg.current.sessionReady = null;
    bg.current.chain = Promise.resolve();
  }, []);

  // ─── Know Yourself ───────────────────────────────────────

  const fetchKYQuestion = useCallback(
    async (sid, qIndex) => {
      if (kyFetchingRef.current) return;
      kyFetchingRef.current = true;
      setError(null);
      try {
        const data = await api.kyQuestion(sid, qIndex);
        setKyQuestion(data.question);
      } catch (e) {
        setError(e.message);
      } finally {
        kyFetchingRef.current = false;
      }
    },
    []
  );

  // Start generic KY session (kept for backward compat if needed)
  const handleBeginKY = useCallback(async () => {
    setError(null);
    try {
      const session = await api.startKY();
      setKySessionId(session.sessionId);
      setKyQuestions(session.questions);
      setKyIndex(0);
      setKyQuestion(session.questions[0]);
      setScreen('kyQuestion');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  // Start (or re-start) a domain assignment. Reused both for the initial run
  // and when the user changes Business Type / Domain from the questions: the
  // previous email is preserved and a brand-new session starts.
  const restartKYAssignment = useCallback(
    async ({ bt, domain }) => {
      setError(null);
      kyResumeCheckRef.current += 1;
      setKyResumeCandidate(null);
      try {
        const session = await api.startKYAssignment({
          domain: domain?.slug,
          email: kyEmail || getSavedEmail() || undefined,
          businessType: bt?.key,
          browserId: getBrowserId(),
        });
        setKySessionId(session.sessionId);
        setKyQuestions(session.questions);
        setKyIndex(0);
        setKyQuestion(session.questions[0]);
        setKyAnswers(new Array(session.questions.length).fill(undefined));
        if (bt) setKyBusinessType(bt);
        if (domain) setKyDomain({ slug: domain.slug, label: domain.label });
        setKySelectionMode('select');
        setScreen('kyQuestion');
      } catch (e) {
        setError(e.message);
      }
    },
    [kyEmail]
  );

  // Domain chosen on the Domain Selection screen (initial or changed).
  const handleStartAssignment = useCallback(
    ({ domain }) => {
      restartKYAssignment({
        bt: kyBusinessType,
        domain: { slug: domain.slug, label: domain.name || domain.label || domain.slug },
      });
    },
    [kyBusinessType, restartKYAssignment]
  );

  // Business Type chosen. In 'change' mode the existing domain may no longer
  // be valid under the new type (domains are scoped to a business type), so
  // we preserve the request by routing through Domain Selection in change-mode
  // where the user confirms/updates a domain under the new type before the
  // assessment restarts.
  const handleBusinessTypeSelect = useCallback((key, label) => {
    const next = { key, label };
    setKyBusinessType(next);
    saveBusinessType(next);
    // The previously selected domain may not belong to the new Business Type —
    // clear it so Domain Selection starts fresh under the new type.
    setKyDomain(null);
    setKyDomainNonce((n) => n + 1);
    setScreen('kyDomainSelect');
  }, []);

  // Change actions from the questions screen.
  const handleChangeBusiness = useCallback(() => {
    setKySelectionMode('change');
    setScreen('kyBusinessType');
  }, []);

  const handleChangeDomain = useCallback(() => {
    setKySelectionMode('change');
    setKyDomainNonce((n) => n + 1);
    setScreen('kyDomainSelect');
  }, []);

  // Fetch the KY result once all background answer submissions have landed.
  const finalizeKY = useCallback(async () => {
    if (!kySessionId) return;
    setKyFinalizeError(false);
    setError(null);
    try {
      await Promise.allSettled(kyPendingRef.current);
      kyPendingRef.current = [];
      const r = await api.kyResult(kySessionId);
      setKyResult(r);
      setScreen('kyResult');
    } catch (e) {
      setKyFinalizeError(true);
      setError(e.message);
    }
  }, [kySessionId]);

  // Next / Submit Assessment: record the selection locally and advance at
  // once (all questions are already in client memory). The answer is
  // persisted server-side in the background via an index-keyed upsert, so
  // navigation back to change an answer stays safe.
  const handleKYNext = useCallback(
    async (optionId) => {
      if (!kyQuestion || !kySessionId) return;
      const qIndex = kyIndex;
      const sid = kySessionId;
      const isLast = qIndex + 1 >= kyQuestions.length;

      setKyAnswers((prev) => {
        const next = [...prev];
        next[qIndex] = optionId;
        return next;
      });

      // The caller has now made real progress in this session. If it is a new
      // session begun after rejecting an older one with "Start New", drop the
      // rejection so normal resume rules apply to THIS session going forward.
      if (getRejectedResumeSession() && sid !== getRejectedResumeSession()) {
        setRejectedResumeSession(null);
      }

      const submitPromise = api
        .submitKYAnswer(
          sid,
          optionId === NOT_APPLICABLE_VALUE
            ? { questionIndex: qIndex, isNotApplicable: true }
            : { questionIndex: qIndex, optionId }
        )
        .catch((e) => setError(e.message));
      kyPendingRef.current.push(submitPromise);

      if (isLast) {
        setScreen('kyCalculating');
        setKySubmitting(true);
        try {
          await finalizeKY();
        } finally {
          setKySubmitting(false);
        }
        return;
      }

      const nextIdx = qIndex + 1;
      setKyIndex(nextIdx);
      setKyQuestion(kyQuestions[nextIdx]);
    },
    [kyQuestion, kySessionId, kyIndex, kyQuestions, finalizeKY]
  );

  // Previous: pure client-side navigation — the stored selection is shown
  // again because it lives in kyAnswers.
  const handleKYPrevious = useCallback(() => {
    if (kySubmitting || kyIndex === 0) return;
    const prevIdx = kyIndex - 1;
    setKyIndex(prevIdx);
    setKyQuestion(kyQuestions[prevIdx]);
  }, [kyIndex, kyQuestions, kySubmitting]);

  // Look for an unfinished KY assignment for this caller (email when known,
  // otherwise the stable browser identifier) and offer to resume it. Runs
  // once per entry — never on every question/render — and never blocks the
  // normal flow when nothing is found. Suppressed after the user explicitly
  // picks "Start New" for the rest of this page visit.
  const checkForResume = useCallback(() => {
    if (suppressResumeRef.current) return;
    const rejectedSessionId = getRejectedResumeSession();
    setKyResumeCandidate(null);
    kyResumeCheckRef.current += 1;
    const checkId = kyResumeCheckRef.current;
    api
      .resumeKY({ email: getSavedEmail() || undefined, browserId: getBrowserId() })
      .then((resp) => {
        if (checkId !== kyResumeCheckRef.current) return;
        const s = resp && resp.session;
        // Only offer when there is genuinely something to resume: in-progress,
        // at least one answered question, not completed, and not a session the
        // caller explicitly rejected with "Start New" in this flow.
        if (!s || s.answeredCount <= 0 || s.answeredCount >= s.totalQuestions) return;
        if (rejectedSessionId && s.sessionId === rejectedSessionId) return;
        setKyResumeCandidate(s);
      })
      .catch(() => {});
  }, []);

  // Updated to go to disclaimer first. `origin` records the screen the
  // disclaimer was opened from, so Go Back on the disclaimer returns there.
  const handleKYExplore = useCallback(
    (origin = 'result') => {
      setKyDisclaimerOrigin(origin);
      setScreen('kyDisclaimer');
      // Reuse the previously selected Business Type (persisted alongside the
      // KY email/browser identity) so re-entering the Business tab skips the
      // Business Type selection — the in-memory state stays the single source
      // of truth, this only hydrates it on a fresh page/visit.
      setKyBusinessType(getSavedBusinessType() || null);
      setKySessionId(null);
      setKyQuestions([]);
      setKyIndex(0);
      setKyQuestion(null);
      setKyResult(null);
      setKyAnswers([]);
      setKyFinalizeError(false);
      setKyEmail('');
      setKyDomain(null);
      setKySelectionMode('select');
      setKyDomainNonce(0);
      kyPendingRef.current = [];
      checkForResume();
    },
    [checkForResume],
  );

  // Offer to resume an in-progress assessment as soon as the app loads, so a
  // returning user sees the Resume/Continue prompt immediately over the landing
  // page instead of having to repeat onboarding. Fires once — guarded against
  // React StrictMode's dev double-invoke of the mount effect so we don't issue
  // a redundant resume lookup per page load.
  const resumeCheckRanRef = useRef(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (resumeCheckRanRef.current) return;
    resumeCheckRanRef.current = true;
    checkForResume();
  }, []);

  // Resume the exact persisted session: restore questions, stored answers,
  // Business Type, Domain and jump straight to the next unanswered question.
  const applyResume = useCallback((session) => {
    setKyResumeCandidate(null);
    kyResumeCheckRef.current += 1;
    setKySessionId(session.sessionId);
    const resumedBt = { key: session.businessType, label: session.businessTypeLabel };
    setKyBusinessType(resumedBt);
    saveBusinessType(resumedBt);
    setKyDomain({ slug: session.domain, label: session.domainLabel });
    setKyQuestions(session.questions);
    setKyAnswers(session.answers);
    setKyEmail(session.email || '');
    if (session.email) saveEmail(session.email);
    setKyIndex(session.nextQuestionIndex);
    setKyQuestion(session.questions[session.nextQuestionIndex]);
    setKySelectionMode('select');
    setScreen('kyQuestion');
  }, []);

  // Logo click — reset everything and return to landing.
  const handleLogoClick = useCallback(() => {
    handleRestartOnboarding();
    handleKYExplore();
  }, [handleRestartOnboarding, handleKYExplore]);

  // Result-screen logo — return to the frontend landing page (like the main
  // logo on the other screens). Only resets the onboarding flow; the KY flow
  // and the other screens' logo behaviour are untouched.
  const handleLogoClickHome = useCallback(() => {
    handleRestartOnboarding();
  }, [handleRestartOnboarding]);

  // ─── Effects ─────────────────────────────────────────────

  // Global scroll-to-top on real navigation. Every screen in this single-page
  // flow is selected via the `screen` state, so whenever that value actually
  // changes the destination page must open at the very top — regardless of how
  // the navigation happened or which button was pressed. Same-screen
  // interactions (e.g. moving to the next/previous Know Yourself question,
  // which keeps the same `screen` value) intentionally do NOT reset scroll.
  useEffect(() => {
    if (prevScreenRef.current === screen) return;
    prevScreenRef.current = screen;
    window.scrollTo(0, 0);
    const scroller = document.scrollingElement || document.documentElement;
    scroller.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [screen]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // ─── Render ──────────────────────────────────────────────

  if (!isLoggedIn) {
    return (
      <GlobalCopyGuard>
        <div className="min-h-screen text-mist">
          <AnimatedBackground />
          <LoginScreen
            onLogin={handleLogin}
            onAdminLogin={handleAdminLogin}
            errorText={error}
          />
        </div>
      </GlobalCopyGuard>
    );
  }

  return (
    <GlobalCopyGuard>
      <div className="min-h-screen text-mist">
      <AnimatedBackground />
      <AnimatePresence mode="wait">
        {/* ── Onboarding ── */}
        {screen === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.5 }}
          >
            <IntroScreen
              onBegin={handleBegin}
              loading={beginLoading}
              errorText={error}
              initialKey={introBusinessType?.key ?? null}
            />
          </motion.div>
        )}

        {screen === 'question' && (
          <motion.div
            key="question"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.45 }}
          >
            <QuestionScreen
              question={question}
              loading={!question}
              index={index}
              total={onboardingQuestions.length}
              onAnswer={handleAnswer}
              onRestart={handleRestartOnboarding}
            />
          </motion.div>
        )}

        {screen === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ResultScreen
              result={result}
              onKY={handleKYExplore}
              onAbout={() => setScreen('about')}
              onLogoClick={handleLogoClickHome}
              onRetake={() => {
                // Reset onboarding state and go to the first question, reusing
                // the same business type and its resolved questions. A brand
                // new backend session is created (bg refs reset below) so the
                // new attempt never shares answers with the old one.
                handleRestartOnboarding();
                setTimeout(() => {
                  handleBegin(
                    introBusinessType?.key,
                    introBusinessType?.label,
                    onboardingQuestions
                  );
                }, 50);
              }}
              onLogout={handleLogout}
            />
          </motion.div>
        )}

        {/* ── Know Yourself ── */}
        {/* Disclaimer Screen - New */}
        {screen === 'kyDisclaimer' && (
          <motion.div
            key="ky-disclaimer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.05 } }}
            transition={{ duration: 0.5 }}
          >
            <DisclaimerScreen
              onAccept={({ email }) => {
                kyResumeCheckRef.current += 1;
                setKyResumeCandidate(null);
                saveEmail(email || '');
                setKyEmail(email || '');
                // A previously selected Business Type is reused: skip the
                // Business Type screen and go straight to Domain Selection
                // (filtered server-side by the selected type). Fresh visitors
                // with no prior selection keep the existing selection flow.
                setScreen(kyBusinessType ? 'kyDomainSelect' : 'kyBusinessType');
              }}
              onDecline={() => {
                setScreen(kyDisclaimerOrigin === 'about' ? 'about' : 'result');
              }}
              onLogoClick={handleLogoClick}
            />
          </motion.div>
        )}

        {screen === 'kyBusinessType' && (
          <motion.div
            key="ky-business-type"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <BusinessTypeScreen
              key={kySelectionMode === 'change' ? 'bt-change' : 'bt-select'}
              onSelect={handleBusinessTypeSelect}
              mode={kySelectionMode}
              initialKey={kyBusinessType?.key ?? null}
              onBack={() => setScreen('kyQuestion')}
              onLogoClick={handleLogoClick}
              onDecline={() => {
                // Check if result exists before navigating back
                if (result) {
                  setScreen('result');
                } else {
                  // If no result, go to intro
                  setScreen('intro');
                }
              }}
            />
          </motion.div>
        )}

        {screen === 'kyDomainSelect' && (
          <motion.div
            key="ky-domain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DomainSelectionScreen
              key={`${kySelectionMode === 'change' ? 'domain-change' : 'domain-select'}-${kyDomainNonce}`}
              businessType={kyBusinessType}
              mode={kySelectionMode}
              initialDomain={kyDomain?.slug ?? null}
              onBack={() => {
                if (kySelectionMode === 'change') setScreen('kyQuestion');
                else setScreen('kyBusinessType');
              }}
              onBegin={handleStartAssignment}
              onLogoClick={handleLogoClick}
            />
          </motion.div>
        )}

        {screen === 'kyQuestion' && kyQuestion && (
          <motion.div
            key={`ky-q-${kyIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.45 }}
          >
            <KnowYourselfScreen
              question={kyQuestion}
              answeredCount={kyAnswers.filter(Boolean).length}
              answeredHere={!!kyAnswers[kyIndex]}
              total={kyQuestions.length || 18}
              selected={kyAnswers[kyIndex] ?? null}
              onSelect={(optionId) =>
                setKyAnswers((prev) => {
                  const next = [...prev];
                  next[kyIndex] = optionId;
                  return next;
                })
              }
              onNext={handleKYNext}
              onPrevious={handleKYPrevious}
              onLogoClick={handleLogoClick}
              isFirst={kyIndex === 0}
              isLast={kyIndex === kyQuestions.length - 1}
              busy={kySubmitting}
              businessTypeLabel={kyBusinessType?.label}
              domainLabel={kyDomain?.label}
              onChangeBusiness={handleChangeBusiness}
              onChangeDomain={handleChangeDomain}
            />
          </motion.div>
        )}

        {screen === 'kyCalculating' && (
          <motion.div
            key="ky-calculating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.45 }}
            className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease }}
              className="relative flex h-20 w-20 items-center justify-center"
            >
              <div
                className="absolute inset-0 rounded-full blur-xl"
                style={{ background: `${brand.accent}22` }}
              />
              <div
                className="h-14 w-14 animate-spin rounded-full border-2"
                style={{ borderColor: 'rgba(255,255,255,0.12)', borderTopColor: brand.accent }}
              />
            </motion.div>
            <h1 className="font-display mt-8 text-3xl font-semibold text-mist sm:text-4xl">
              Calculating your result
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-mist-muted">
              Scoring your 18 responses across six business dimensions.
            </p>
            {kyFinalizeError && (
              <PrimaryButton variant="border" onClick={finalizeKY}>
                Retry
              </PrimaryButton>
            )}
          </motion.div>
        )}

        {screen === 'kyResult' && kyResult && (
          <motion.div
            key="ky-result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <KnowYourselfResult
              result={kyResult}
              sessionId={kySessionId}
              onExplore={() => setScreen('about')}
              onLogoClick={handleLogoClick}
              onLogout={handleLogout}
            />
          </motion.div>
        )}

        {/* ── About ── */}
        {screen === 'about' && (
          <motion.div
            key="about"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Lazy import - loaded from separate chunk */}
            <AboutScreenLazy
              onNavigateToLanding={handleLogoClickHome}
              onAssess={() => handleKYExplore('about')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {kyResumeCandidate && screen !== 'kyQuestion' && (
        <ResumeModal
          answeredCount={kyResumeCandidate.answeredCount}
          totalQuestions={kyResumeCandidate.totalQuestions}
          onContinue={() => applyResume(kyResumeCandidate)}
          onStartNew={() => {
            kyResumeCheckRef.current += 1;
            setKyResumeCandidate(null);
            suppressResumeRef.current = true;
            setRejectedResumeSession(kyResumeCandidate.sessionId);
          }}
        />
      )}

      <AnimatePresence>
        {error && screen !== 'intro' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-red-500/30 bg-ink-850 px-5 py-2.5 text-sm text-red-400 shadow-card"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </GlobalCopyGuard>
  );
}