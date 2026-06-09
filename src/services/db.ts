import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { UserProfile, Habit, HabitLog, WeightLog, VisionBoardItem } from "../types";

const USERS_COL = "users";
const HABITS_COL = "habits";
const LOGS_COL = "habit_logs";
const WEIGHTS_COL = "weight_logs";
const VISION_COL = "vision_board";

export const dbService = {
  // USER PROFILE
  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      const docRef = doc(db, USERS_COL, profile.uid);
      await setDoc(docRef, profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${USERS_COL}/${profile.uid}`);
    }
  },

  async fetchProfile(uid: string): Promise<UserProfile | null> {
    const path = `${USERS_COL}/${uid}`;
    try {
      const docRef = doc(db, USERS_COL, uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as UserProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  // HABITS
  async fetchHabits(userId: string): Promise<Habit[]> {
    try {
      const q = query(collection(db, HABITS_COL), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const habits: Habit[] = [];
      querySnapshot.forEach((docSnap) => {
        habits.push(docSnap.data() as Habit);
      });
      return habits;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, HABITS_COL);
      return [];
    }
  },

  async saveHabit(habit: Habit): Promise<void> {
    const path = `${HABITS_COL}/${habit.id}`;
    try {
      await setDoc(doc(db, HABITS_COL, habit.id), habit);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateHabit(habitId: string, updates: Partial<Habit>): Promise<void> {
    const path = `${HABITS_COL}/${habitId}`;
    try {
      const docRef = doc(db, HABITS_COL, habitId);
      await updateDoc(docRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteHabit(habitId: string): Promise<void> {
    const path = `${HABITS_COL}/${habitId}`;
    try {
      await deleteDoc(doc(db, HABITS_COL, habitId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // HABIT LOGS
  async fetchHabitLogs(userId: string): Promise<HabitLog[]> {
    try {
      const q = query(collection(db, LOGS_COL), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const logs: HabitLog[] = [];
      querySnapshot.forEach((docSnap) => {
        logs.push(docSnap.data() as HabitLog);
      });
      return logs;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, LOGS_COL);
      return [];
    }
  },

  async saveHabitLog(log: HabitLog): Promise<void> {
    const path = `${LOGS_COL}/${log.id}`;
    try {
      await setDoc(doc(db, LOGS_COL, log.id), log);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteHabitLog(logId: string): Promise<void> {
    const path = `${LOGS_COL}/${logId}`;
    try {
      await deleteDoc(doc(db, LOGS_COL, logId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // WEIGHT LOGS
  async fetchWeightLogs(userId: string): Promise<WeightLog[]> {
    try {
      const q = query(collection(db, WEIGHTS_COL), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const weights: WeightLog[] = [];
      querySnapshot.forEach((docSnap) => {
        weights.push(docSnap.data() as WeightLog);
      });
      return weights;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, WEIGHTS_COL);
      return [];
    }
  },

  async saveWeightLog(log: WeightLog): Promise<void> {
    const path = `${WEIGHTS_COL}/${log.id}`;
    try {
      await setDoc(doc(db, WEIGHTS_COL, log.id), log);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteWeightLog(logId: string): Promise<void> {
    const path = `${WEIGHTS_COL}/${logId}`;
    try {
      await deleteDoc(doc(db, WEIGHTS_COL, logId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // VISION BOARD
  async fetchVisionLogs(userId: string): Promise<VisionBoardItem[]> {
    try {
      const q = query(collection(db, VISION_COL), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const items: VisionBoardItem[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push(docSnap.data() as VisionBoardItem);
      });
      return items;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, VISION_COL);
      return [];
    }
  },

  async saveVisionItem(item: VisionBoardItem): Promise<void> {
    const path = `${VISION_COL}/${item.id}`;
    try {
      await setDoc(doc(db, VISION_COL, item.id), item);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteVisionItem(itemId: string): Promise<void> {
    const path = `${VISION_COL}/${itemId}`;
    try {
      await deleteDoc(doc(db, VISION_COL, itemId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
