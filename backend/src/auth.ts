import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createRecord, listRecords } from "./airtable";
import { requireEnv } from "./env";
import { mapAuthUser, toAuthUserFields } from "./mappers";
import { getTeamMembers } from "./services";
import {
  TABLES,
  type AccessLevel,
  type AuthUser,
  type LoginInput,
  type SessionUser,
  type SignupInput,
} from "./types";

const TOKEN_TTL = "7d";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getAuthSecret() {
  return requireEnv("AUTH_SECRET");
}

function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((part) => normalizeEmail(part))
      .filter(Boolean),
  );
}

function publicUser(user: { id: string; email: string; name: string }): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const records = await listRecords(TABLES.users);
  const users = records.map(mapAuthUser);
  return users.find((user) => user.email === normalized) || null;
}

export async function resolveAccess(email: string): Promise<AccessLevel> {
  const normalized = normalizeEmail(email);
  if (getAdminEmails().has(normalized)) return "full";

  const members = await getTeamMembers();
  const invited = members.some(
    (member) => normalizeEmail(member.email) === normalized && !member.deleted,
  );
  return invited ? "full" : "readonly";
}

export function signToken(user: AuthUser) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
    },
    getAuthSecret(),
    { expiresIn: TOKEN_TTL },
  );
}

export function verifyToken(token: string): { id: string; email: string; name: string } {
  const payload = jwt.verify(token, getAuthSecret()) as {
    sub?: string;
    email?: string;
    name?: string;
  };
  if (!payload.sub || !payload.email) {
    throw new Error("Invalid token");
  }
  return {
    id: payload.sub,
    email: normalizeEmail(payload.email),
    name: payload.name || "",
  };
}

export async function signup(input: SignupInput): Promise<{
  token: string;
  user: SessionUser;
}> {
  const email = normalizeEmail(input.email || "");
  const password = input.password || "";
  const name = (input.name || "").trim() || email.split("@")[0] || "User";

  if (!email || !email.includes("@")) {
    throw Object.assign(new Error("A valid email is required"), { statusCode: 400 });
  }
  if (password.length < 8) {
    throw Object.assign(new Error("Password must be at least 8 characters"), {
      statusCode: 400,
    });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    throw Object.assign(new Error("An account with this email already exists"), {
      statusCode: 409,
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [record] = await createRecord(
    TABLES.users,
    toAuthUserFields({ email, name, passwordHash }),
  ).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    if (/NOT_FOUND|could not be found|Unknown model|Users/i.test(message)) {
      throw Object.assign(
        new Error(
          'Airtable table "Users" is missing. Create it with Email, Name, and Password Hash fields.',
        ),
        { statusCode: 500 },
      );
    }
    throw error;
  });
  const created = mapAuthUser(record);
  const access = await resolveAccess(created.email);
  const user: SessionUser = { ...publicUser(created), access };
  return { token: signToken(user), user };
}

export async function login(input: LoginInput): Promise<{
  token: string;
  user: SessionUser;
}> {
  const email = normalizeEmail(input.email || "");
  const password = input.password || "";

  if (!email || !password) {
    throw Object.assign(new Error("Email and password are required"), {
      statusCode: 400,
    });
  }

  const found = await findUserByEmail(email);
  if (!found?.passwordHash) {
    throw Object.assign(new Error("Invalid email or password"), { statusCode: 401 });
  }

  const ok = await bcrypt.compare(password, found.passwordHash);
  if (!ok) {
    throw Object.assign(new Error("Invalid email or password"), { statusCode: 401 });
  }

  const access = await resolveAccess(found.email);
  const user: SessionUser = { ...publicUser(found), access };
  return { token: signToken(user), user };
}

export async function sessionFromToken(token: string): Promise<SessionUser> {
  const base = verifyToken(token);
  const access = await resolveAccess(base.email);
  return { ...base, access };
}
