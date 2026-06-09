import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "./firebase";
import { dbService } from "./services/db";
import { UserProfile } from "./types";
import { PhoneContainer } from "./components/PhoneContainer";
import { AuthScreen } from "./components/AuthScreen";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { DashboardScreen } from "./components/DashboardScreen";
import { Heart, Sparkles } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Bind Firebase user lifecycle triggers
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setLoadingProfile(true);
        try {
          const userProfile = await dbService.fetchProfile(user.uid);
          if (userProfile && userProfile.completedOnboarding) {
            setProfile(userProfile);
          } else {
            setProfile(null);
          }
        } catch (err) {
          console.error("Error checking onboarding profile status:", err);
        } finally {
          setLoadingProfile(false);
        }
      } else {
        setProfile(null);
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Post Login routing handler
  const handleAuthSuccess = async (user: FirebaseUser) => {
    setCurrentUser(user);
    setLoadingProfile(true);
    try {
      const userProfile = await dbService.fetchProfile(user.uid);
      if (userProfile && userProfile.completedOnboarding) {
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("Failed fetching account data:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
  };

  const handleLogoutSuccess = () => {
    setCurrentUser(null);
    setProfile(null);
  };

  return (
    <PhoneContainer>
      {checkingAuth || loadingProfile ? (
        <div id="loading-state" className="flex-1 bg-cream flex flex-col justify-center items-center py-12 select-none">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full border-4 border-rose-primary/25 border-t-rose-primary animate-spin"></div>
            <Heart className="w-6 h-6 text-rose-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fill-rose-primary/30 animate-pulse" />
          </div>
          <h1 className="font-display font-bold text-lg text-clay">GlowUp Diary</h1>
          <p className="text-[11px] text-clay/45 mt-1 uppercase tracking-widest font-mono flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-rose-primary animate-spin" />
            Seeking inner alignment...
          </p>
        </div>
      ) : !currentUser ? (
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      ) : !profile ? (
        <OnboardingScreen user={currentUser} onOnboardingComplete={handleOnboardingComplete} />
      ) : (
        <DashboardScreen profile={profile} onLogout={handleLogoutSuccess} />
      )}
    </PhoneContainer>
  );
}
