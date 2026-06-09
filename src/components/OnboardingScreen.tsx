import React, { useState } from "react";
import { UserProfile, Habit, VisionBoardItem, WeightLog } from "../types";
import { dbService } from "../services/db";
import { 
  Dumbbell, Sparkles, User, Target, Scale, 
  BookOpen, Plus, Camera, ArrowRight, ArrowLeft, Check, Compass 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface OnboardingScreenProps {
  user: any;
  onOnboardingComplete: (profile: UserProfile) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ user, onOnboardingComplete }) => {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("Lose Weight");
  const [customGoal, setCustomGoal] = useState("");
  const [name, setName] = useState(user.displayName || "");
  const [age, setAge] = useState<number>(24);
  const [height, setHeight] = useState<number>(165);
  
  // Weight metrics
  const [currentWeight, setCurrentWeight] = useState<number>(65);
  const [goalWeight, setGoalWeight] = useState<number>(58);
  const [targetDate, setTargetDate] = useState<string>("2026-09-01");

  // Dream self description
  const [dreamSelf, setDreamSelf] = useState("");
  const [selectedDreamTags, setSelectedDreamTags] = useState<string[]>([]);

  // Habits selection
  const [selectedHabits, setSelectedHabits] = useState<string[]>([
    "Breakfast", "Water Intake", "Walking"
  ]);
  const [customHabitText, setCustomHabitText] = useState("");
  const [allHabitOptions, setAllHabitOptions] = useState<string[]>([
    "Yoga", "Pilates", "Breakfast", "Water Intake", "Reading", "Walking", "Sleep Before 11 PM"
  ]);

  // Vision board
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [visionCaption, setVisionCaption] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isWeightRelated = goal === "Lose Weight" || 
    (goal === "Custom Goal" && /weight|lose|gain|kg|fat|slim|body|scale/i.test(customGoal));

  const totalSteps = isWeightRelated ? 6 : 5;

  // Render progression details
  const getMappedStepNumber = () => {
    if (step <= 2) return step;
    if (step === 3) {
      return isWeightRelated ? 3 : 0; // Skip if index mismatch
    }
    // Shift index if weight skipped
    return isWeightRelated ? step : step - 1;
  };

  const handleNext = () => {
    setError("");
    if (step === 2) {
      if (!name.trim()) {
        setError("Please enter your name to customize your diary.");
        return;
      }
      if (age <= 0 || height <= 0) {
        setError("Please enter valid metrics, age and height.");
        return;
      }
    }
    if (step === 3 && isWeightRelated) {
      if (currentWeight <= 0 || goalWeight <= 0) {
        setError("Weights must be positive numbers.");
        return;
      }
    }
    
    // Shift directly forward or skip step 3 if not weight related
    if (step === 2 && !isWeightRelated) {
      setStep(4);
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setError("");
    if (step === 4 && !isWeightRelated) {
      setStep(2);
    } else {
      setStep(step - 1);
    }
  };

  // Tag interactions for Dream Self prompt
  const dreamSelfTags = ["Wakes up early", "Exercises regularly", "Sleeps on time", "Confident", "Mindful Eater", "Hydrated", "Glowy Skin"];
  const handleTagToggle = (tag: string) => {
    let updatedTags: string[];
    if (selectedDreamTags.includes(tag)) {
      updatedTags = selectedDreamTags.filter(t => t !== tag);
    } else {
      updatedTags = [...selectedDreamTags, tag];
    }
    setSelectedDreamTags(updatedTags);
    
    // Auto populate text field or append
    const currentText = dreamSelf.trim();
    if (updatedTags.includes(tag)) {
      setDreamSelf(currentText ? `${currentText}, ${tag}` : tag);
    } else {
      // Remove it from text
      const regex = new RegExp(`(^|,\\s*)${tag}`, 'g');
      const clean = currentText.replace(regex, '').replace(/^,\s*/, '').trim();
      setDreamSelf(clean);
    }
  };

  // Habits adding
  const toggleHabit = (habitName: string) => {
    if (selectedHabits.includes(habitName)) {
      setSelectedHabits(selectedHabits.filter(h => h !== habitName));
    } else {
      setSelectedHabits([...selectedHabits, habitName]);
    }
  };

  const handleAddCustomHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customHabitText.trim()) return;
    const nameFormatted = customHabitText.trim();
    if (!allHabitOptions.includes(nameFormatted)) {
      setAllHabitOptions([...allHabitOptions, nameFormatted]);
    }
    if (!selectedHabits.includes(nameFormatted)) {
      setSelectedHabits([...selectedHabits, nameFormatted]);
    }
    setCustomHabitText("");
  };

  // Image Upload and Canvas resize downscale helper
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 400; // Resize to max 400px bound for 30kb database friendliness
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

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
        setVisionImage(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleOnboardingComplete = async () => {
    setLoading(true);
    setError("");
    const timestampStr = new Date().toISOString();

    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      name: name.trim(),
      age,
      height,
      goal: goal === "Custom Goal" ? customGoal.trim() : goal,
      dreamSelf: dreamSelf.trim() || selectedDreamTags.join(", ") || "Waking up early and radiating positivity.",
      completedOnboarding: true,
      createdAt: timestampStr,
      updatedAt: timestampStr,
    };

    if (isWeightRelated) {
      newProfile.currentWeight = currentWeight;
      newProfile.goalWeight = goalWeight;
      newProfile.targetDate = targetDate;
    }

    try {
      // 1. Save profile
      await dbService.saveProfile(newProfile);

      // 2. Save chosen habits
      for (const hTitle of selectedHabits) {
        const habitItem: Habit = {
          id: `${user.uid}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          userId: user.uid,
          title: hTitle,
          category: "General Lifestyle",
          isCustom: !["Yoga", "Pilates", "Breakfast", "Water Intake", "Reading", "Walking", "Sleep Before 11 PM"].includes(hTitle),
          streak: 0,
          createdAt: timestampStr,
        };
        await dbService.saveHabit(habitItem);
      }

      // 3. Save weight log if weight related
      if (isWeightRelated && currentWeight > 0) {
        const wLog: WeightLog = {
          id: `${user.uid}_weight_${Date.now()}`,
          userId: user.uid,
          weight: currentWeight,
          date: new Date().toISOString().split("T")[0],
          createdAt: timestampStr
        };
        await dbService.saveWeightLog(wLog);
      }

      // 4. Save Vision board image if provided
      if (visionImage) {
        const visionItem: VisionBoardItem = {
          id: `${user.uid}_vision_${Date.now()}`,
          userId: user.uid,
          imageUrl: visionImage,
          caption: visionCaption.trim() || undefined,
          createdAt: timestampStr,
        };
        await dbService.saveVisionItem(visionItem);
      }

      // Yield back
      onOnboardingComplete(newProfile);
    } catch (err: any) {
      console.error(err);
      setError("Failed to synchronize your diary records. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = Math.round((getMappedStepNumber() / totalSteps) * 100);

  return (
    <div className="flex-1 bg-cream flex flex-col justify-between p-6 overflow-y-auto">
      {/* Visual Header Progression Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] font-bold text-clay/40 uppercase tracking-widest font-sans">
            GlowUp Alignment
          </span>
          <span className="text-xs font-bold text-rose-primary">
            Step {getMappedStepNumber()} of {totalSteps}
          </span>
        </div>
        <div className="w-full h-1.5 bg-rose-primary/15 rounded-full overflow-hidden">
          <div 
            className="bg-rose-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 text-center animate-shake">
          {error}
        </div>
      )}

      {/* Main Form Sliders */}
      <div className="flex-1 flex flex-col justify-center py-4">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center">
                <Target className="w-8 h-8 text-rose-primary mx-auto mb-2" />
                <h2 className="font-display text-2xl font-bold text-clay tracking-tight">What is your primary goal?</h2>
                <p className="text-xs text-clay/60 font-sans mt-0.5">Let's set your central compass</p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                {["Lose Weight", "Better Sleep", "Better Skin", "Build Confidence", "Improve Fitness", "Productivity", "Custom Goal"].map((g) => {
                  const isSelected = goal === g;
                  return (
                    <button
                      key={g}
                      onClick={() => setGoal(g)}
                      className={`w-full py-3 px-4 rounded-xl text-left border flex items-center justify-between transition-all duration-200 cursor-pointer ${
                        isSelected 
                          ? "bg-rose-light border-rose-primary text-rose-dark font-medium shadow-2xs" 
                          : "bg-white border-rose-primary/10 hover:border-rose-primary/35 text-clay text-sm"
                      }`}
                    >
                      <span>{g}</span>
                      {isSelected && <Check className="w-4 h-4 text-rose-primary" />}
                    </button>
                  );
                })}
              </div>

              {goal === "Custom Goal" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-1.5 pt-1"
                >
                  <label className="text-[10px] font-bold text-clay/60 uppercase tracking-widest font-sans">
                    Define custom aspiration
                  </label>
                  <input
                    type="text"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    placeholder="e.g. Daily meditation and journaling..."
                    className="w-full h-11 bg-white px-4 rounded-xl border border-rose-primary/15 focus:border-rose-primary outline-hidden font-sans text-sm text-clay"
                  />
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center">
                <User className="w-8 h-8 text-rose-primary mx-auto mb-2" />
                <h2 className="font-display text-2xl font-bold text-clay tracking-tight">Basic Information</h2>
                <p className="text-xs text-clay/60 mt-0.5">We personalize metrics specifically to you</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-rose-primary/10 shadow-3xs space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-clay/60 uppercase tracking-wider font-sans">
                    What should we call you?
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full h-11 bg-cream/35 px-4 rounded-xl border border-rose-primary/10 focus:border-rose-primary outline-hidden font-sans text-sm text-clay"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-clay/60 uppercase tracking-wider font-sans">
                      Your Age (years)
                    </label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full h-11 bg-cream/35 px-4 rounded-xl border border-rose-primary/10 focus:border-rose-primary outline-hidden font-sans text-sm text-clay"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-clay/60 uppercase tracking-wider font-sans">
                      Your Height (cm)
                    </label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) => setHeight(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full h-11 bg-cream/35 px-4 rounded-xl border border-rose-primary/10 focus:border-rose-primary outline-hidden font-sans text-sm text-clay"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && isWeightRelated && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="text-center">
                <Scale className="w-8 h-8 text-rose-primary mx-auto mb-2" />
                <h2 className="font-display text-2xl font-bold text-clay tracking-tight">Current Status</h2>
                <p className="text-xs text-clay/60 mt-0.5">Let's plot out your health landmarks</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-rose-primary/10 shadow-3xs space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-clay/60 uppercase tracking-wider font-sans">
                      Current Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={currentWeight}
                      onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || 0)}
                      className="w-full h-11 bg-cream/35 px-4 rounded-xl border border-rose-primary/10 focus:border-rose-primary outline-hidden font-sans text-sm text-clay"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-clay/60 uppercase tracking-wider font-sans">
                      Heal Goal Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={goalWeight}
                      onChange={(e) => setGoalWeight(parseFloat(e.target.value) || 0)}
                      className="w-full h-11 bg-cream/35 px-4 rounded-xl border border-rose-primary/10 focus:border-rose-primary outline-hidden font-sans text-sm text-clay"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-clay/60 uppercase tracking-wider font-sans">
                    When is your Target timeline?
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full h-11 bg-cream/35 px-4 rounded-xl border border-rose-primary/10 focus:border-rose-primary outline-hidden font-sans text-sm text-clay"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <div className="text-center">
                <Sparkles className="w-8 h-8 text-rose-primary mx-auto mb-2" />
                <h2 className="font-display text-2xl font-bold text-clay tracking-tight">Your Dream Self</h2>
                <p className="text-xs text-clay/60 mt-0.5">Describe the person you want to become.</p>
              </div>

              <div className="space-y-3">
                <textarea
                  value={dreamSelf}
                  onChange={(e) => setDreamSelf(e.target.value)}
                  placeholder="e.g. She wakes up at 6 AM, drinks warm lemon water, moves with confidence, sleeps on time, is supportive and emotionally present..."
                  rows={4}
                  className="w-full p-4 bg-white rounded-2xl border border-rose-primary/15 focus:border-rose-primary outline-hidden font-sans text-sm text-clay resize-none shadow-3xs"
                />

                <div>
                  <span className="text-[10px] font-bold text-clay/40 uppercase tracking-widest block mb-2 font-sans">
                    Aspirational tags to append
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-1 bg-cream/50 rounded-xl">
                    {dreamSelfTags.map((tag) => {
                      const isSelected = selectedDreamTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-150 border ${
                            isSelected 
                              ? "bg-rose-primary text-white border-rose-primary shadow-2xs scale-95" 
                              : "bg-white text-clay/70 border-rose-primary/10 hover:border-rose-primary/30"
                          }`}
                        >
                          {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3.5"
            >
              <div className="text-center">
                <Dumbbell className="w-8 h-8 text-rose-primary mx-auto mb-2" />
                <h2 className="font-display text-2xl font-bold text-clay tracking-tight">Habit Selection</h2>
                <p className="text-xs text-clay/60 mt-0.5">Which small routines will align your life today?</p>
              </div>

              <div className="space-y-3">
                {/* Custom Habit input */}
                <form onSubmit={handleAddCustomHabit} className="flex gap-2">
                  <input
                    type="text"
                    value={customHabitText}
                    onChange={(e) => setCustomHabitText(e.target.value)}
                    placeholder="Create custom habit..."
                    className="flex-1 h-10 bg-white px-3.5 rounded-xl border border-rose-primary/15 focus:border-rose-primary outline-hidden font-sans text-xs text-clay"
                  />
                  <button
                    type="submit"
                    className="h-10 px-4 bg-lavender-primary text-white rounded-xl flex items-center justify-center cursor-pointer hover:bg-lavender-dark transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Grid selection */}
                <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto p-1 leading-snug">
                  {allHabitOptions.map((h) => {
                    const isSelected = selectedHabits.includes(h);
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => toggleHabit(h)}
                        className={`py-2.5 px-3 rounded-lg border text-left text-xs transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                          isSelected 
                            ? "bg-lavender-light border-lavender-primary/60 text-lavender-dark font-semibold shadow-3xs" 
                            : "bg-white border-rose-primary/10 text-clay/70"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                          isSelected ? "bg-lavender-primary border-lavender-primary" : "border-clay/20"
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="truncate">{h}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3.5 text-center"
            >
              <div>
                <BookOpen className="w-8 h-8 text-rose-primary mx-auto mb-2 animate-pulse" />
                <h2 className="font-display text-2xl font-bold text-clay tracking-tight">Vision Board</h2>
                <p className="text-xs text-clay/60 mt-0.5">Upload a photo representing your dreams (optional)</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-rose-primary/10 shadow-3xs max-w-[280px] mx-auto space-y-3">
                {visionImage ? (
                  <div className="space-y-2.5">
                    <div className="relative w-full aspect-square bg-cream rounded-xl overflow-hidden border border-rose-primary/10">
                      <img 
                        src={visionImage} 
                        alt="Vision target" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setVisionImage(null)}
                        className="absolute top-2 right-2 p-1.5 bg-clay/80 hover:bg-clay text-white rounded-full text-[9px] font-bold"
                      >
                        Clear
                      </button>
                    </div>

                    <input
                      type="text"
                      value={visionCaption}
                      onChange={(e) => setVisionCaption(e.target.value)}
                      placeholder="Add an aspirational caption..."
                      className="w-full h-9 bg-cream/35 px-3 rounded-lg border border-rose-primary/10 focus:border-rose-primary outline-hidden font-sans text-xs text-clay"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-cream/50 rounded-xl border border-dashed border-rose-primary/20 flex flex-col items-center justify-center p-6 text-clay/50 cursor-pointer hover:bg-clay/5 transition-colors relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Camera className="w-10 h-10 text-rose-primary/45 mb-2.5" />
                    <span className="font-semibold text-xs text-clay/75">Select Photo</span>
                    <span className="text-[10px] text-clay/50 mt-1 max-w-[180px] text-center leading-normal">
                      Drag & drop or tap to select a scenic reference file.
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Button Controls */}
      <div className="flex gap-3 pt-6 border-t border-rose-primary/10">
        {step > 1 && (
          <button
            onClick={handleBack}
            className="w-1/3 h-12 bg-white border border-rose-primary/10 rounded-xl font-sans text-xs font-semibold text-clay/70 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        )}

        {step < 5 || (step === 5 && isWeightRelated) ? (
          <button
            onClick={handleNext}
            className="flex-1 h-12 bg-rose-primary hover:bg-rose-dark text-white rounded-xl font-sans text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            Next
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleOnboardingComplete}
            disabled={loading}
            className="flex-1 h-12 bg-rose-primary hover:bg-rose-dark text-white rounded-xl font-sans text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md animate-pulse"
          >
            {loading ? "GlowUp Initializing..." : "Step Into Dream Self"}
            <Compass className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
