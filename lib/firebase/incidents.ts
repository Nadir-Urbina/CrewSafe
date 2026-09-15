import {
  collection, query, where, getDocs,
  addDoc, serverTimestamp,
} from "firebase/firestore";
import { db, COLLECTIONS } from "./db";
import { Incident, IncidentType } from "../types";

const TYPE_MAP: Record<string, IncidentType> = {
  hazard:   "hazard",
  nearmiss: "near-miss",
  injury:   "injury-illness",
  vehicle:  "vehicle-accident",
  wins:     "wins",
};

export interface AddIncidentInput {
  submittedBy: string;
  employeeId: string;
  typeId: string;
  location: string;
  severity: "low" | "med" | "high";
  description: string;
  wye?: string;
  hazardCategory?: string;
  correctiveAction?: string;
  contributingFactor?: string;
  bodyParts?: string[];
  firstAid?: boolean;
  vehicleId?: string;
  damage?: string;
  thirdParty?: boolean;
}

export async function addIncident(input: AddIncidentInput): Promise<string> {
  const payload: Record<string, unknown> = {
    submittedBy:  input.submittedBy,
    employeeId:   input.employeeId,
    type:         TYPE_MAP[input.typeId] ?? "hazard",
    status:       "new",
    date:         new Date().toISOString(),
    description:  input.description,
    location:     input.location,
    severity:     input.severity,
    createdAt:    serverTimestamp(),
    updatedAt:    serverTimestamp(),
    ...(input.wye ? { wye: input.wye } : {}),
  };

  if (input.hazardCategory || input.correctiveAction) {
    payload.hazardDetails = {
      hazardType:      input.hazardCategory ?? "",
      immediateAction: input.correctiveAction ?? "",
    };
  }
  if (input.contributingFactor) {
    payload.nearMissDetails = {
      whatHappened:         input.contributingFactor,
      potentialConsequence: input.description,
    };
  }
  if (input.bodyParts?.length) {
    payload.injuryDetails = {
      injuryType:       "",
      bodyPart:         input.bodyParts.join(", "),
      medicalTreatment: input.firstAid ? "first-aid" : "none",
      lostTime:         false,
    };
  }
  if (input.vehicleId || input.damage) {
    payload.vehicleDetails = {
      vehicleId:          input.vehicleId ?? "",
      otherPartyInvolved: input.thirdParty ?? false,
      policeReportFiled:  false,
      damageDescription:  input.damage ?? "",
    };
  }

  const ref = await addDoc(collection(db, COLLECTIONS.incidents), payload);
  return ref.id;
}

export async function getIncidentsByEmployee(employeeId: string): Promise<Incident[]> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.incidents),
      where("employeeId", "==", employeeId),
    )
  );
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Incident));
  // Sort client-side by createdAt desc to avoid requiring a composite index
  return docs.sort((a, b) => {
    const at = (a.createdAt as { seconds?: number })?.seconds ?? 0;
    const bt = (b.createdAt as { seconds?: number })?.seconds ?? 0;
    return bt - at;
  });
}
