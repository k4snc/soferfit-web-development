import { useState } from "react";
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

export function DashboardPage({ path, navigate, onHome, onLogout, profile }: { path?: string; navigate: (path: string) => void; onHome: () => void; onLogout: () => void; profile: SignupAnswers | null }) {
  const activePath = typeof path === "string" && path.length > 0 ? path : window.location.pathname || "/dashboard";
  const [store, setStore] = useState(() => readFitnessStore(profile));
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
  const [profileGlossary, setProfileGlossary] = useState<{ open: boolean; term?: string }>({ open: false });
  const update = (next: FitnessStore) => {
    try {
      writeFitnessStore(next);
      setStore(next);
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
  const challengeStart = new Date(`${store.challenge.startDate}T12:00:00`);
  const challengeDay = Math.max(1, Math.min(store.challenge.length, Math.floor((Date.now() - challengeStart.getTime()) / 86_400_000) + 1));
  const logout = async () => {
    await api.logout();
    clearFitnessStore();
    onLogout();
  };
  if (activePath.startsWith("/session/")) {
    const workout = store.plan.find((item) => item.id === decodeURIComponent(activePath.split("/").pop() || ""));
    return workout ? <><SessionPlayer workout={workout} store={store} update={update} navigate={navigate} toast={showToast} />{toast && <div className={`app-toast ${toast.error ? "error" : ""}`}>{toast.message}</div>}</> : <main className="session-player"><EmptyState title="Workout not found" copy="Return to your plan and choose another workout." /><Button onClick={() => navigate("/workouts")}>Back to workouts</Button></main>;
  }
  const content = activePath === "/workouts" ? <WorkoutsPage store={store} update={update} navigate={navigate} toast={showToast} />
    : activePath === "/progress" ? <ProgressPage store={store} update={update} toast={showToast} />
      : activePath === "/generate" ? <GeneratePage store={store} update={update} navigate={navigate} toast={showToast} />
        : activePath === "/profile" ? <ProfilePage store={store} update={update} toast={showToast} onLogout={logout} onOpenGlossary={(term) => setProfileGlossary({ open: true, term })} />
          : <OverviewPage store={store} navigate={navigate} />;
  return (
    <main className="dashboard-page">
      <aside className="dash-sidebar">
        <button className="brand" onClick={onHome}><LogoMark />SoferFit</button>
        <nav aria-label="Dashboard navigation">{memberNav.map((item) => <button key={item.path} className={activePath === item.path ? "active" : ""} onClick={() => navigate(item.path)}><Icon name={item.icon} /><span>{item.label}</span></button>)}</nav>
        <div className="challenge-mini"><small>{store.challenge.length}-DAY CHALLENGE</small><strong>Day {challengeDay}</strong><div><i style={{ width: `${(challengeDay / store.challenge.length) * 100}%` }} /></div><span>{Math.max(0, store.challenge.length - challengeDay)} days to go</span></div>
        <button className="sidebar-glossary" onClick={() => setProfileGlossary({ open: true })} aria-label="Open glossary"><span><Icon name="book" /></span><div><strong>Glossary</strong></div></button>
      </aside>
      <section className="dash-main">{content}</section>
      <GlossaryDrawer open={profileGlossary.open} initialTerm={profileGlossary.term} onClose={() => setProfileGlossary({ open: false })} />
      {toast && <div className={`app-toast ${toast.error ? "error" : ""}`} role="status">{toast.message}</div>}
    </main>
  );
}
