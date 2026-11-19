import { useEffect, useRef, useState } from "react";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { GlossaryDrawer } from "../components/GlossaryDrawer";
import { Icon } from "../components/Icon";
import { LogoMark } from "../components/LogoMark";
import { memberNav } from "../data/nav";
import { clearFitnessStore, readFitnessStore, writeFitnessStore } from "../fitnessStore";
import type { FitnessStore } from "../fitnessStore";
import { GeneratePage } from "./GeneratePage";
import { OverviewPage } from "./OverviewPage";
import { ProfilePage } from "./ProfilePage";
import { ProgressPage } from "./ProgressPage";
import { WorkoutsPage } from "./WorkoutsPage";
import { api } from "../services/api";
import { SessionPlayer } from "../session/SessionPlayer";
import type { SignupAnswers } from "../types";

export function DashboardPage({ path, navigate, onHome, onLogout, onAccountDeleted, profile }: { path?: string; navigate: (path: string) => void; onHome: () => void; onLogout: () => void; onAccountDeleted: (browserDataCleared: boolean) => void; profile: SignupAnswers | null }) {
  const activePath = typeof path === "string" && path.length > 0 ? path : window.location.pathname || "/dashboard";
  const backendConfigured = api.isBackendConfigured();
  const [store, setStore] = useState(() => readFitnessStore(profile));
  const localStoreRef = useRef(store);
  const planRevisionRef = useRef(0);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [planSyncStatus, setPlanSyncStatus] = useState<"local" | "loading" | "saving" | "saved" | "error">(
    backendConfigured ? "loading" : "local",
  );
  const [planSyncError, setPlanSyncError] = useState("");
  const [planSyncReady, setPlanSyncReady] = useState(!backendConfigured);
  const [planDirty, setPlanDirty] = useState(false);
  const [planSyncRetry, setPlanSyncRetry] = useState(0);
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
  const [profileGlossary, setProfileGlossary] = useState<{ open: boolean; term?: string }>({ open: false });
  const update = (next: FitnessStore) => {
    try {
      const planChanged = next.plan !== localStoreRef.current.plan
        || next.challenge !== localStoreRef.current.challenge;
      if (!writeFitnessStore(next)) {
        setToast({ message: "We couldn't save that change in this browser. Check available storage and try again.", error: true });
        return false;
      }
      localStoreRef.current = next;
      setStore(next);
      if (planChanged) {
        planRevisionRef.current += 1;
        setPlanDirty(true);
      }
      return true;
    } catch {
      setToast({ message: "We couldn't save that change. Try a smaller image or free some browser storage.", error: true });
      return false;
    }
  };
  const showToast = (message: string, error = false) => {
    setToast({ message, error });
    window.setTimeout(() => setToast(null), 3200);
  };

  useEffect(() => {
    if (!backendConfigured) return;
    let active = true;
    const startingRevision = planRevisionRef.current;

    const loadSavedPlan = async () => {
      try {
        const savedPlan = await api.getSavedWorkoutPlan();
        if (!active) return;

        if (savedPlan && planRevisionRef.current === startingRevision) {
          const current = localStoreRef.current;
          const next = {
            ...current,
            challenge: {
              startDate: savedPlan.startDate,
              length: savedPlan.durationDays,
              daysPerWeek: savedPlan.daysPerWeek,
              sessionMinutes: savedPlan.sessionMinutes,
            },
            plan: savedPlan.schedule,
          };
          if (!writeFitnessStore(next)) {
            setPlanSyncStatus("error");
            setPlanSyncError("The account plan loaded, but this browser could not store its local copy.");
            return;
          }
          localStoreRef.current = next;
          setStore(next);
          setPlanSyncStatus("saved");
        } else {
          setPlanDirty(true);
          setPlanSyncStatus("saving");
        }
      } catch {
        if (!active) return;
        setPlanDirty(true);
        setPlanSyncStatus("error");
        setPlanSyncError("We couldn't load your account plan. We'll try to sync the plan stored on this device.");
      } finally {
        if (active) setPlanSyncReady(true);
      }
    };

    void loadSavedPlan();
    return () => {
      active = false;
    };
  }, [backendConfigured]);

  useEffect(() => {
    if (!backendConfigured || !planSyncReady || !planDirty) return;
    let active = true;
    const snapshot = localStoreRef.current;
    const revision = planRevisionRef.current;
    const timer = window.setTimeout(() => {
      setPlanSyncStatus("saving");
      setPlanSyncError("");
      saveQueueRef.current = saveQueueRef.current
        .catch(() => undefined)
        .then(() => api.saveWorkoutPlan({
          startDate: snapshot.challenge.startDate.slice(0, 10),
          durationDays: snapshot.challenge.length,
          daysPerWeek: snapshot.challenge.daysPerWeek,
          sessionMinutes: snapshot.challenge.sessionMinutes,
          schedule: snapshot.plan,
        }))
        .then(() => {
          if (active && planRevisionRef.current === revision) {
            setPlanDirty(false);
            setPlanSyncStatus("saved");
          }
        })
        .catch((error: unknown) => {
          if (active && planRevisionRef.current === revision) {
            setPlanSyncStatus("error");
            setPlanSyncError(error instanceof Error ? error.message : "The plan could not be synced.");
          }
        });
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [backendConfigured, planSyncReady, planDirty, planSyncRetry, store.plan, store.challenge]);

  const challengeStart = new Date(`${store.challenge.startDate}T12:00:00`);
  const challengeDay = Math.max(1, Math.min(store.challenge.length, Math.floor((Date.now() - challengeStart.getTime()) / 86_400_000) + 1));
  
  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error("Backend logout failed, clearing local session anyway:", err);
    }
    clearFitnessStore();
    onLogout();
  };

  const deleteAccount = async () => {
    const accountDataCleared = await api.deleteAccount();
    const browserDataCleared = clearFitnessStore();
    onAccountDeleted(accountDataCleared && browserDataCleared);
  };

  if (activePath.startsWith("/session/")) {
    const sessionMatch = /^\/session\/([^/]+)$/.exec(activePath);
    let sessionId: string | null = null;
    if (sessionMatch) {
      try {
        sessionId = decodeURIComponent(sessionMatch[1]);
      } catch (error) {
        if (!(error instanceof URIError)) throw error;
      }
    }
    const workout = sessionId
      ? store.plan.find((item) => item.id === sessionId)
      : undefined;
    return workout ? <><SessionPlayer workout={workout} store={store} update={update} navigate={navigate} toast={showToast} />{toast && <div className={`app-toast ${toast.error ? "error" : ""}`}>{toast.message}</div>}</> : <main className="session-player"><EmptyState title="Workout not found" copy="Return to your plan and choose another workout." /><Button onClick={() => navigate("/workouts")}>Back to workouts</Button></main>;
  }
  if (activePath !== "/dashboard" && !memberNav.some((item) => item.path === activePath)) {
    return (
      <main className="session-player">
        <EmptyState title="Page not found" copy="That page doesn't exist or may have moved." />
        <Button onClick={() => navigate("/dashboard")}>Go to dashboard</Button>
      </main>
    );
  }
  const content = activePath === "/workouts" ? <WorkoutsPage store={store} update={update} navigate={navigate} toast={showToast} />
    : activePath === "/progress" ? <ProgressPage store={store} update={update} toast={showToast} />
      : activePath === "/generate" ? <GeneratePage store={store} update={update} navigate={navigate} toast={showToast} />
        : activePath === "/profile" ? <ProfilePage store={store} update={update} toast={showToast} onLogout={logout} onDeleteAccount={deleteAccount} onOpenGlossary={(term) => setProfileGlossary({ open: true, term })} />
          : <OverviewPage store={store} navigate={navigate} />;
  return (
    <main className="dashboard-page">
      <aside className="dash-sidebar">
        <button className="brand" onClick={onHome}><LogoMark />SoferFit</button>
        <nav aria-label="Dashboard navigation">{memberNav.map((item) => <button key={item.path} className={activePath === item.path ? "active" : ""} onClick={() => navigate(item.path)}><Icon name={item.icon} /><span>{item.label}</span></button>)}</nav>
        <div className="challenge-mini"><small>{store.challenge.length}-DAY CHALLENGE</small><strong>Day {challengeDay}</strong><div><i style={{ width: `${(challengeDay / store.challenge.length) * 100}%` }} /></div><span>{Math.max(0, store.challenge.length - challengeDay)} days to go</span></div>
        <button className="sidebar-glossary" onClick={() => setProfileGlossary({ open: true })} aria-label="Open glossary"><span><Icon name="book" /></span><div><strong>Glossary</strong></div></button>
      </aside>
      <section className="dash-main">
        <div
          className={`plan-sync-banner ${planSyncStatus}`}
          role={planSyncStatus === "error" ? "alert" : "status"}
          aria-live={planSyncStatus === "error" ? "assertive" : "polite"}
        >
          <span>
            {planSyncStatus === "local" && "Demo mode: your plan is stored only in this browser, not in an account."}
            {planSyncStatus === "loading" && "Loading your saved workout plan…"}
            {planSyncStatus === "saving" && "Syncing your workout plan…"}
            {planSyncStatus === "saved" && "Your workout plan is saved to your account."}
            {planSyncStatus === "error" && `Plan sync issue: ${planSyncError}`}
          </span>
          {planSyncStatus === "error" && (
            <button type="button" onClick={() => setPlanSyncRetry((retry) => retry + 1)}>
              Retry sync
            </button>
          )}
        </div>
        {content}
      </section>
      <GlossaryDrawer open={profileGlossary.open} initialTerm={profileGlossary.term} onClose={() => setProfileGlossary({ open: false })} />
      {toast && <div className={`app-toast ${toast.error ? "error" : ""}`} role="status">{toast.message}</div>}
    </main>
  );
}