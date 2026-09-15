import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, COLLECTIONS } from "./db";
import { HeatProgram, HeatProgramLevel } from "@/lib/types";

const PROGRAM_DOC = "heatProgram";

export const DEFAULT_HEAT_PROGRAM: HeatProgram = {
  levels: [
    {
      name: "Moderate Risk",
      minTemp: 92,
      maxTemp: 99,
      actions: [
        "Drinking water available for all workers (1 cup per 20 min)",
        "Shaded rest areas accessible on-site",
        "Workers briefed on heat illness signs and symptoms",
        "New or returning workers on acclimatization schedule",
      ],
    },
    {
      name: "High Risk",
      minTemp: 100,
      maxTemp: 105,
      actions: [
        "Drinking water available for all workers (1 cup per 20 min)",
        "Shaded rest areas accessible on-site",
        "Workers briefed on heat illness signs and symptoms",
        "New or returning workers on acclimatization schedule",
        "Rest breaks scheduled at least every hour",
        "Buddy system active — workers monitoring each other",
        "Heavy or strenuous tasks rescheduled to cooler hours",
      ],
    },
    {
      name: "Imminent Danger",
      minTemp: 106,
      maxTemp: 999,
      actions: [
        "Drinking water available for all workers (1 cup per 20 min)",
        "Shaded rest areas accessible on-site",
        "Workers briefed on heat illness signs and symptoms",
        "New or returning workers on acclimatization schedule",
        "Rest breaks scheduled at least every hour",
        "Buddy system active — workers monitoring each other",
        "Heavy or strenuous tasks rescheduled to cooler hours",
        "Non-essential work has been suspended",
        "Emergency response plan reviewed with the crew today",
        "Medical monitoring available on-site or on-call",
        "Safety officer / direct supervisor has been notified",
      ],
    },
  ],
};

export async function getHeatProgram(): Promise<HeatProgram> {
  const snap = await getDoc(doc(db, COLLECTIONS.settings, PROGRAM_DOC));
  if (!snap.exists()) return DEFAULT_HEAT_PROGRAM;
  return snap.data() as HeatProgram;
}

export async function saveHeatProgram(program: HeatProgram): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.settings, PROGRAM_DOC), {
    ...program,
    updatedAt: serverTimestamp(),
  });
}

export async function saveHeatLevel(index: 0 | 1 | 2, level: HeatProgramLevel): Promise<void> {
  const current = await getHeatProgram();
  const updated: HeatProgram = {
    levels: [current.levels[0], current.levels[1], current.levels[2]],
  };
  updated.levels[index] = level;
  await saveHeatProgram(updated);
}

/** Find the matching level for a given heat index, or null if below all thresholds. */
export function matchLevel(heatIndex: number, program: HeatProgram): { level: HeatProgramLevel; index: number } | null {
  let matched: { level: HeatProgramLevel; index: number } | null = null;
  program.levels.forEach((level, i) => {
    if (heatIndex >= level.minTemp) matched = { level, index: i };
  });
  return matched;
}
