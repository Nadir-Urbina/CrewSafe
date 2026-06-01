"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  getAllEmployees, addEmployee, updateEmployee, setEmployeeActive,
  batchImportEmployees, parseSheetRows,
  type AddEmployeeInput, type ImportRow, type ImportResult,
} from "@/lib/firebase/employees";
import { Employee, EmployeeRole, employeeFullName } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";
import StatusPill from "@/components/ui/StatusPill";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<EmployeeRole, string> = {
  crew: "Crew", supervisor: "Supervisor", admin: "Admin",
};
const ROLE_COLORS: Record<EmployeeRole, string> = {
  crew: "var(--cs-info)", supervisor: "var(--cs-caution)", admin: "var(--cs-critical)",
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const sp = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function PlusIcon()   { return <svg width={18} height={18} viewBox="0 0 24 24" {...sp}><path d="M12 5v14M5 12h14"/></svg>; }
function UploadIcon() { return <svg width={18} height={18} viewBox="0 0 24 24" {...sp}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>; }
function XIcon()      { return <svg width={20} height={20} viewBox="0 0 24 24" {...sp}><path d="M6 6l12 12M18 6L6 18"/></svg>; }
function SearchIcon() { return <svg width={18} height={18} viewBox="0 0 24 24" {...sp}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>; }
function DownloadIcon(){ return <svg width={16} height={16} viewBox="0 0 24 24" {...sp}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>; }
function CheckIcon()   { return <svg width={20} height={20} viewBox="0 0 24 24" {...sp}><path d="M4 12.5l5.5 5.5L20 6"/></svg>; }
function WarnIcon()    { return <svg width={16} height={16} viewBox="0 0 24 24" {...sp}><path d="M12 3.5L22 20H2zM12 10v4.5"/><circle cx="12" cy="17.4" r="0.4" fill="currentColor" stroke="none"/></svg>; }

// ─── Shared drawer shell ──────────────────────────────────────────────────────
function Drawer({ title, onClose, children, footer }: {
  title: string; onClose: () => void;
  children: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(20,18,14,0.45)", display: "flex", justifyContent: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(480px, 100vw)", height: "100%", background: "var(--cs-paper)", boxShadow: "-20px 0 50px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", animation: "cs-slide .22s ease" }}>
        {/* Header */}
        <div style={{ background: "var(--cs-ink)", padding: "20px 20px 16px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#fff", textTransform: "uppercase", letterSpacing: 0.4 }}>{title}</div>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(255,255,255,0.10)", border: "1.5px solid rgba(255,255,255,0.18)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", minHeight: 0 }}><XIcon /></button>
          </div>
          <div style={{ height: 3, background: "var(--cs-hiviz)", marginTop: 14 }} />
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>{children}</div>
        {/* Footer */}
        {footer && <div style={{ padding: "16px 20px", borderTop: "2px solid var(--cs-line)", background: "var(--cs-card)", flexShrink: 0 }}>{footer}</div>}
      </div>
    </div>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--cs-ink2)", marginBottom: 7, display: "flex", gap: 5 }}>
      {children}{required && <span style={{ color: "var(--cs-critical)" }}>*</span>}
    </div>
  );
}
const inputSx: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 10, padding: "12px 14px", fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 500, color: "var(--cs-ink)", outline: "none" };
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input {...props} style={inputSx} />; }
function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} style={{ ...inputSx, appearance: "none" }}>{children}</select>; }
function FieldRow({ children }: { children: React.ReactNode }) { return <div style={{ marginBottom: 18 }}>{children}</div>; }

