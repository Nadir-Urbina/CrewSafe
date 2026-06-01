import {
  collection, query, where, orderBy, getDocs,
  doc, addDoc, updateDoc, writeBatch, serverTimestamp,
} from "firebase/firestore";
import { db, COLLECTIONS } from "./db";
import { Employee, EmployeeRole, employeeFullName } from "../types";

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getActiveEmployees(): Promise<Employee[]> {
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.employees),
      where("active", "==", true),
      orderBy("firstName")
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Employee));
}

export async function getAllEmployees(): Promise<Employee[]> {
  const snap = await getDocs(
    query(collection(db, COLLECTIONS.employees), orderBy("firstName"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Employee));
}

// ─── Write ────────────────────────────────────────────────────────────────────

export interface AddEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: EmployeeRole;
  supervisorId?: string;
  crewName?: string;
}

export async function addEmployee(data: AddEmployeeInput): Promise<string> {
  // Build document explicitly — never spread optional fields as undefined
  // because Firestore rejects undefined values outright.
  const payload: Record<string, unknown> = {
    firstName: data.firstName.trim(),
    lastName:  data.lastName.trim(),
    email:     data.email.toLowerCase().trim(),
    phone:     data.phone?.trim() ?? "",
    role:      data.role,
    active:    true,
    points:    0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (data.supervisorId) payload.supervisorId = data.supervisorId;
  if (data.crewName?.trim()) payload.crewName  = data.crewName.trim();

  const ref = await addDoc(collection(db, COLLECTIONS.employees), payload);
  return ref.id;
}

export async function updateEmployee(
  id: string,
  data: Partial<Omit<Employee, "id" | "createdAt">>
): Promise<void> {
  // Strip undefined values before sending to Firestore
  const clean: Record<string, unknown> = { updatedAt: serverTimestamp() };
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) clean[k] = v;
  }
  await updateDoc(doc(db, COLLECTIONS.employees, id), {
    ...clean,
    updatedAt: serverTimestamp(),
  });
}

export async function setEmployeeActive(id: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.employees, id), {
    active,
    updatedAt: serverTimestamp(),
  });
}

// ─── Batch import ─────────────────────────────────────────────────────────────

export interface ImportRow {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  supervisorEmail: string;
  // validation
  rowIndex: number;
  errors: string[];
}

export interface ImportResult {
  created: number;
  supervisorsLinked: number;
  skipped: { row: number; reason: string }[];
}

export async function batchImportEmployees(
  rows: ImportRow[]
): Promise<ImportResult> {
  const validRows = rows.filter((r) => r.errors.length === 0);
  const skipped = rows
    .filter((r) => r.errors.length > 0)
    .map((r) => ({ row: r.rowIndex + 2, reason: r.errors.join(", ") }));

  if (validRows.length === 0) return { created: 0, supervisorsLinked: 0, skipped };

  // ── Phase 1: Create all employees ────────────────────────────────────────
  const batch = writeBatch(db);
  const createdRefs: { email: string; ref: ReturnType<typeof doc> }[] = [];

  for (const row of validRows) {
    const ref = doc(collection(db, COLLECTIONS.employees));
    batch.set(ref, {
      firstName: row.firstName.trim(),
      lastName: row.lastName.trim(),
      email: row.email.toLowerCase().trim(),
      phone: row.phone?.trim() || "",
      role: (["crew", "supervisor", "admin"].includes(row.role?.toLowerCase())
        ? row.role.toLowerCase()
        : "crew") as EmployeeRole,
      active: true,
      points: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    createdRefs.push({ email: row.email.toLowerCase().trim(), ref });
  }

  await batch.commit();

  // ── Phase 2: Resolve supervisorEmail → supervisorId ──────────────────────
  const rowsWithSupervisor = validRows.filter((r) => r.supervisorEmail?.trim());
  if (rowsWithSupervisor.length === 0) {
    return { created: validRows.length, supervisorsLinked: 0, skipped };
  }

  // Re-fetch all employees to get a complete email → id map (includes new + existing)
  const allSnap = await getDocs(collection(db, COLLECTIONS.employees));
  const emailToId: Record<string, string> = {};
  allSnap.docs.forEach((d) => {
    const email = d.data().email as string;
    if (email) emailToId[email.toLowerCase()] = d.id;
  });

  const supBatch = writeBatch(db);
  let supervisorsLinked = 0;

  for (const row of rowsWithSupervisor) {
    const supervisorId = emailToId[row.supervisorEmail.toLowerCase().trim()];
    const employeeId = emailToId[row.email.toLowerCase().trim()];
    if (supervisorId && employeeId && supervisorId !== employeeId) {
      supBatch.update(doc(db, COLLECTIONS.employees, employeeId), {
        supervisorId,
        updatedAt: serverTimestamp(),
      });
      supervisorsLinked++;
    }
  }

  if (supervisorsLinked > 0) await supBatch.commit();

  return { created: validRows.length, supervisorsLinked, skipped };
}

// ─── CSV/Excel parsing helpers ────────────────────────────────────────────────

function norm(s: string) {
  return s.toLowerCase().replace(/[\s_\-\.]/g, "");
}

function findVal(row: Record<string, string>, aliases: string[]): string {
  const key = Object.keys(row).find((k) => aliases.some((a) => norm(k) === norm(a)));
  return key ? (row[key] ?? "").trim() : "";
}

export function parseSheetRows(
  rawRows: Record<string, string>[],
  existingEmails: Set<string>
): ImportRow[] {
  const seenEmails = new Set<string>(existingEmails);

  return rawRows.map((raw, i) => {
    const firstName = findVal(raw, ["firstName", "first name", "firstname", "first"]);
    const lastName  = findVal(raw, ["lastName",  "last name",  "lastname",  "last"]);
    const email     = findVal(raw, ["email", "emailaddress", "email address"]);
    const phone     = findVal(raw, ["phone", "phonenumber", "phone number", "mobile", "cell"]);
    const role      = findVal(raw, ["role", "position", "jobTitle", "job title"]);
    const supervisorEmail = findVal(raw, ["supervisoremail", "supervisor email", "supervisorEmail", "manager email", "manageremail"]);

    const errors: string[] = [];
    if (!firstName) errors.push("First name required");
    if (!lastName)  errors.push("Last name required");
    if (!email)     errors.push("Email required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Invalid email format");
    else if (seenEmails.has(email.toLowerCase())) errors.push("Duplicate email");
    else seenEmails.add(email.toLowerCase());

    if (role && !["crew", "supervisor", "admin"].includes(role.toLowerCase())) {
      errors.push("Role must be crew, supervisor, or admin");
    }

    return { firstName, lastName, email, phone, role, supervisorEmail, rowIndex: i, errors };
  });
}

export { employeeFullName };
