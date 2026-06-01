import { Timestamp } from "firebase/firestore";

// ─── Incident ───────────────────────────────────────────────────────────────

export type IncidentType =
  | "hazard"
  | "near-miss"
  | "injury-illness"
  | "vehicle-accident";

export type IncidentStatus = "new" | "in-review" | "review-completed";

export interface Incident {
  id: string;
  submittedBy: string; // employee name from roster
  employeeId: string;
  type: IncidentType;
  status: IncidentStatus;
  date: string; // ISO date string of when the incident occurred
  description: string;
  location?: string;
  photoUrl?: string;
  // Type-specific fields
  hazardDetails?: HazardDetails;
  nearMissDetails?: NearMissDetails;
  injuryDetails?: InjuryDetails;
  vehicleDetails?: VehicleDetails;
  // Admin fields
  investigationNotes?: string;
  reviewedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface HazardDetails {
  hazardType: string;
  immediateAction: string;
}

export interface NearMissDetails {
  whatHappened: string;
  potentialConsequence: string;
}

export interface InjuryDetails {
  injuryType: string;
  bodyPart: string;
  medicalTreatment: "none" | "first-aid" | "medical-facility" | "hospital";
  lostTime: boolean;
}

export interface VehicleDetails {
  vehicleId: string;
  otherPartyInvolved: boolean;
  policeReportFiled: boolean;
  damageDescription: string;
}

// ─── Employee ────────────────────────────────────────────────────────────────

export type EmployeeRole = "crew" | "supervisor" | "admin";

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: EmployeeRole;
  supervisorId?: string;
  crewName?: string;
  active: boolean;
  points: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export function employeeFullName(e: Pick<Employee, "firstName" | "lastName">) {
  return `${e.firstName} ${e.lastName}`;
}

// ─── Heat Illness Log ────────────────────────────────────────────────────────

export type TempThreshold = "92-99" | "100-105" | "106+";

export interface HeatLog {
  id: string;
  supervisorId: string;
  supervisorName: string;
  temperature: number;
  threshold: TempThreshold;
  location: { lat: number; lng: number };
  locationName?: string;
  checklist: Record<string, boolean>;
  comments: string;
  createdAt: Timestamp;
}

// ─── Rewards ─────────────────────────────────────────────────────────────────

export interface RewardTier {
  id: string;
  name: string;
  pointsRequired: number;
  description: string;
  active: boolean;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  employeeId: string;
  name: string;
  points: number;
  rank: number;
  submissionCount: number;
}