// ─── Add / Edit Employee Drawer ───────────────────────────────────────────────
function EmployeeDrawer({
  onClose, onSaved, editingEmployee, allEmployees,
}: {
  onClose: () => void;
  onSaved: () => void;
  editingEmployee: Employee | null;
  allEmployees: Employee[];
}) {
  const isEdit = !!editingEmployee;
  const [firstName, setFirstName] = useState(editingEmployee?.firstName ?? "");
  const [lastName,  setLastName]  = useState(editingEmployee?.lastName  ?? "");
  const [email,     setEmail]     = useState(editingEmployee?.email     ?? "");
  const [phone,     setPhone]     = useState(editingEmployee?.phone     ?? "");
  const [role,      setRole]      = useState<EmployeeRole>(editingEmployee?.role ?? "crew");
  const [supervisorId, setSupervisorId] = useState(editingEmployee?.supervisorId ?? "");
  const [crewName,  setCrewName]  = useState(editingEmployee?.crewName  ?? "");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  const supervisorOptions = allEmployees.filter(
    (e) => e.active && e.id !== editingEmployee?.id && (e.role === "supervisor" || e.role === "admin")
  );

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("First name, last name and email are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data: AddEmployeeInput = {
        firstName: firstName.trim(), lastName: lastName.trim(),
        email: email.trim().toLowerCase(), phone: phone.trim(),
        role, supervisorId: supervisorId || undefined, crewName: crewName.trim(),
      };
      if (isEdit) {
        await updateEmployee(editingEmployee!.id, data);
      } else {
        await addEmployee(data);
      }
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      title={isEdit ? "Edit Employee" : "Add Employee"}
      onClose={onClose}
      footer={
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {error && <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cs-critical)", background: "var(--cs-critical-soft)", borderRadius: 8, padding: "8px 12px" }}>{error}</div>}
          <button onClick={handleSave} disabled={saving} style={{ width: "100%", height: 54, borderRadius: 12, background: saving ? "var(--cs-paper-deep)" : "var(--cs-hiviz)", border: `2.5px solid ${saving ? "var(--cs-line)" : "var(--cs-ink)"}`, boxShadow: saving ? "none" : "0 4px 0 var(--cs-ink)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 18, textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer", color: saving ? "var(--cs-faint)" : "var(--cs-ink)" }}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Employee"}
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <FieldRow><Label required>First Name</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" /></FieldRow>
          <FieldRow><Label required>Last Name</Label><Input value={lastName}  onChange={(e) => setLastName(e.target.value)}  placeholder="Smith" /></FieldRow>
        </div>
        <FieldRow><Label required>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john.smith@company.com" /></FieldRow>
        <FieldRow><Label>Phone</Label><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="555-123-4567" /></FieldRow>
        <FieldRow>
          <Label required>Role</Label>
          <Select value={role} onChange={(e) => setRole(e.target.value as EmployeeRole)}>
            <option value="crew">Crew</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </Select>
        </FieldRow>
        <FieldRow>
          <Label>Supervisor</Label>
          <Select value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)}>
            <option value="">— None —</option>
            {supervisorOptions.map((s) => (
              <option key={s.id} value={s.id}>{employeeFullName(s)} ({ROLE_LABELS[s.role]})</option>
            ))}
          </Select>
        </FieldRow>
        <FieldRow><Label>Crew / Team</Label><Input value={crewName} onChange={(e) => setCrewName(e.target.value)} placeholder="e.g. North Yard · Crew B" /></FieldRow>
      </div>
    </Drawer>
  );
}

