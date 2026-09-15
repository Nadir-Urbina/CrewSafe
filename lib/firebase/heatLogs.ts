import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, COLLECTIONS } from "./db";
import { HeatLog } from "@/lib/types";

export type AddHeatLogInput = Omit<HeatLog, "id" | "createdAt">;

export async function addHeatLog(input: AddHeatLogInput): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.heatLogs), {
    ...input,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
