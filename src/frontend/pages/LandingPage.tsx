import type { Dispatch, ReactNode, SetStateAction } from "react";
import welcomeImage from "../assets/welcome-training.png";
import { BodyMap } from "../components/BodyMap";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { InfoTip } from "../components/InfoTip";
import { LogoMark } from "../components/LogoMark";
import { ReviewCarousel } from "../components/ReviewCarousel";
import { clearFitnessStore } from "../fitnessStore";
import { api } from "../services/api";
import type { Gender, Orientation, SignupAnswers, TrainingMode } from "../types";
import type { useExplorer } from "../hooks/useExplorer";

type LandingPageProps = {
  isSignedIn: boolean;
  memberProfile: SignupAnswers | null;
  showProfileMenu: boolean;
  setShowProfileMenu: Dispatch<SetStateAction<boolean>>;
  setShowLogin: Dispatch<SetStateAction<boolean>>;
  setShowSignup: Dispatch<SetStateAction<boolean>>;
  setMemberProfile: Dispatch<SetStateAction<SignupAnswers | null>>;
  setIsSignedIn: Dispatch<SetStateAction<boolean>>;
  setAppToast: Dispatch<SetStateAction<string | null>>;
  navigate: (path: string, replace?: boolean) => void;
  openGlossary: (term?: string) => void;
  explorer: ReturnType<typeof useExplorer>;
  children?: ReactNode;
};

