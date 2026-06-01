/**
 * Creates a Firebase Auth admin user using the project's web API key.
 * No service account or extra packages required — reads from .env.local.
 *
 * Usage:
 *   node scripts/create-admin.mjs <email> <password>
 *
 * Example:
 *   node scripts/create-admin.mjs admin@mycompany.com MyP@ssw0rd
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Read .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = join(__dirname, "..", ".env.local");
  try {
    const raw = readFileSync(envPath, "utf-8");
    return Object.fromEntries(
      raw
        .split("\n")
        .filter((l) => l.trim() && !l.startsWith("#") && l.includes("="))
        .map((l) => {
          const idx = l.indexOf("=");
          return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
        })
    );
  } catch {
    console.error("✗  Could not read .env.local — make sure it exists at the project root.");
    process.exit(1);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage:  node scripts/create-admin.mjs <email> <password>");
  console.error("Example: node scripts/create-admin.mjs admin@company.com MyP@ssword");
  process.exit(1);
}

const env = loadEnv();
const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!apiKey) {
  console.error("✗  NEXT_PUBLIC_FIREBASE_API_KEY not found in .env.local");
  process.exit(1);
}

console.log(`\nCreating admin user: ${email} …`);

const res = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: false }),
  }
);

const data = await res.json();

if (data.error) {
  const msg = data.error.message;
  if (msg === "EMAIL_EXISTS") {
    console.error("✗  That email is already registered. Use a different address or log in directly.");
  } else if (msg === "WEAK_PASSWORD : Password should be at least 6 characters") {
    console.error("✗  Password must be at least 6 characters.");
  } else {
    console.error(`✗  Firebase error: ${msg}`);
  }
  process.exit(1);
}

console.log(`\n✓  Admin user created successfully`);
console.log(`   Email : ${data.email}`);
console.log(`   UID   : ${data.localId}`);
console.log(`\nYou can now sign in at http://localhost:3000/login\n`);
