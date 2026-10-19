import { useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/react"
import { GlossaryDrawer } from "./components/GlossaryDrawer"
import {
  clearFitnessStore,
  readFitnessStore,
  writeFitnessStore,
} from "./fitnessStore"
import { LoginModal } from "./modals/LoginModal"
import { SignupModal } from "./modals/SignupModal"
import { DashboardPage } from "./pages/DashboardPage"
import type { SignupAnswers } from "./types"
import { LandingPage } from "./pages/LandingPage"
import { useExplorer } from "./hooks/useExplorer"

function App() {
  const explorer = useExplorer()
  const {
    focusArea,
    mode,
    equipment,
    explorerAge,
    explorerHeight,
    explorerWeight,
  } = explorer
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [showGlossary, setShowGlossary] = useState(false)
  const [glossaryTerm, setGlossaryTerm] = useState<string>()
  const [memberProfile, setMemberProfile] = useState<SignupAnswers | null>(null)
  const [isSignedIn, setIsSignedIn] = useState(() =>
    Boolean(localStorage.getItem("soferfit-member")),
  )
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [path, setPath] = useState(window.location.pathname)
  const [view, setView] = useState<"home" | "dashboard">(() =>
    window.location.pathname === "/" ? "home" : "dashboard",
  )
  const [appToast, setAppToast] = useState<string | null>(null)

  const navigate = (nextPath: string, replace = false) => {
    if (replace) window.history.replaceState({}, "", nextPath)
    else window.history.pushState({}, "", nextPath)
    setPath(nextPath)
    setView(nextPath === "/" ? "home" : "dashboard")
    window.scrollTo({ top: 0 })
  }

  useEffect(() => {
    const onPopState = () => {
      const nextPath = window.location.pathname
      setPath(nextPath)
      setView(nextPath === "/" ? "home" : "dashboard")
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  useEffect(() => {
    if (path !== "/" && !isSignedIn) navigate("/", true)
  }, [isSignedIn, path])

  useEffect(() => {
    if (!appToast) return
    const timer = window.setTimeout(() => setAppToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [appToast])

  const openGlossary = (term?: string) => {
    setGlossaryTerm(term)
    setShowGlossary(true)
  }

  if (view === "dashboard" && isSignedIn)
    return (
      <>
        <DashboardPage
          path={path}
          navigate={navigate}
          profile={memberProfile}
          onHome={() => navigate("/")}
          onLogout={() => {
            setMemberProfile(null)
            setIsSignedIn(false)
            setAppToast("You've been logged out.")
            navigate("/", true)
          }}
        />
        <Analytics />
      </>
    )

  return (
    <LandingPage
      isSignedIn={isSignedIn}
      memberProfile={memberProfile}
      showProfileMenu={showProfileMenu}
      setShowProfileMenu={setShowProfileMenu}
      setShowLogin={setShowLogin}
      setShowSignup={setShowSignup}
      setMemberProfile={setMemberProfile}
      setIsSignedIn={setIsSignedIn}
      setAppToast={setAppToast}
      navigate={navigate}
      openGlossary={openGlossary}
      explorer={explorer}
    >
      <GlossaryDrawer
        open={showGlossary}
        initialTerm={glossaryTerm}
        onClose={() => setShowGlossary(false)}
      />
      <LoginModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onSignup={() => {
          setShowLogin(false)
          setShowSignup(true)
        }}
        onSuccess={() => {
          setShowLogin(false)
          setIsSignedIn(true)
          if (!localStorage.getItem("soferfit-member"))
            localStorage.setItem(
              "soferfit-member",
              JSON.stringify({
                id: crypto.randomUUID(),
                email: "member@soferfit.local",
                createdAt: new Date().toISOString(),
              }),
            )
          navigate("/dashboard")
        }}
      />
      <SignupModal
        open={showSignup}
        initialAnswers={{
          name: "",
          email: "",
          password: "",
          avatarUrl: "",
          unitSystem: "metric",
          focusArea: focusArea ?? "Full Body",
          mode,
          equipment,
          age: explorerAge,
          height: explorerHeight,
          weight: explorerWeight,
          somatotype: "",
          goal:
            mode === "Muscle & Strength"
              ? "Build Muscle & Strength"
              : mode === "Fat Loss & Cardio"
                ? "Lose Fat & Get Lean"
                : "Body Recomposition",
          experience: "",
          activity: "",
          targetWeight: "",
          targetTimeline: "By day 60",
          availableEquipment:
            equipment === "Gym Equipment"
              ? "Full Gym Access"
              : "Bodyweight / Home Only",
          hasCondition: false,
          challengeDays: null,
          workoutDays: null,
          sessionMinutes: null,
          sessionChoice: "",
          customSessionMinutes: "",
          challengeStartDate: "",
        }}
        onClose={() => setShowSignup(false)}
        onLogin={() => {
          setShowSignup(false)
          setShowLogin(true)
        }}
        onOpenGlossary={openGlossary}
        onComplete={(profile) => {
          const completeProfile = {
            ...profile,
            challengeStartDate: new Date().toISOString(),
          }
          setMemberProfile(completeProfile)
          localStorage.setItem(
            "soferfit-member",
            JSON.stringify({
              id: crypto.randomUUID(),
              email: profile.email,
              createdAt: new Date().toISOString(),
            }),
          )
          clearFitnessStore()
          writeFitnessStore(readFitnessStore(completeProfile))
          setIsSignedIn(true)
          setShowSignup(false)
          navigate("/dashboard")
        }}
      />
      {appToast && (
        <div className="app-toast" role="status">
          {appToast}
        </div>
      )}
      <Analytics />
    </LandingPage>
  )
}

export default App
