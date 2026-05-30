import { getFirestore } from "firebase/firestore";
import app from "./config";

export const db = getFirestore(app);

// Collection names — single source of truth
export const COLLECTIONS = {
  incidents: "incidents",
  employees: "employees",
  heatLogs: "heatLogs",
  rewards: "rewards",
  leaderboard: "leaderboard",
} as const;