// ─── Import Drawer ────────────────────────────────────────────────────────────
function ImportDrawer({ onClose, onImported, existingEmployees }: {
  onClose: () => void;
  onImported: () => void;
  existingEmployees: Employee[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ImportRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const existingEmails = useMemo(
    () => new Set(existingEmployees.map((e) => e.email.toLowerCase())),
    [existingEmployees]
  );

  const validCount   = parsedRows?.filter((r) => r.errors.length === 0).length ?? 0;
  const invalidCount = parsedRows?.filter((r) => r.errors.length > 0).length  ?? 0;

  async function parseFile(file: File) {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(data), { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { raw: false, defval: "" });
    setParsedRows(parseSheetRows(raw, existingEmails));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }

  function downloadTemplate() {
    const ws = XLSX.utils.json_to_sheet([
      { firstName: "John", lastName: "Smith", email: "john.smith@company.com", phone: "555-1234", role: "crew", supervisorEmail: "" },
      { firstName: "Jane", lastName: "Doe",   email: "jane.doe@company.com",   phone: "555-5678", role: "supervisor", supervisorEmail: "" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "crewsafe-employees-template.xlsx");
  }

  async function handleImport() {
    if (!parsedRows) return;
    setImporting(true);
    try {
      const res = await batchImportEmployees(parsedRows);
      setResult(res);
      onImported();
    } catch (e) {
      console.error(e);
    } finally {
      setImporting(false);
    }
  }

  return (
    <Drawer
      title="Import Employees"
      onClose={onClose}
      footer={
        parsedRows && !result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {invalidCount > 0 && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cs-caution)" }}>
                <WarnIcon />{invalidCount} row{invalidCount > 1 ? "s" : ""} with errors will be skipped.
              </div>
            )}
            <button onClick={handleImport} disabled={importing || validCount === 0} style={{ width: "100%", height: 54, borderRadius: 12, background: importing || validCount === 0 ? "var(--cs-paper-deep)" : "var(--cs-hiviz)", border: `2.5px solid ${importing || validCount === 0 ? "var(--cs-line)" : "var(--cs-ink)"}`, boxShadow: importing || validCount === 0 ? "none" : "0 4px 0 var(--cs-ink)", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, textTransform: "uppercase", cursor: importing || validCount === 0 ? "not-allowed" : "pointer", color: importing || validCount === 0 ? "var(--cs-faint)" : "var(--cs-ink)" }}>
              {importing ? "Importing…" : `Import ${validCount} Employee${validCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        )
      }
    >
      {result ? (
        /* Success state */
        <div style={{ textAlign: "center", paddingTop: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 999, background: "var(--cs-safe-soft)", border: "2px solid var(--cs-safe)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--cs-safe)" }}><CheckIcon /></div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 26, textTransform: "uppercase", color: "var(--cs-ink)" }}>Import Complete</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--cs-muted)", marginTop: 12, lineHeight: 1.6 }}>
            <strong style={{ color: "var(--cs-ink)" }}>{result.created}</strong> employee{result.created !== 1 ? "s" : ""} created
            {result.supervisorsLinked > 0 && <>, <strong style={{ color: "var(--cs-ink)" }}>{result.supervisorsLinked}</strong> supervisor link{result.supervisorsLinked !== 1 ? "s" : ""} resolved</>}.
          </div>
          {result.skipped.length > 0 && (
            <div style={{ marginTop: 16, background: "var(--cs-caution-soft)", border: "1.5px solid var(--cs-caution)", borderRadius: 10, padding: "12px 16px", textAlign: "left" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, letterSpacing: 0.4, textTransform: "uppercase", color: "var(--cs-caution)", marginBottom: 8 }}>{result.skipped.length} row{result.skipped.length !== 1 ? "s" : ""} skipped</div>
              {result.skipped.map((s, i) => (
                <div key={i} style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cs-ink2)", marginBottom: 4 }}>Row {s.row}: {s.reason}</div>
              ))}
            </div>
          )}
          <button onClick={onClose} style={{ marginTop: 24, width: "100%", height: 48, borderRadius: 10, background: "var(--cs-ink)", border: "none", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, textTransform: "uppercase", cursor: "pointer" }}>Done</button>
        </div>
      ) : !parsedRows ? (
        /* Upload zone */
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{ border: `2.5px dashed ${dragOver ? "var(--cs-hiviz)" : "var(--cs-line-strong)"}`, borderRadius: 16, padding: "40px 24px", textAlign: "center", cursor: "pointer", background: dragOver ? "oklch(0.97 0.04 110)" : "var(--cs-card)", transition: "all .15s" }}
          >
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, textTransform: "uppercase", color: "var(--cs-ink)", marginBottom: 8 }}>
              Drop file here or click to browse
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--cs-muted)" }}>Accepts .csv, .xlsx, .xls</div>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} style={{ display: "none" }} />

          <div style={{ background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 15, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>Required columns</div>
            {[
              { col: "firstName", note: "Required" },
              { col: "lastName",  note: "Required" },
              { col: "email",     note: "Required — must be unique" },
              { col: "phone",     note: "Optional" },
              { col: "role",      note: "Optional — crew / supervisor / admin (defaults to crew)" },
              { col: "supervisorEmail", note: "Optional — links supervisor by email" },
            ].map(({ col, note }) => (
              <div key={col} style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--cs-ink)", background: "var(--cs-paper-deep)", padding: "2px 7px", borderRadius: 5, flexShrink: 0 }}>{col}</span>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cs-muted)" }}>{note}</span>
              </div>
            ))}
            <button onClick={downloadTemplate} style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 7, background: "none", border: "1.5px solid var(--cs-line-strong)", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.3, color: "var(--cs-ink2)", minHeight: 0 }}>
              <DownloadIcon /> Download template
            </button>
          </div>
        </div>
      ) : (
        /* Preview table */
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, background: "var(--cs-safe-soft)", border: "1.5px solid var(--cs-safe)", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "var(--cs-safe)" }}>{validCount}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--cs-muted)", textTransform: "uppercase" }}>Ready</div>
            </div>
            {invalidCount > 0 && (
              <div style={{ flex: 1, background: "var(--cs-critical-soft)", border: "1.5px solid var(--cs-critical)", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, color: "var(--cs-critical)" }}>{invalidCount}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--cs-muted)", textTransform: "uppercase" }}>Errors</div>
              </div>
            )}
            <button onClick={() => { setParsedRows(null); if (fileRef.current) fileRef.current.value = ""; }} style={{ padding: "0 14px", background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 10, cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, textTransform: "uppercase", color: "var(--cs-ink2)", minHeight: 0 }}>Re-upload</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-body)", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--cs-paper-deep)" }}>
                  {["Row", "Name", "Email", "Role", "Status"].map((h) => (
                    <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--cs-muted)", borderBottom: "2px solid var(--cs-line)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, i) => {
                  const ok = row.errors.length === 0;
                  return (
                    <tr key={i} style={{ background: ok ? "transparent" : "var(--cs-critical-soft)", borderBottom: "1.5px solid var(--cs-line)" }}>
                      <td style={{ padding: "9px 12px", color: "var(--cs-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{row.rowIndex + 2}</td>
                      <td style={{ padding: "9px 12px" }}>{row.firstName} {row.lastName}</td>
                      <td style={{ padding: "9px 12px", color: "var(--cs-ink2)" }}>{row.email}</td>
                      <td style={{ padding: "9px 12px" }}><RoleBadge role={(row.role || "crew") as EmployeeRole} /></td>
                      <td style={{ padding: "9px 12px" }}>
                        {ok ? (
                          <span style={{ color: "var(--cs-safe)", display: "flex", alignItems: "center", gap: 5 }}><CheckIcon /> OK</span>
                        ) : (
                          <span style={{ color: "var(--cs-critical)", fontSize: 12 }}>{row.errors.join(" · ")}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Drawer>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: EmployeeRole }) {
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.2, color: ROLE_COLORS[role], background: `${ROLE_COLORS[role]}18`, border: `1.5px solid ${ROLE_COLORS[role]}` }}>
      {ROLE_LABELS[role]}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
  const [roleFilter, setRoleFilter] = useState<"all" | EmployeeRole>("all");
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAllEmployees();
    setEmployees(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (statusFilter === "active"   && !e.active) return false;
      if (statusFilter === "inactive" &&  e.active) return false;
      if (roleFilter !== "all" && e.role !== roleFilter) return false;
      if (q) {
        const fullName = employeeFullName(e).toLowerCase();
        return fullName.includes(q) || e.email.includes(q) || (e.crewName ?? "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [employees, search, statusFilter, roleFilter]);

  const counts = useMemo(() => ({
    total:      employees.length,
    active:     employees.filter((e) => e.active).length,
    supervisor: employees.filter((e) => e.role === "supervisor").length,
    crew:       employees.filter((e) => e.role === "crew").length,
  }), [employees]);

  async function handleToggleActive(emp: Employee) {
    setTogglingId(emp.id);
    await setEmployeeActive(emp.id, !emp.active);
    await load();
    setTogglingId(null);
  }

  function supervisorName(supervisorId?: string) {
    if (!supervisorId) return "—";
    const s = employees.find((e) => e.id === supervisorId);
    return s ? employeeFullName(s) : "—";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, borderBottom: "2px solid var(--cs-line)", paddingBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, textTransform: "uppercase", letterSpacing: 0.3, lineHeight: 1 }}>Employees</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cs-muted)", marginTop: 4 }}>Roster, org chart &amp; crew assignments</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setImportOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 16px", borderRadius: 10, border: "2px solid var(--cs-line-strong)", background: "var(--cs-card)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, textTransform: "uppercase", letterSpacing: 0.3, color: "var(--cs-ink2)", minHeight: 0 }}>
            <UploadIcon /> Import CSV / Excel
          </button>
          <button onClick={() => { setEditingEmployee(null); setAddDrawerOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 16px", borderRadius: 10, background: "var(--cs-hiviz)", border: "2px solid var(--cs-ink)", boxShadow: "0 3px 0 var(--cs-ink)", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: 0.3, color: "var(--cs-ink)", minHeight: 0 }}>
            <PlusIcon /> Add Employee
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        {[
          { label: "Total",        value: counts.total,      accent: "var(--cs-ink)"     },
          { label: "Active",       value: counts.active,     accent: "var(--cs-safe)"    },
          { label: "Supervisors",  value: counts.supervisor, accent: "var(--cs-caution)" },
          { label: "Crew Members", value: counts.crew,       accent: "var(--cs-info)"    },
        ].map((k) => (
          <div key={k.label} style={{ background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 14, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, background: k.accent }} />
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 38, lineHeight: 1, color: "var(--cs-ink)" }}>{k.value}</div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12.5, letterSpacing: 0.4, color: "var(--cs-ink2)", textTransform: "uppercase", marginTop: 8 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters row */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 280 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--cs-faint)" }}><SearchIcon /></span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, crew…" style={{ ...inputSx, paddingLeft: 40, height: 42 }} />
        </div>
        <div style={{ display: "flex", gap: 5, background: "var(--cs-paper-deep)", padding: 4, borderRadius: 10, border: "1.5px solid var(--cs-line)" }}>
          {(["all", "active", "inactive"] as const).map((f) => (
            <button key={f} onClick={() => setStatusFilter(f)} style={{ padding: "7px 14px", borderRadius: 7, cursor: "pointer", border: "none", background: statusFilter === f ? "var(--cs-ink)" : "transparent", color: statusFilter === f ? "#fff" : "var(--cs-ink2)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, letterSpacing: 0.3, textTransform: "uppercase", minHeight: 0 }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as "all" | EmployeeRole)} style={{ ...inputSx, height: 42, width: "auto", padding: "0 14px" }}>
          <option value="all">All Roles</option>
          <option value="crew">Crew</option>
          <option value="supervisor">Supervisor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "var(--cs-card)", border: "2px solid var(--cs-line)", borderRadius: 16, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: 999, border: "3px solid var(--cs-hiviz)", borderTopColor: "transparent", animation: "cs-spin 0.8s linear infinite", margin: "0 auto 14px" }} />
            <div style={{ fontFamily: "var(--font-body)", color: "var(--cs-muted)" }}>Loading employees…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", fontFamily: "var(--font-body)", color: "var(--cs-muted)" }}>
            {employees.length === 0 ? "No employees yet. Add your first employee or import a roster." : "No employees match these filters."}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block">
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.6fr 1fr 1.4fr 1.2fr 120px", gap: 14, padding: "12px 20px", background: "var(--cs-paper-deep)", borderBottom: "2px solid var(--cs-line)" }}>
                {["Employee", "Email", "Role", "Supervisor", "Crew", "Status"].map((h) => (
                  <span key={h} style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, letterSpacing: 0.6, color: "var(--cs-muted)", textTransform: "uppercase" }}>{h}</span>
                ))}
              </div>
              {filtered.map((emp) => (
                <div key={emp.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.6fr 1fr 1.4fr 1.2fr 120px", gap: 14, padding: "14px 20px", alignItems: "center", borderBottom: "1.5px solid var(--cs-line)", opacity: emp.active ? 1 : 0.55 }}
                  className="hover:bg-cs-paper-deep cursor-pointer transition-colors"
                  onClick={() => { setEditingEmployee(emp); setAddDrawerOpen(true); }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                    <Avatar name={employeeFullName(emp)} size={34} color={emp.active ? "var(--cs-ink)" : "var(--cs-muted)"} />
                    <div>
                      <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14.5, color: "var(--cs-ink)" }}>{employeeFullName(emp)}</div>
                      {emp.phone && <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--cs-faint)" }}>{emp.phone}</div>}
                    </div>
                  </div>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--cs-ink2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.email}</span>
                  <RoleBadge role={emp.role} />
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--cs-ink2)" }}>{supervisorName(emp.supervisorId)}</span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--cs-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.crewName || "—"}</span>
                  <div style={{ display: "flex", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleToggleActive(emp)} disabled={togglingId === emp.id} style={{ padding: "5px 12px", borderRadius: 7, cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.2, border: `1.5px solid ${emp.active ? "var(--cs-critical)" : "var(--cs-safe)"}`, color: emp.active ? "var(--cs-critical)" : "var(--cs-safe)", background: "transparent", minHeight: 0 }}>
                      {togglingId === emp.id ? "…" : emp.active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile card list */}
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }} className="lg:hidden">
              {filtered.map((emp) => (
                <div key={emp.id} onClick={() => { setEditingEmployee(emp); setAddDrawerOpen(true); }} style={{ background: "var(--cs-paper)", border: "2px solid var(--cs-line)", borderRadius: 14, padding: 14, cursor: "pointer", opacity: emp.active ? 1 : 0.55 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar name={employeeFullName(emp)} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15 }}>{employeeFullName(emp)}</div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cs-muted)" }}>{emp.email}</div>
                    </div>
                    <RoleBadge role={emp.role} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1.5px solid var(--cs-line)", marginTop: 12, paddingTop: 12 }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--cs-muted)" }}>{emp.crewName || "No crew"}</span>
                    <button onClick={(e) => { e.stopPropagation(); handleToggleActive(emp); }} style={{ padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11.5, textTransform: "uppercase", border: `1.5px solid ${emp.active ? "var(--cs-critical)" : "var(--cs-safe)"}`, color: emp.active ? "var(--cs-critical)" : "var(--cs-safe)", background: "transparent", minHeight: 0 }}>
                      {emp.active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Drawers */}
      {(addDrawerOpen || editingEmployee) && (
        <EmployeeDrawer
          onClose={() => { setAddDrawerOpen(false); setEditingEmployee(null); }}
          onSaved={() => { setAddDrawerOpen(false); setEditingEmployee(null); load(); }}
          editingEmployee={editingEmployee}
          allEmployees={employees}
        />
      )}
      {importOpen && (
        <ImportDrawer
          onClose={() => setImportOpen(false)}
          onImported={() => { setImportOpen(false); load(); }}
          existingEmployees={employees}
        />
      )}
    </div>
  );
}