export function LandingPage({
  isSignedIn,
  memberProfile,
  showProfileMenu,
  setShowProfileMenu,
  setShowLogin,
  setShowSignup,
  setMemberProfile,
  setIsSignedIn,
  setAppToast,
  navigate,
  openGlossary,
  explorer,
  children,
}: LandingPageProps) {
  const {
    gender,
    setGender,
    orientation,
    setOrientation,
    selected,
    fullBody,
    mode,
    equipment,
    routineState,
    setRoutineState,
    loadingMessage,
    explorerAge,
    setExplorerAge,
    explorerHeight,
    setExplorerHeight,
    explorerWeight,
    setExplorerWeight,
    focusArea,
    list,
    metricErrors,
    selectMuscle,
    selectFullBody,
    updateMode,
    updateEquipment,
  } = explorer;

  return (
    <main className="landing-page">
      <nav className="nav shell">
        <button className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <LogoMark />
          SoferFit
        </button>
        <div className="nav-links">
          <a href="#features">How it works</a>
          <a href="#challenge">Challenge</a>
          <a href="#explore">Explore</a>
        </div>
        {isSignedIn ? <div className="member-menu-wrap">
          <button className="member-menu-trigger" onClick={() => setShowProfileMenu((current) => !current)} aria-expanded={showProfileMenu}>
            <span>{memberProfile?.avatarUrl ? <img src={memberProfile.avatarUrl} alt="" /> : memberProfile?.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SF"}</span>
            <strong>{memberProfile?.name.split(/\s+/)[0] || "Member"}</strong>
          </button>
          {showProfileMenu && <div className="member-menu"><button onClick={() => navigate("/dashboard")}>Dashboard</button><button onClick={async () => { await api.logout(); clearFitnessStore(); setMemberProfile(null); setIsSignedIn(false); setShowProfileMenu(false); setAppToast("You've been logged out."); }}>Log out</button></div>}
        </div> : <div className="nav-auth">
          <button className="login-link" onClick={() => setShowLogin(true)}>Log in</button>
          <Button variant="dark" onClick={() => setShowSignup(true)}>Sign up</Button>
        </div>}
      </nav>

      <section className="hero shell">
        <div className="hero-copy">
          <h1>Your body.<br />Your goals.</h1>
          <p>Adaptive training tailored to your body type, designed for weight management, and structured 60–90 day challenges.</p>
          <ReviewCarousel />
          <div className="hero-trust-actions">
            <div className="trust-row">
              <div className="avatars"><span>J</span><span>M</span><span>A</span></div>
              <div className="rating"><Icon name="star" /><strong>4.9/5</strong></div>
            </div>
            <div className="hero-actions">
              <Button className="hero-explore" onClick={() => document.querySelector("#explore")?.scrollIntoView({ behavior: "smooth" })}>
                Build Your Routine <Icon name="arrow" />
              </Button>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <img className="welcome-image" src={welcomeImage} alt="Athlete training in a green outdoor setting" />
          <div className="float-card workout-card">
            <span className="card-icon"><Icon name="bolt" /></span>
            <div><small>TODAY'S FOCUS</small><strong>Upper body + core</strong></div>
          </div>
          <div className="float-card progress-card">
            <div className="progress-ring">32%</div>
            <div><small>TRACK PROGRESS</small><strong>Visualize accomplishments</strong></div>
          </div>
          <div className="float-card plan-card">
            <span className="card-icon"><Icon name="spark" /></span>
            <div><small>SMART PLANNING</small><strong>Adapts to you</strong></div>
          </div>
          <div className="float-card coach-card">
            <span className="card-icon"><Icon name="check" /></span>
            <div><small>GUIDED WORKOUT</small><strong>Cues + rest timer</strong></div>
          </div>
        </div>
      </section>

      <div className="metric-strip">
        <div><strong>100%</strong><span>FREE</span></div>
        <div><strong>60–90</strong><span>DAY CHALLENGE</span></div>
        <div><strong className="metric-ai"><Icon name="spark" /></strong><span>GENERATE WORKOUTS</span></div>
        <div><strong>∞</strong><span>WAYS TO PROGRESS</span></div>
      </div>

      <section className="features shell" id="features">
        <div className="section-heading centered">
          <div className="eyebrow">MORE THAN A WORKOUT WEBSITE</div>
          <h2>Everything you need to<br /><em>keep showing up.</em></h2>
        </div>
        <div className="feature-grid">
          <article><div className="feature-icon feature-icon-violet"><Icon name="spark" /></div><h3>AI-made for you</h3><p>Plans are made based on your body type, equipment access, and fat-reduction goals.</p></article>
          <article><div className="feature-icon feature-icon-violet"><Icon name="calendar" /></div><h3>Progress, made visible</h3><p>A calendar heatmap, active workouts, streaks, and meaningful stats in one view.</p></article>
          <article><div className="feature-icon feature-icon-violet"><Icon name="bolt" /></div><h3>Encouragement</h3><p>Step-by-step guidance, active countdown timers, set/rep counters, and real-time encouragement.</p></article>
        </div>
      </section>

      <section className="challenge" id="challenge">
        <div className="shell">
          <div className="challenge-copy">
            <h2>One challenge.<br /><em>Built around you.</em></h2>
            <p>Tell us your starting point, schedule, equipment, and goal. SoferFit shapes every session—and adapts to you.</p>
            <ul>
              <li><Icon name="check" /> Choose a 60 or 90-day roadmap</li>
              <li><Icon name="check" /> Smart recovery and session adjustments</li>
              <li><Icon name="check" /> Encouragement exactly when you need it</li>
            </ul>
          </div>
          <div className="dashboard-card">
            <div className="dash-top"><div><small>GOOD MORNING, KENNETH</small><h3>Keep your rhythm! 🌞</h3></div><span>DAY 24 / 90</span></div>
            <div className="calendar">
              <div className="calendar-head"><strong>SEPTEMBER</strong><span>3 week streak 🔥</span></div>
              <div className="week days"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
              {[0, 1, 2, 3].map((week) => (
                <div className="week" key={week}>
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                    const num = week * 7 + day;
                    const dayClass = num <= 23
                      ? "done"
                      : num === 24
                        ? "today"
                        : num >= 25
                          ? "blue-day"
                          : "";
                    return <span key={day} className={dayClass}>{num}</span>;
                  })}
                </div>
              ))}
            </div>
            <div className="dash-stats">
              <div><span className="mini-icon"><Icon name="calendar" /></span><small>CHALLENGE</small><strong>Day 24 <i>/ 60</i></strong></div>
              <div><span className="mini-icon lime"><Icon name="chart" /></span><small>TARGET PROGRESS</small><strong>32%</strong></div>
              <div><span className="mini-icon peach"><Icon name="bolt" /></span><small>ACTIVE TIME</small><strong>16.4h</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section className="explorer shell" id="explore">
        <div className="section-heading">
          <h2>Select Your Focus Area.<br /><em>Build Your Routine.</em></h2>
          <p>Choose the area you want to tone or target for fat reduction.</p>
        </div>
        <div className="explorer-grid">
          <div className="map-panel">
            <BodyMap gender={gender} orientation={orientation} selected={selected} fullBody={fullBody} disabled={routineState !== "idle"} onSelect={selectMuscle} />
          </div>
          <div className="exercise-panel">
            {routineState === "idle" && (
              <div className="routine-state routine-idle" key="idle">
                <div className="routine-state-head">
                  <small>YOUR ROUTINE</small>
                  <h3>{focusArea ?? "No focus area selected"}</h3>
                </div>
                <div className="routine-state-scroll">
                  <div className="routine-controls">
                    <div className="control-row focus-orientation-row">
                      <div className="filter-group">
                        <small>FOCUS AREA</small>
                        <div className="filter-pills"><button className={fullBody ? "active" : ""} onClick={selectFullBody}>Full Body</button></div>
                      </div>
                      <div className="filter-group">
                        <small>ORIENTATION</small>
                        <div className="filter-pills">
                          {(["Front", "Back"] as Orientation[]).map((item) => (
                            <button key={item} className={orientation === item ? "active" : ""} onClick={() => setOrientation(item)}>{item}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="control-row model-metrics-row">
                      <div className="filter-group">
                        <small>MODEL</small>
                        <div className="filter-pills">
                          {(["Man", "Woman"] as Gender[]).map((item) => (
                            <button key={item} className={gender === item ? "active" : ""} onClick={() => setGender(item)}>{item}</button>
                          ))}
                        </div>
                      </div>
                      <div className="metric-inputs">
                        <label>Age<input type="number" min="10" max="100" value={explorerAge} onChange={(event) => setExplorerAge(event.target.value)} placeholder="24" />{metricErrors.age && <small>{metricErrors.age}</small>}</label>
                        <label>Height<input type="number" min="100" max="250" value={explorerHeight} onChange={(event) => setExplorerHeight(event.target.value)} placeholder="175 cm" />{metricErrors.height && <small>{metricErrors.height}</small>}</label>
                        <label>Weight<input type="number" min="25" max="300" value={explorerWeight} onChange={(event) => setExplorerWeight(event.target.value)} placeholder="70 kg" />{metricErrors.weight && <small>{metricErrors.weight}</small>}</label>
                      </div>
                    </div>
                    <div className="filter-group">
                      <small className="label-with-info">TRAINING <InfoTip term="Training" definition="Defines routine intensity and rep schemes." actionLabel="View Glossary" showTerm={false} onLearnMore={() => openGlossary("Fat Loss & Cardio")} /></small>
                      <div className="filter-pills">
                        {(["Fat Loss & Cardio", "HIIT", "Muscle & Strength"] as TrainingMode[]).map((item) => (
                          <button key={item} className={mode === item ? "active" : ""} onClick={() => updateMode(item)}>{item}</button>
                        ))}
                      </div>
                    </div>
                    <div className="filter-group">
                      <small className="label-with-info">EQUIPMENT <InfoTip term="Equipment" definition="Choose whether your routine should use only your body weight or common gym equipment." actionLabel="View Glossary" onLearnMore={() => openGlossary("Bodyweight")} /></small>
                      <div className="filter-pills">
                        <button className={equipment === "No Equipment / Bodyweight" ? "active" : ""} onClick={() => updateEquipment("No Equipment / Bodyweight")}>Bodyweight / Home</button>
                        <button className={equipment === "Gym Equipment" ? "active" : ""} onClick={() => updateEquipment("Gym Equipment")}>Gym Equipment</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="routine-state-action">
                  <Button disabled={!focusArea || !mode || !equipment} onClick={() => setRoutineState("loading")}>Generate workout routine </Button>
                  <small>AI generation is limited, use wisely.</small>
                </div>
              </div>
            )}

            {routineState === "loading" && (
              <div className="routine-state routine-loading" key="loading" aria-live="polite">
                <div className="loading-copy">
                  <span className="generation-spinner" />
                  <strong>{loadingMessage === 0 ? "Analyzing body focus and target metrics..." : "Balancing rep schemes, equipment, and rest intervals..."}</strong>
                </div>
                <div className="skeleton-list" aria-hidden="true">
                  {[0, 1, 2].map((item) => <div key={item}><i /><span><i /><i /></span></div>)}
                </div>
              </div>
            )}

            {routineState === "results" && (
              <div className="routine-state routine-results" key="results">
                <div className="routine-results-head">
                  <div><h3>Your Generated Routine</h3></div>
                  <div><span>{focusArea}</span><span>{mode}</span></div>
                </div>
                <div className="routine-state-scroll result-list">
                  {list.map((exercise) => (
                    <article className="result-card" key={exercise.name}>
                      <span className="dumbbell-icon"><Icon name="dumbbell" /></span>
                      <span className="exercise-name"><strong>{exercise.name}</strong><small>{exercise.reps}</small></span>
                      <span className="muscle-tag">{exercise.tag}</span>
                    </article>
                  ))}
                </div>
                <div className="routine-result-action">
                  <div className="save-routine-banner">
                    <strong>Save this routine and start your 60–90 day transformation challenge!</strong>
                    <Button onClick={() => setShowSignup(true)}>Create Profile</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer>
        <div className="shell footer-divider" />
        <div className="shell footer-bottom">
          <p>© 2026 SoferFit. All rights reserved.</p>
          <nav aria-label="Legal links">
            <button className="footer-glossary" onClick={() => openGlossary()}> Glossary</button>
            <a href="#privacy-policy">Privacy Policy</a>
            <a href="#terms-of-service">Terms of Service</a>
            <a href="#cookies">Cookies</a>
          </nav>
        </div>
      </footer>
      {children}
    </main>
  );
}
