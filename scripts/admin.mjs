#!/usr/bin/env node
/**
 * Manage admin access for Hard Hat League.
 *
 * The employees collection is the source of truth; the `admin` custom claim on
 * the Firebase user is derived from it. This script writes the roster entry and
 * pushes the claim in one step so the two never drift.
 *
 * Authenticates with Application Default Credentials — no service account key,
 * which the org policy forbids. Run `gcloud auth application-default login`
 * first if it complains.
 *
 *   node scripts/admin.mjs list
 *   node scripts/admin.mjs grant <email> [firstName] [lastName]
 *   node scripts/admin.mjs revoke <email>
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";

// Pull the project id out of .env.local so this can't target the wrong project.
function envValue(key) {
  const line = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .find((l) => l.startsWith(`${key}=`));
  return line?.slice(key.length + 1).trim().replace(/^["']|["']$/g, "") ?? "";
}

const projectId = envValue("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
if (!projectId) {
  console.error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set in .env.local");
  process.exit(1);
}

const app = initializeApp({ credential: applicationDefault(), projectId }, "cli");
const db = getFirestore(app);
const auth = getAuth(app);

const [command, rawEmail, firstName, lastName] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();

/** Pushes the claim onto the Firebase user, if one exists yet. */
async function pushClaim(addr, shouldBeAdmin) {
  let user;
  try {
    user = await auth.getUserByEmail(addr);
  } catch (err) {
    if (err?.code === "auth/user-not-found") {
      console.log("  (no Firebase user yet — the claim will be applied at first sign-in)");
      return;
    }
    throw err;
  }

  const { admin: _drop, ...rest } = user.customClaims ?? {};
  await auth.setCustomUserClaims(user.uid, shouldBeAdmin ? { ...rest, admin: true } : rest);
  // Force a fresh ID token so the change takes effect immediately rather than
  // waiting up to an hour for the current one to expire.
  await auth.revokeRefreshTokens(user.uid);
  console.log(`  claim ${shouldBeAdmin ? "granted" : "revoked"} on uid ${user.uid}; sessions invalidated`);
}

async function findEmployee(addr) {
  const snap = await db.collection("employees").where("email", "==", addr).limit(1).get();
  return snap.empty ? null : snap.docs[0];
}

switch (command) {
  case "list": {
    const snap = await db.collection("employees").where("role", "==", "admin").get();
    if (snap.empty) {
      console.log("No admins in the roster.");
      break;
    }
    console.log(`Admins (${snap.size}):`);
    for (const d of snap.docs) {
      const e = d.data();
      let claim = "no firebase user";
      try {
        claim =
          (await auth.getUserByEmail(e.email)).customClaims?.admin === true
            ? "claim ✓"
            : "claim ✗";
      } catch {
        /* leave as-is */
      }
      console.log(
        `  ${e.active ? "●" : "○"} ${e.email.padEnd(34)} ${e.firstName} ${e.lastName}  [${claim}]`
      );
    }
    break;
  }

  case "grant": {
    if (!email) {
      console.error("usage: admin.mjs grant <email> [firstName] [lastName]");
      process.exit(1);
    }
    const existing = await findEmployee(email);

    if (existing) {
      await existing.ref.update({
        role: "admin",
        active: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`Promoted existing employee ${email} to admin.`);
    } else {
      await db.collection("employees").add({
        firstName: firstName ?? email.split("@")[0],
        lastName: lastName ?? "",
        email,
        phone: "",
        role: "admin",
        active: true,
        points: 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`Created admin employee ${email}.`);
    }
    await pushClaim(email, true);
    break;
  }

  case "revoke": {
    if (!email) {
      console.error("usage: admin.mjs revoke <email>");
      process.exit(1);
    }
    const existing = await findEmployee(email);
    if (existing) {
      await existing.ref.update({ role: "employee", updatedAt: FieldValue.serverTimestamp() });
      console.log(`Demoted ${email} to employee.`);
    } else {
      console.log(`No roster entry for ${email}.`);
    }
    await pushClaim(email, false);
    break;
  }

  default:
    console.log("usage: node scripts/admin.mjs <list|grant|revoke> [email] [firstName] [lastName]");
    process.exit(1);
}

process.exit(0);
