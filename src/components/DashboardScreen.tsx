import React, { useState, useEffect } from "react";
import { UserProfile, Habit, HabitLog, WeightLog, VisionBoardItem } from "../types";
import { dbService } from "../services/db";
import { logoutOfApp } from "../firebase";
import { 
  Sparkles, Calendar, BookOpen, Trash2, Dumbbell, 
  Trash, Plus, LogOut, Check, Upload, ChevronRight, Scale, BrainCircuit, Heart, MessageSquare
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from "recharts";
import { motion, AnimatePresence } from "motion/react";

interface DashboardScreenProps {
  profile: UserProfile;
  onLogout: () => void;
}

enum ActiveTab {
  DIARY = "Diary",
  HABITS = "Habits",
  VISION = "Vision",
  COACH = "Coach"
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ profile, onLogout }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.DIARY);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [visionItems, setVisionItems] = useState<VisionBoardItem[]>([]);
  
  // Interaction/UI states
  const [newWeight, setNewWeight] = useState("");
  const [isAddingWeight, setIsAddingWeight] = useState(false);

  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [newHabitCategory, setNewHabitCategory] = useState("Daily Rut");
  const [isAddingHabit, setIsAddingHabit] = useState(false);

  const [newVisionImage, setNewVisionImage] = useState<string | null>(null);
  const [newVisionCaption, setNewVisionCaption] = useState("");
  const [isAddingVision, setIsAddingVision] = useState(false);

  const [coachAdvice, setCoachAdvice] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0]; // default to Today
  });

  // Load all user database assets
  const loadData = async () => {
    try {
      const [fetchedHabits, fetchedLogs, fetchedWeights, fetchedVision] = await Promise.all([
        dbService.fetchHabits(profile.uid),
        dbService.fetchHabitLogs(profile.uid),
        dbService.fetchWeightLogs(profile.uid),
        dbService.fetchVisionLogs(profile.uid)
      ]);
      setHabits(fetchedHabits);
      setLogs(fetchedLogs);
      setWeightLogs(fetchedWeights);
      setVisionItems(fetchedVision);
    } catch (err) {
      console.error("Data fetching error:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile.uid]);

  // Handle Logout safely
  const handleLogoutAction = async () => {
    try {
      await logoutOfApp();
      onLogout();
    } catch (err) {
      console.error(err);
    }
  };

  // 1. HABITS Tab logs completions
  const isHabitCompleted = (habitId: string, date: string) => {
    return logs.some(l => l.habitId === habitId && l.date === date && l.completed);
  };

  const handleToggleHabit = async (habitId: string) => {
    const isCompleted = isHabitCompleted(habitId, selectedDate);
    const logId = `${profile.uid}_${habitId}_${selectedDate}`;
    
    if (isCompleted) {
      // Toggle to incomplete
      try {
        await dbService.deleteHabitLog(logId);
        setLogs(logs.filter(l => l.id !== logId));
      } catch (err) {
        console.error(err);
      }
    } else {
      // Toggle to completed
      const newLog: HabitLog = {
        id: logId,
        userId: profile.uid,
        habitId,
        date: selectedDate,
        completed: true,
        createdAt: new Date().toISOString()
      };
      try {
        await dbService.saveHabitLog(newLog);
        setLogs([...logs, newLog]);
        
        // Update habit current streak counter
        const targetHabit = habits.find(h => h.id === habitId);
        if (targetHabit) {
          const updatedStreak = targetHabit.streak + 1;
          await dbService.updateHabit(habitId, { streak: updatedStreak });
          setHabits(habits.map(h => h.id === habitId ? { ...h, streak: updatedStreak } : h));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    const habitDetail: Habit = {
      id: `${profile.uid}_${Date.now()}`,
      userId: profile.uid,
      title: newHabitTitle.trim(),
      category: newHabitCategory,
      isCustom: true,
      streak: 0,
      createdAt: new Date().toISOString()
    };

    try {
      await dbService.saveHabit(habitDetail);
      setHabits([...habits, habitDetail]);
      setNewHabitTitle("");
      setIsAddingHabit(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHabitAction = async (habitId: string) => {
    if (!window.confirm("Are you sure you want to delete this habit?")) return;
    try {
      await dbService.deleteHabit(habitId);
      setHabits(habits.filter(h => h.id !== habitId));
      setLogs(logs.filter(l => l.habitId !== habitId));
    } catch (err) {
      console.error(err);
    }
  };

  // 2. WEIGHT LOG Tab handlers
  const handleLogWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(newWeight);
    if (!parsed || parsed <= 0) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const logId = `${profile.uid}_weight_${Date.now()}`;
    const weightLogDetail: WeightLog = {
      id: logId,
      userId: profile.uid,
      weight: parsed,
      date: todayStr,
      createdAt: new Date().toISOString()
    };

    try {
      await dbService.saveWeightLog(weightLogDetail);
      // Remove any log with the same date first to maintain daily weights
      const filtered = weightLogs.filter(w => w.date !== todayStr);
      setWeightLogs([...filtered, weightLogDetail]);
      setNewWeight("");
      setIsAddingWeight(false);
    } catch (err) {
      console.error(err);
    }
  };

  // 3. VISION BOARD Tab handlers
  const handleVisionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 400; // compress for database limits
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        setNewVisionImage(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveVisionItem = async () => {
    if (!newVisionImage) return;

    const item: VisionBoardItem = {
      id: `${profile.uid}_vision_${Date.now()}`,
      userId: profile.uid,
      imageUrl: newVisionImage,
      caption: newVisionCaption.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    try {
      await dbService.saveVisionItem(item);
      setVisionItems([...visionItems, item]);
      setNewVisionImage(null);
      setNewVisionCaption("");
      setIsAddingVision(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVisionAction = async (itemId: string) => {
    if (!window.confirm("Remove card from your vision board?")) return;
    try {
      await dbService.deleteVisionItem(itemId);
      setVisionItems(visionItems.filter(v => v.id !== itemId));
    } catch (err) {
      console.error(err);
    }
  };

  // 4. AI COACH Advice generation proxy
  const handleTriggerCoachCall = async () => {
    setCoachLoading(true);
    setCoachAdvice(null);
    try {
      // Formulate past logs overview for Gemini analysis
      const habitsWithStats = habits.map(h => {
        const counts = logs.filter(l => l.habitId === h.id && l.completed).length;
        return {
          title: h.title,
          completedCount: counts,
          streak: h.streak
        };
      });

      const sortedWeights = [...weightLogs]
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(w => ({ date: w.date, weight: w.weight }));

      const res = await fetch("/api/gemini/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          goal: profile.goal,
          dreamSelf: profile.dreamSelf,
          habits: habitsWithStats,
          weightLogs: sortedWeights,
          currentStreak: calculateOverallStreak()
        })
      });

      const outcome = await res.json();
      setCoachAdvice(outcome.advice || "Your Coach is taking a deep breath. Try asking again in a few moments!");
    } catch (err) {
      console.error(err);
      setCoachAdvice("Failed to synchronize with AI coach. Check server configurations.");
    } finally {
      setCoachLoading(false);
    }
  };

  // Calculate General Logging Streak based on active daily habit entries
  const calculateOverallStreak = () => {
    if (logs.length === 0) return 0;
    
    // Extract unique completion dates and sort descending
    const uniqueDates = (Array.from(new Set(logs.filter(l => l.completed).map(l => l.date))) as string[])
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (uniqueDates.length === 0) return 0;

    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // If no logs today or yesterday, streak is broken
    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
      return 0;
    }

    let streak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const d1 = new Date(uniqueDates[i]);
      const d2 = new Date(uniqueDates[i + 1]);
      const diffTime = Math.abs(d1.getTime() - d2.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak++;
      } else if (diffDays > 1) {
        break; // Streak broken
      }
    }
    return streak;
  };

  // Determine Appropriate greeting based on active system time
  const getDailyGreeting = () => {
    const curHour = new Date().getHours();
    if (curHour < 12) return "Good Morning";
    if (curHour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Prepare chart metrics
  const getWeightChartData = () => {
    return [...weightLogs]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-6) // Take last 6 readings
      .map(w => ({
        date: new Date(w.date).toLocaleDateString([], { month: "short", day: "numeric" }),
        weight: w.weight
      }));
  };

  const getHabitsCompletedRatioToday = () => {
    if (habits.length === 0) return "0/0";
    const completedCount = habits.filter(h => isHabitCompleted(h.id, selectedDate)).length;
    return `${completedCount}/${habits.length}`;
  };

  return (
    <div className="flex-1 flex flex-col bg-cream overflow-hidden">
      
      {/* Top Brand Sub-Header Banner */}
      <header className="h-14 bg-white border-b border-rose-primary/10 flex items-center justify-between px-5 select-none z-20 shrink-0">
        <div className="flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-rose-primary fill-rose-primary" />
          <span className="font-display text-sm font-extrabold text-clay tracking-tight">GlowUp Diary</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadData}
            title="Refresh logs" 
            className="p-1.5 hover:bg-rose-light rounded-lg text-clay/55"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button 
            onClick={handleLogoutAction}
            title="Sign out"
            className="p-1.5 text-rose-dark hover:bg-rose-light rounded-lg"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Tab Screen Wrapper */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* TAB 1: DIARY DASHBOARD */}
        {activeTab === ActiveTab.DIARY && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Dynamic Card Segment */}
            <div className="bg-gradient-to-br from-white via-white to-rose-light p-5 rounded-3xl border border-rose-primary/10 shadow-3xs">
              <span className="text-[10px] font-bold text-clay/40 uppercase tracking-widest font-sans">
                {new Date().toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
              </span>
              <h2 className="font-display text-2xl font-bold text-clay mt-0.5">
                {getDailyGreeting()}, {profile.name}
              </h2>
              <div className="mt-3.5 bg-rose-primary/5 border border-rose-primary/10 p-3 rounded-xl flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-rose-primary shrink-0 animate-pulse" />
                <p className="text-xs text-rose-dark leading-normal">
                  Goal compass: <strong className="font-semibold text-clay">{profile.goal}</strong>
                </p>
              </div>
            </div>

            {/* Streak Counter & Milestone Box */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-rose-primary/10 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-clay/40 uppercase tracking-widest block font-sans">
                  Active Streak
                </span>
                <div className="flex items-end gap-1.5 mt-2">
                  <span className="text-3xl font-extrabold font-display text-rose-primary leading-none">
                    {calculateOverallStreak()}
                  </span>
                  <span className="text-xs text-clay/50 font-medium mb-1">days</span>
                </div>
                <span className="text-[10px] text-clay/50 mt-1 leading-tight">Keep up the daily log loop!</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-rose-primary/10 flex flex-col justify-between">
                <span className="text-[9px] font-bold text-clay/40 uppercase tracking-widest block font-sans">
                  Today's Rituals
                </span>
                <div className="flex items-end gap-1.5 mt-2">
                  <span className="text-3xl font-extrabold font-display text-lavender-dark leading-none">
                    {getHabitsCompletedRatioToday()}
                  </span>
                  <span className="text-[10px] text-clay/50 font-medium mb-1">habits</span>
                </div>
                <span className="text-[10px] text-clay/50 mt-1 leading-tight">Select below to complete.</span>
              </div>
            </div>

            {/* Dream Self Reflection Segment */}
            <div className="bg-white p-4.5 rounded-2xl border border-rose-primary/10 space-y-2">
              <h3 className="text-xs font-bold text-clay uppercase tracking-wider font-sans flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-rose-primary fill-rose-primary" />
                My Target Persona
              </h3>
              <p className="text-xs text-clay/70 italic leading-snug">
                "{profile.dreamSelf}"
              </p>
            </div>

            {/* Optional Weight Progression Charts */}
            {profile.currentWeight !== undefined && (
              <div className="bg-white p-4.5 rounded-2xl border border-rose-primary/10">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-clay uppercase tracking-wider font-sans flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-rose-primary" />
                      Weight Progress
                    </h3>
                    <p className="text-[10px] text-clay/50 mt-0.5">Target: {profile.goalWeight} kg</p>
                  </div>
                  <button 
                    onClick={() => setIsAddingWeight(true)}
                    className="px-2.5 py-1 bg-rose-primary text-white font-sans text-[10px] font-bold rounded-lg cursor-pointer"
                  >
                    Log Weight
                  </button>
                </div>

                {isAddingWeight && (
                  <form onSubmit={handleLogWeightSubmit} className="mb-4 bg-cream/50 p-3 rounded-xl border border-rose-primary/10 flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 64.2 (kg)"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      className="flex-1 bg-white px-2.5 rounded-lg text-xs outline-hidden border border-rose-primary/15 text-clay"
                      required
                    />
                    <button 
                      type="submit"
                      className="px-3 bg-rose-primary hover:bg-rose-dark text-white rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Save
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsAddingWeight(false)}
                      className="text-[10px] text-clay/60 px-1"
                    >
                      Cancel
                    </button>
                  </form>
                )}

                {weightLogs.length > 0 ? (
                  <div className="w-full h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getWeightChartData()}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8A39720" />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#2E252270" }} stroke="#2E252220" />
                        <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 9, fill: "#2E252270" }} stroke="#2E252220" />
                        <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8, borderColor: "#E8A397" }} />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#E8A397" 
                          strokeWidth={2.5} 
                          dot={{ r: 3, fill: "#E8A397" }} 
                          activeDot={{ r: 5 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-[10px] text-clay/50 py-6">No historical logs added. Tap "Log Weight" above!</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HABIT TRACKING */}
        {activeTab === ActiveTab.HABITS && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Header / Week Timeline */}
            <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-rose-primary/10">
              <div>
                <h3 className="font-display font-bold text-sm text-clay">Track My Rituals</h3>
                <span className="text-[10px] text-clay/55">Be persistent, be intentional.</span>
              </div>
              <button 
                onClick={() => setIsAddingHabit(true)}
                className="w-8 h-8 bg-rose-primary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-rose-dark transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Create Habit form inside */}
            <AnimatePresence>
              {isAddingHabit && (
                <motion.form 
                  onSubmit={handleCreateHabit}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white p-4 rounded-2xl border border-rose-primary/10 shadow-3xs space-y-3"
                >
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-clay/60 uppercase tracking-widest font-sans">
                      Aspiration Ritual Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10m Meditation, Yoga flow..."
                      value={newHabitTitle}
                      onChange={(e) => setNewHabitTitle(e.target.value)}
                      className="w-full h-10 bg-cream/35 px-3 rounded-lg border border-rose-primary/10 text-xs text-clay outline-hidden"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-clay/60 uppercase tracking-widest font-sans">
                        Theme Tag
                      </label>
                      <select 
                        value={newHabitCategory}
                        onChange={(e) => setNewHabitCategory(e.target.value)}
                        className="w-full h-10 bg-cream/35 border border-rose-primary/10 rounded-lg text-xs text-clay px-2 outline-hidden"
                      >
                        <option value="Mindfulness">Mindfulness</option>
                        <option value="Workouts">Workouts</option>
                        <option value="Nutrition">Nutrition</option>
                        <option value="Routine">Routine</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingHabit(false)} 
                      className="text-xs text-clay/60 px-2"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="h-9 px-4 bg-rose-primary text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Initialize Ritual
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Active habits list block */}
            <div className="space-y-2">
              {habits.length > 0 ? (
                habits.map((habit) => {
                  const completed = isHabitCompleted(habit.id, selectedDate);
                  return (
                    <div 
                      key={habit.id}
                      className="bg-white p-3.5 rounded-2xl border border-rose-primary/10 flex items-center justify-between shadow-4xs"
                    >
                      <button 
                        onClick={() => handleToggleHabit(habit.id)}
                        className="flex-1 flex items-center gap-3 text-left cursor-pointer select-none"
                      >
                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                          completed 
                            ? "bg-rose-primary border-rose-primary text-white scale-95 shadow-sm" 
                            : "border-rose-primary/20 bg-cream/30 hover:border-rose-primary/65"
                        }`}>
                          {completed && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="truncate">
                          <span className={`text-xs font-semibold block leading-tight ${
                            completed ? "line-through text-clay/40" : "text-clay"
                          }`}>
                            {habit.title}
                          </span>
                          <span className="text-[9px] text-clay/40 block mt-0.5 uppercase tracking-wider font-mono">
                            Streak: {habit.streak}d • {habit.category}
                          </span>
                        </div>
                      </button>

                      <button 
                        onClick={() => handleDeleteHabitAction(habit.id)}
                        className="p-1 px-1.5 hover:bg-rose-light text-rose-dark hover:text-red-700 rounded-lg shrink-0 transition-all"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 bg-white border border-dashed border-rose-primary/20 rounded-2xl p-6">
                  <Dumbbell className="w-8 h-8 text-rose-primary/30 mx-auto mb-2" />
                  <p className="text-xs text-clay/50">You don't have active habits initialized. Create one above!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: VISION BOARD */}
        {activeTab === ActiveTab.VISION && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-rose-primary/10">
              <div>
                <h3 className="font-display font-bold text-sm text-clay">Vision Core</h3>
                <span className="text-[10px] text-clay/55">Visualize and actualize your future self.</span>
              </div>
              <button 
                onClick={() => setIsAddingVision(true)}
                className="w-8 h-8 bg-rose-primary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-rose-dark transition-all"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>

            {/* Vision Board upload form */}
            <AnimatePresence>
              {isAddingVision && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white p-4 rounded-2xl border border-rose-primary/10 shadow-md space-y-3"
                >
                  <h4 className="text-xs font-bold font-sans text-clay uppercase tracking-wider">Dream Canvas Card</h4>
                  
                  {newVisionImage ? (
                    <div className="space-y-2.5">
                      <div className="relative aspect-square max-h-[140px] mx-auto bg-cream rounded-xl overflow-hidden border border-rose-primary/10">
                        <img src={newVisionImage} alt="Crop" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setNewVisionImage(null)}
                          className="absolute top-1.5 right-1.5 p-1 bg-black/80 text-white rounded-full text-[8px] font-bold"
                        >
                          Clear
                        </button>
                      </div>

                      <input 
                        type="text"
                        placeholder="Write a tiny target memo..."
                        value={newVisionCaption}
                        onChange={(e) => setNewVisionCaption(e.target.value)}
                        className="w-full h-9 bg-cream/35 px-3 rounded-lg border border-rose-primary/10 text-xs text-clay outline-hidden"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-cream rounded-xl border border-dashed border-rose-primary/20 flex flex-col items-center justify-center p-4 text-clay/50 relative cursor-pointer hover:bg-clay/5">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleVisionImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="w-6 h-6 text-rose-primary/45 mb-1.5" />
                      <span className="font-semibold text-[10px]">Upload Photo</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1 border-t border-rose-primary/5">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingVision(false)}
                      className="text-xs text-clay/60 px-1"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveVisionItem}
                      disabled={!newVisionImage}
                      className="px-3.5 h-8 bg-rose-primary hover:bg-rose-dark disabled:opacity-45 text-white font-semibold text-xs rounded-lg cursor-pointer transition-all"
                    >
                      Add Card
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Vision Board Grid representation */}
            <div className="grid grid-cols-2 gap-3.5">
              {visionItems.length > 0 ? (
                visionItems.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-white p-2.5 pb-3.5 rounded-xl border border-rose-primary/15 shadow-3xs flex flex-col space-y-2 relative group hover:rotate-1 hover:scale-102 transition-all duration-300"
                  >
                    <div className="aspect-square w-full rounded-lg bg-cream overflow-hidden relative border border-rose-primary/5">
                      <img src={item.imageUrl} alt="Target Goal" className="w-full h-full object-cover" />
                    </div>
                    {item.caption && (
                      <p className="font-sans text-[11px] font-semibold text-clay/85 italic leading-tight px-1 truncate">
                        {item.caption}
                      </p>
                    )}
                    <button 
                      onClick={() => handleDeleteVisionAction(item.id)}
                      className="absolute top-4 right-4 p-1.5 bg-white/90 hover:bg-red-50 text-rose-dark rounded-full shadow-md hover:scale-110 active:scale-95 transition-all text-xs"
                      title="Remove Target"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-10 bg-white border border-dashed border-rose-primary/20 rounded-2xl p-6">
                  <BookOpen className="w-8 h-8 text-rose-primary/30 mx-auto mb-2" />
                  <p className="text-xs text-clay/55">Vision Board has no items yet. Add something exciting to actualize!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AI COACH */}
        {activeTab === ActiveTab.COACH && (
          <div className="space-y-4 animate-fadeIn">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-light to-lavender-light p-5 rounded-3xl border border-rose-primary/10 shadow-3xs text-center space-y-2">
              <BrainCircuit className="w-9 h-9 text-rose-primary mx-auto animate-pulse" />
              <h3 className="font-display font-extrabold text-lg text-clay">GlowUp Reflection Coach</h3>
              <p className="text-[11.5px] text-clay/70 max-w-[280px] mx-auto leading-relaxed">
                Connect deeply with your metrics. Your digital advisor evaluates completions, streak momentum, and weight variations to synthesize insights.
              </p>
              <button
                onClick={handleTriggerCoachCall}
                disabled={coachLoading}
                className="inline-flex mt-2 items-center gap-1.5 px-4 h-10 bg-rose-primary hover:bg-rose-dark text-white rounded-full font-sans text-xs font-semibold cursor-pointer shadow-sm transition-all"
              >
                {coachLoading ? "Whispering Insights..." : "Generate Insights Draft"}
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* AI Response Block */}
            <div className="bg-white p-5 rounded-3xl border border-rose-primary/10 shadow-4xs overflow-x-hidden min-h-[160px] flex items-center justify-center">
              {coachLoading ? (
                <div className="text-center py-6 space-y-3.5 select-none animate-pulse">
                  <div className="flex justify-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-rose-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2.5 h-2.5 bg-lavender-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2.5 h-2.5 bg-rose-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <p className="text-[11px] text-clay/45 uppercase tracking-widest font-mono">
                    Interrogating progress log metrics...
                  </p>
                </div>
              ) : coachAdvice ? (
                <div className="w-full text-left prose prose-stone text-xs leading-relaxed space-y-3 select-text max-w-none text-clay/90">
                  {/* Simplistic safe inner Markdown formatter */}
                  <div className="whitespace-pre-line font-sans prose-xs leading-normal">
                    {coachAdvice}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-clay/55">
                  <MessageSquare className="w-6 h-6 text-rose-primary/35 mx-auto mb-2" />
                  <p className="text-xs">No analysis has been triggered. Click "Generate Insights Draft" above to load AI advice.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* FIXED PREMIUM BOTTOM NAVIGATION BAR */}
      <footer className="h-16 bg-white border-t border-rose-primary/10 px-4 flex items-center justify-around select-none shrink-0 z-25">
        <button 
          onClick={() => setActiveTab(ActiveTab.DIARY)}
          className={`flex flex-col items-center gap-1 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all ${
            activeTab === ActiveTab.DIARY ? "text-rose-primary scale-102 font-bold" : "text-clay/55 hover:text-clay"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[9.5px]">Diary</span>
        </button>

        <button 
          onClick={() => setActiveTab(ActiveTab.HABITS)}
          className={`flex flex-col items-center gap-1 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all ${
            activeTab === ActiveTab.HABITS ? "text-rose-primary scale-102 font-bold" : "text-clay/55 hover:text-clay"
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span className="text-[9.5px]">Rituals</span>
        </button>

        <button 
          onClick={() => setActiveTab(ActiveTab.VISION)}
          className={`flex flex-col items-center gap-1 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all ${
            activeTab === ActiveTab.VISION ? "text-rose-primary scale-102 font-bold" : "text-clay/55 hover:text-clay"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[9.5px]">Vision</span>
        </button>

        <button 
          onClick={() => setActiveTab(ActiveTab.COACH)}
          className={`flex flex-col items-center gap-1 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all ${
            activeTab === ActiveTab.COACH ? "text-rose-primary scale-102 font-bold" : "text-clay/55 hover:text-clay"
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          <span className="text-[9.5px]">Coach</span>
        </button>
      </footer>

    </div>
  );
};
