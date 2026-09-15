import {
  collection, doc,
  getDocs, addDoc, updateDoc,
  orderBy, query,
  serverTimestamp,
} from "firebase/firestore";
import { db, COLLECTIONS } from "./db";
import { RewardTier } from "@/lib/types";

export type AddRewardTierInput = Omit<RewardTier, "id">;

export async function getRewardTiers(): Promise<RewardTier[]> {
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.rewards), orderBy("pointsRequired", "asc"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as RewardTier));
}

export async function addRewardTier(input: AddRewardTierInput): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.rewards), {
    ...input,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateRewardTier(
  id: string,
  input: Partial<AddRewardTierInput>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.rewards, id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}
