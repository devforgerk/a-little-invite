import { env } from "cloudflare:workers";

const templateIds = ["playful", "sincere"] as const;
const activityIds = ["coffee", "dinner", "walk", "movie", "outing", "custom"] as const;
const responseChoices = ["yes", "adjust", "no"] as const;

type TemplateId = (typeof templateIds)[number];
type ActivityId = (typeof activityIds)[number];
export type ResponseChoice = (typeof responseChoices)[number];
export type InvitationState = "open" | "responded" | "expired";

export type InvitationInput = {
  templateId: TemplateId;
  fromName: string;
  toName: string;
  activity: ActivityId;
  customActivity: string;
  place: string;
  date: string;
  time: string;
  message: string;
};

type InvitationRow = {
  id: string;
  public_token: string;
  template_id: TemplateId;
  from_name: string;
  to_name: string;
  activity: ActivityId;
  custom_activity: string;
  place: string;
  event_date: string;
  event_time: string;
  message: string;
  status: "open" | "responded";
  created_at: number;
  expires_at: number;
  response_choice: ResponseChoice | null;
  response_note?: string | null;
  responded_at?: number | null;
};

export type InvitationView = InvitationInput & {
  state: InvitationState;
  createdAt: string;
  expiresAt: string;
};

export type StatusView = {
  invitation: InvitationView;
  publicToken: string;
  response: {
    choice: ResponseChoice;
    note: string;
    respondedAt: string;
  } | null;
};

export class InvitationValidationError extends Error {}

let schemaReady: Promise<void> | undefined;

function getDatabase() {
  if (!env.DB) {
    throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  }

  return env.DB;
}

async function initializeSchema() {
  const database = getDatabase();

  try {
    await database.batch([
      database.prepare("SELECT 1 FROM invitations LIMIT 1"),
      database.prepare("SELECT 1 FROM invitation_responses LIMIT 1"),
    ]);
    return;
  } catch {
    // A fresh local or hosted database still needs the self-bootstrapping schema below.
  }

  await database.batch([
    database.prepare(`
      CREATE TABLE IF NOT EXISTS invitations (
        id TEXT PRIMARY KEY NOT NULL,
        public_token TEXT NOT NULL UNIQUE,
        status_token_hash TEXT NOT NULL UNIQUE,
        template_id TEXT NOT NULL CHECK (template_id IN ('playful', 'sincere')),
        from_name TEXT NOT NULL,
        to_name TEXT NOT NULL,
        activity TEXT NOT NULL CHECK (activity IN ('coffee', 'dinner', 'walk', 'movie', 'outing', 'custom')),
        custom_activity TEXT NOT NULL DEFAULT '',
        place TEXT NOT NULL,
        event_date TEXT NOT NULL,
        event_time TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'responded')),
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      )
    `),
    database.prepare(
      "CREATE UNIQUE INDEX IF NOT EXISTS invitations_public_token_unique ON invitations (public_token)",
    ),
    database.prepare(
      "CREATE UNIQUE INDEX IF NOT EXISTS invitations_status_token_hash_unique ON invitations (status_token_hash)",
    ),
    database.prepare(
      "CREATE INDEX IF NOT EXISTS invitations_expires_at_index ON invitations (expires_at)",
    ),
    database.prepare(`
      CREATE TABLE IF NOT EXISTS invitation_responses (
        invitation_id TEXT PRIMARY KEY NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
        choice TEXT NOT NULL CHECK (choice IN ('yes', 'adjust', 'no')),
        note TEXT NOT NULL DEFAULT '',
        responded_at INTEGER NOT NULL
      )
    `),
    database.prepare(
      "CREATE INDEX IF NOT EXISTS invitation_responses_responded_at_index ON invitation_responses (responded_at)",
    ),
  ]);
}

async function ensureSchema() {
  schemaReady ??= initializeSchema().catch((error) => {
    schemaReady = undefined;
    throw error;
  });

  await schemaReady;
}

function readObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InvitationValidationError("Invitation details are missing.");
  }

  return value as Record<string, unknown>;
}

function readText(
  value: unknown,
  label: string,
  maxLength: number,
  options: { required?: boolean } = { required: true },
) {
  if (typeof value !== "string") {
    throw new InvitationValidationError(`${label} must be text.`);
  }

  const text = value.trim();
  if (options.required !== false && !text) {
    throw new InvitationValidationError(`${label} is required.`);
  }
  if (text.length > maxLength) {
    throw new InvitationValidationError(`${label} is too long.`);
  }

  return text;
}

function readEnum<const Value extends string>(
  value: unknown,
  allowed: readonly Value[],
  label: string,
): Value {
  if (typeof value !== "string" || !allowed.includes(value as Value)) {
    throw new InvitationValidationError(`${label} is not valid.`);
  }

  return value as Value;
}

function isRealDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export function parseInvitationInput(value: unknown): InvitationInput {
  const body = readObject(value);
  const activity = readEnum(body.activity, activityIds, "Activity");
  const customActivity = readText(body.customActivity ?? "", "Custom plan", 60, {
    required: activity === "custom",
  });
  const date = readText(body.date, "Date", 10);
  const time = readText(body.time, "Time", 5);

  if (!isRealDate(date)) {
    throw new InvitationValidationError("Choose a valid date.");
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new InvitationValidationError("Choose a valid time.");
  }

  return {
    templateId: readEnum(body.templateId, templateIds, "Invitation feeling"),
    fromName: readText(body.fromName, "Your name", 40),
    toName: readText(body.toName, "Their name", 40),
    activity,
    customActivity,
    place: readText(body.place, "Place", 100),
    date,
    time,
    message: readText(body.message, "Personal note", 220),
  };
}

