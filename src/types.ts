export interface UserProfile {
  uid: string;
  email: string | null;
  name: string;
  age: number;
  height: number;
  goal: string;
  customGoal?: string;
  currentWeight?: number;
  goalWeight?: number;
  targetDate?: string;
  dreamSelf: string;
  completedOnboarding: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  category: string;
  isCustom: boolean;
  streak: number;
  createdAt: string;
}

export interface HabitLog {
  id: string; // e.g. userId_habitId_dateYMD
  userId: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  createdAt: string;
}

export interface WeightLog {
  id: string;
  userId: string;
  weight: number;
  date: string; // YYYY-MM-DD
  createdAt: string;
}

export interface VisionBoardItem {
  id: string;
  userId: string;
  imageUrl: string; // Base64 Compressed string
  caption?: string;
  createdAt: string;
}
