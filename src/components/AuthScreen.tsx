import React, { useState } from "react";
import { signInWithGoogle, auth } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { Sparkles, Mail, Heart, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEmailFormOpen, setIsEmailFormOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        onAuthSuccess(user);
      }
    } catch (err: any) {
      console.error(err);
      setError("Google connection closed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        onAuthSuccess(credential.user);
      } else {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess(credential.user);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email address or passcode.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Email already in use. Try signing in instead!");
      } else if (err.code === "auth/weak-password") {
        setError("Passcode should be at least 6 characters.");
      } else {
        setError(err.message || "Authentication failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-cream flex flex-col justify-between p-8 relative overflow-hidden select-none">
      {/* Immersive Calming Moving Background Bubbles */}
      <div className="absolute top-[10%] left-[-20%] w-[260px] h-[260px] rounded-full bg-rose-primary/10 blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[20%] right-[-20%] w-[280px] h-[280px] rounded-full bg-lavender-primary/15 blur-3xl pointer-events-none animate-pulse"></div>
      
      {/* Premium Header Decoration */}
      <div className="flex justify-center pt-8">
        <div className="w-12 h-12 rounded-full bg-rose-light flex items-center justify-center border border-rose-primary/10 shadow-sm animate-bounce">
          <Heart className="w-5 h-5 text-rose-primary" />
        </div>
      </div>

      {/* Main Core Tagline & Identity */}
      <div className="flex-1 flex flex-col justify-center text-center py-6">
        <h1 className="font-display text-[38px] font-extrabold tracking-tight text-clay leading-tight mb-3">
          GlowUp Diary
        </h1>
        <p className="font-sans text-sm text-clay/70 max-w-[260px] mx-auto leading-relaxed">
          Become the version of you that you've always dreamed of.
        </p>
      </div>

      {/* Primary Interaction Buttons Block */}
      <div className="space-y-4 pb-4">
        {error && (
          <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 text-center animate-shake leading-snug">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {!isEmailFormOpen ? (
            <motion.div
              key="auth-choices"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-3"
            >
              {/* Continue with Google */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-13 rounded-2xl bg-white border border-rose-primary/25 hover:border-rose-primary flex items-center justify-center gap-3 font-sans text-sm font-semibold text-clay shadow-xs hover:shadow-md transition-all duration-300 pointer-events-auto"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.727 5.727 0 0 1 8.24 12.8a5.727 5.727 0 0 1 5.751-5.714c1.558 0 2.977.604 4.049 1.583l3.056-2.977C19.141 3.822 16.512 2.8 13.99 2.8c-5.59 0-10.12 4.48-10.12 10s4.53 10 10.12 10c5.033 0 9.255-3.511 9.873-8.514H12.24z"
                  />
                </svg>
                Continue with Google
              </button>

              {/* Continue with Email */}
              <button
                onClick={() => setIsEmailFormOpen(true)}
                disabled={loading}
                className="w-full h-13 rounded-2xl bg-lavender-light border border-lavender-primary/25 hover:border-lavender-primary flex items-center justify-center gap-3 font-sans text-sm font-semibold text-lavender-dark shadow-2xs hover:shadow-sm transition-all duration-300"
              >
                <Mail className="w-4 h-4 text-lavender-dark" />
                Continue with Email
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="email-form"
              onSubmit={handleEmailSubmit}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white p-5 rounded-3xl border border-rose-primary/10 shadow-md space-y-4"
            >
              <div className="flex justify-between items-center pb-1">
                <span className="font-display text-sm font-bold text-clay">
                  {isSignUp ? "Create Wellness Journey" : "Continue with Email"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEmailFormOpen(false)}
                  className="font-sans text-xs text-rose-dark hover:underline"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-clay/60 uppercase tracking-wider block">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@glow.com"
                  className="w-full h-11 bg-cream/50 px-4 rounded-xl border border-rose-primary/10 focus:border-rose-primary outline-hidden font-sans text-sm text-clay"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-clay/60 uppercase tracking-wider block">
                  Wellness Passcode
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 bg-cream/50 px-4 rounded-xl border border-rose-primary/10 focus:border-rose-primary outline-hidden font-sans text-sm text-clay"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-rose-primary hover:bg-rose-dark text-white rounded-xl shadow-xs text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
              >
                {loading ? "Aligning Energy..." : isSignUp ? "Sign Up" : "Sign In"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="font-sans text-xs text-clay/60 hover:text-rose-dark underline"
                >
                  {isSignUp ? "Already have an account? Sign in" : "New to GlowUp? Create account"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="text-center text-[10px] text-clay/40 pt-4 px-6 flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-rose-primary/50" />
          Securely logged into your private diary dashboard.
        </div>
      </div>
    </div>
  );
};