export function parseResponseInput(value: unknown) {
  const body = readObject(value);

  return {
    choice: readEnum(body.choice, responseChoices, "Response"),
    note: readText(body.note ?? "", "Response note", 320, { required: false }),
  };
}

function randomToken(byteLength: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function expiryFor(eventDate: string, now: number) {
  const thirtyDays = now + 30 * 24 * 60 * 60 * 1000;
  const afterEvent = Date.parse(`${eventDate}T23:59:59Z`) + 7 * 24 * 60 * 60 * 1000;
  const oneYear = now + 365 * 24 * 60 * 60 * 1000;
  return Math.min(Math.max(thirtyDays, afterEvent), oneYear);
}

function stateFor(row: InvitationRow): InvitationState {
  if (row.status === "responded" || row.response_choice) return "responded";
  if (row.expires_at <= Date.now()) return "expired";
  return "open";
}

function invitationFor(row: InvitationRow): InvitationView {
  return {
    templateId: row.template_id,
    fromName: row.from_name,
    toName: row.to_name,
    activity: row.activity,
    customActivity: row.custom_activity,
    place: row.place,
    date: row.event_date,
    time: row.event_time,
    message: row.message,
    state: stateFor(row),
    createdAt: new Date(row.created_at).toISOString(),
    expiresAt: new Date(row.expires_at).toISOString(),
  };
}

const invitationSelect = `
  SELECT
    i.id,
    i.public_token,
    i.template_id,
    i.from_name,
    i.to_name,
    i.activity,
    i.custom_activity,
    i.place,
    i.event_date,
    i.event_time,
    i.message,
    i.status,
    i.created_at,
    i.expires_at,
    r.choice AS response_choice,
    r.note AS response_note,
    r.responded_at
  FROM invitations i
  LEFT JOIN invitation_responses r ON r.invitation_id = i.id
`;

export async function createInvitation(input: InvitationInput) {
  await ensureSchema();
  const database = getDatabase();
  const now = Date.now();
  const expiresAt = expiryFor(input.date, now);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const id = crypto.randomUUID();
    const publicToken = randomToken(24);
    const statusToken = randomToken(32);
    const statusTokenHash = await hashToken(statusToken);

    try {
      const result = await database
        .prepare(`
          INSERT INTO invitations (
            id, public_token, status_token_hash, template_id, from_name, to_name,
            activity, custom_activity, place, event_date, event_time, message,
            status, created_at, expires_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?)
        `)
        .bind(
          id,
          publicToken,
          statusTokenHash,
          input.templateId,
          input.fromName,
          input.toName,
          input.activity,
          input.customActivity,
          input.place,
          input.date,
          input.time,
          input.message,
          now,
          expiresAt,
        )
        .run();

      if (result.success) {
        return { publicToken, statusToken, expiresAt: new Date(expiresAt).toISOString() };
      }
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }

  throw new Error("Could not create a unique invitation.");
}

export async function getPublicInvitation(publicToken: string) {
  await ensureSchema();
  const row = await getDatabase()
    .prepare(`${invitationSelect} WHERE i.public_token = ? LIMIT 1`)
    .bind(publicToken)
    .first<InvitationRow>();

  if (!row) return null;

  return {
    invitation: invitationFor(row),
    responseChoice: row.response_choice,
  };
}

export async function getStatusInvitation(statusToken: string): Promise<StatusView | null> {
  await ensureSchema();
  const statusTokenHash = await hashToken(statusToken);
  const row = await getDatabase()
    .prepare(`${invitationSelect} WHERE i.status_token_hash = ? LIMIT 1`)
    .bind(statusTokenHash)
    .first<InvitationRow>();

  if (!row) return null;

  return {
    invitation: invitationFor(row),
    publicToken: row.public_token,
    response:
      row.response_choice && row.responded_at
        ? {
            choice: row.response_choice,
            note: row.response_note ?? "",
            respondedAt: new Date(row.responded_at).toISOString(),
          }
        : null,
  };
}

export async function submitInvitationResponse(
  publicToken: string,
  response: { choice: ResponseChoice; note: string },
) {
  await ensureSchema();
  const database = getDatabase();
  const invitation = await database
    .prepare("SELECT id, status, expires_at FROM invitations WHERE public_token = ? LIMIT 1")
    .bind(publicToken)
    .first<{ id: string; status: "open" | "responded"; expires_at: number }>();

  if (!invitation) return { outcome: "missing" as const };
  if (invitation.expires_at <= Date.now()) return { outcome: "expired" as const };
  if (invitation.status === "responded") return { outcome: "responded" as const };

  const respondedAt = Date.now();
  const [insertResult] = await database.batch([
    database
      .prepare(
        "INSERT OR IGNORE INTO invitation_responses (invitation_id, choice, note, responded_at) VALUES (?, ?, ?, ?)",
      )
      .bind(invitation.id, response.choice, response.note, respondedAt),
    database
      .prepare("UPDATE invitations SET status = 'responded' WHERE id = ? AND status = 'open'")
      .bind(invitation.id),
  ]);

  if (!insertResult.success || insertResult.meta.changes !== 1) {
    return { outcome: "responded" as const };
  }

  return {
    outcome: "saved" as const,
    response: {
      choice: response.choice,
      respondedAt: new Date(respondedAt).toISOString(),
    },
  };
}
