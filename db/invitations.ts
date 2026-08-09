import { env } from "cloudflare:workers";

const templateIds = ["playful", "sincere"] as const;
const activityIds = ["coffee", "dinner", "walk", "movie", "outing", "custom"] as const;
const responseChoices = ["yes", "adjust", "no"] as const;
const timeModes = ["fixed", "recipient"] as const;

type TemplateId = (typeof templateIds)[number];
type ActivityId = (typeof activityIds)[number];
type TimeMode = (typeof timeModes)[number];
export type ResponseChoice = (typeof responseChoices)[number];
export type InvitationState = "open" | "responded" | "expired";

export type InvitationInput = {
  templateId: TemplateId;
  fromName: string;
  toName: string;
  activities: ActivityId[];
  customActivity: string;
  place: string;
  date: string;
  timeMode: TimeMode;
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
  activity_options?: string | null;
  selected_activity?: ActivityId | null;
  selected_activities?: string | null;
  preferred_time?: string | null;
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
    selectedActivities: ActivityId[];
    selectedActivity: ActivityId | null;
    preferredTime: string;
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
      database.prepare("SELECT selected_activities FROM invitation_plans LIMIT 1"),
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
    database.prepare(`
      CREATE TABLE IF NOT EXISTS invitation_plans (
        invitation_id TEXT PRIMARY KEY NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
        activity_options TEXT NOT NULL,
        selected_activity TEXT CHECK (
          selected_activity IS NULL OR
          selected_activity IN ('coffee', 'dinner', 'walk', 'movie', 'outing', 'custom')
        ),
        selected_activities TEXT,
        preferred_time TEXT
      )
    `),
  ]);

  const planColumns = await database
    .prepare("PRAGMA table_info(invitation_plans)")
    .all<{ name: string }>();
  if (!planColumns.results.some((column) => column.name === "selected_activities")) {
    try {
      await database
        .prepare("ALTER TABLE invitation_plans ADD COLUMN selected_activities TEXT")
        .run();
    } catch (error) {
      const currentColumns = await database
        .prepare("PRAGMA table_info(invitation_plans)")
        .all<{ name: string }>();
      if (!currentColumns.results.some((column) => column.name === "selected_activities")) {
        throw error;
      }
    }
  }
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

function readActivities(body: Record<string, unknown>): ActivityId[] {
  const value = body.activities ?? (body.activity ? [body.activity] : null);
  if (!Array.isArray(value) || value.length === 0 || value.length > activityIds.length) {
    throw new InvitationValidationError("Choose at least one activity.");
  }

  const selected = value.map((activity) => readEnum(activity, activityIds, "Activity"));
  return [...new Set(selected)];
}

function readResponseActivities(body: Record<string, unknown>): ActivityId[] {
  const legacyActivity = body.selectedActivity;
  const value =
    body.selectedActivities ??
    (legacyActivity === null || legacyActivity === undefined || legacyActivity === ""
      ? []
      : [legacyActivity]);

  if (!Array.isArray(value) || value.length > activityIds.length) {
    throw new InvitationValidationError("Preferred activities are not valid.");
  }

  const selected = value.map((activity) =>
    readEnum(activity, activityIds, "Preferred activity"),
  );
  return [...new Set(selected)];
}

function isRealDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export function parseInvitationInput(value: unknown): InvitationInput {
  const body = readObject(value);
  const selectedActivities = readActivities(body);
  const customActivity = readText(body.customActivity ?? "", "Custom plan", 60, {
    required: selectedActivities.includes("custom"),
  });
  const date = readText(body.date, "Date", 10);
  const timeMode = readEnum(
    body.timeMode ?? (body.time ? "fixed" : "recipient"),
    timeModes,
    "Time choice",
  );
  const time = readText(body.time ?? "", "Time", 5, { required: timeMode === "fixed" });

  if (!isRealDate(date)) {
    throw new InvitationValidationError("Choose a valid date.");
  }
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new InvitationValidationError("Choose a valid time.");
  }

  return {
    templateId: readEnum(body.templateId, templateIds, "Invitation feeling"),
    fromName: readText(body.fromName, "Your name", 40),
    toName: readText(body.toName, "Their name", 40),
    activities: selectedActivities,
    customActivity,
    place: readText(body.place, "Place", 100),
    date,
    timeMode,
    time,
    message: readText(body.message, "Personal note", 220),
  };
}

export function parseResponseInput(value: unknown) {
  const body = readObject(value);
  const selectedActivities = readResponseActivities(body);
  const preferredTime = readText(body.preferredTime ?? "", "Preferred time", 5, {
    required: false,
  });

  if (preferredTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(preferredTime)) {
    throw new InvitationValidationError("Choose a valid preferred time.");
  }

  return {
    choice: readEnum(body.choice, responseChoices, "Response"),
    note: readText(body.note ?? "", "Response note", 320, { required: false }),
    selectedActivities,
    preferredTime,
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

function readStoredActivities(activityOptions: string | null | undefined, fallback: ActivityId) {
  if (activityOptions) {
    try {
      const stored = JSON.parse(activityOptions) as unknown;
      if (Array.isArray(stored)) {
        const valid = stored.filter(
          (activity): activity is ActivityId =>
            typeof activity === "string" && activityIds.includes(activity as ActivityId),
        );
        const unique = [...new Set(valid)];
        if (unique.length > 0) return unique;
      }
    } catch {
      // Fall back to the original single activity for older or malformed records.
    }
  }

  return [fallback];
}

function readStoredSelectedActivities(
  selectedActivities: string | null | undefined,
  fallback: ActivityId | null | undefined,
) {
  if (selectedActivities !== null && selectedActivities !== undefined) {
    try {
      const stored = JSON.parse(selectedActivities) as unknown;
      if (Array.isArray(stored)) {
        const valid = stored.filter(
          (activity): activity is ActivityId =>
            typeof activity === "string" && activityIds.includes(activity as ActivityId),
        );
        return [...new Set(valid)];
      }
    } catch {
      // Fall back to the original single response value for older records.
    }
  }

  return fallback ? [fallback] : [];
}

function activitiesFor(row: InvitationRow): ActivityId[] {
  return readStoredActivities(row.activity_options, row.activity);
}

function invitationFor(row: InvitationRow): InvitationView {
  return {
    templateId: row.template_id,
    fromName: row.from_name,
    toName: row.to_name,
    activities: activitiesFor(row),
    customActivity: row.custom_activity,
    place: row.place,
    date: row.event_date,
    timeMode: row.event_time ? "fixed" : "recipient",
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
    r.responded_at,
    p.activity_options,
    p.selected_activity,
    p.selected_activities,
    p.preferred_time
  FROM invitations i
  LEFT JOIN invitation_responses r ON r.invitation_id = i.id
  LEFT JOIN invitation_plans p ON p.invitation_id = i.id
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
      const [result] = await database.batch([
        database
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
            input.activities[0],
            input.customActivity,
            input.place,
            input.date,
            input.timeMode === "fixed" ? input.time : "",
            input.message,
            now,
            expiresAt,
          ),
        database
          .prepare(
            "INSERT INTO invitation_plans (invitation_id, activity_options) VALUES (?, ?)",
          )
          .bind(id, JSON.stringify(input.activities)),
      ]);

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

  const selectedActivities = readStoredSelectedActivities(
    row.selected_activities,
    row.selected_activity,
  );

  return {
    invitation: invitationFor(row),
    responseChoice: row.response_choice,
    response: row.response_choice
      ? {
          choice: row.response_choice,
          selectedActivities,
          selectedActivity: selectedActivities[0] ?? null,
          preferredTime: row.preferred_time ?? "",
        }
      : null,
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

  const selectedActivities = readStoredSelectedActivities(
    row.selected_activities,
    row.selected_activity,
  );

  return {
    invitation: invitationFor(row),
    publicToken: row.public_token,
    response:
      row.response_choice && row.responded_at
        ? {
            choice: row.response_choice,
            note: row.response_note ?? "",
            selectedActivities,
            selectedActivity: selectedActivities[0] ?? null,
            preferredTime: row.preferred_time ?? "",
            respondedAt: new Date(row.responded_at).toISOString(),
          }
        : null,
  };
}

export async function submitInvitationResponse(
  publicToken: string,
  response: {
    choice: ResponseChoice;
    note: string;
    selectedActivities: ActivityId[];
    preferredTime: string;
  },
) {
  await ensureSchema();
  const database = getDatabase();
  const invitation = await database
    .prepare(`
      SELECT i.id, i.status, i.expires_at, i.activity, i.event_time, p.activity_options
      FROM invitations i
      LEFT JOIN invitation_plans p ON p.invitation_id = i.id
      WHERE i.public_token = ?
      LIMIT 1
    `)
    .bind(publicToken)
    .first<{
      id: string;
      status: "open" | "responded";
      expires_at: number;
      activity: ActivityId;
      event_time: string;
      activity_options: string | null;
    }>();

  if (!invitation) return { outcome: "missing" as const };
  if (invitation.expires_at <= Date.now()) return { outcome: "expired" as const };
  if (invitation.status === "responded") return { outcome: "responded" as const };

  const offeredActivities = readStoredActivities(
    invitation.activity_options,
    invitation.activity,
  );
  let selectedActivities = response.choice === "no" ? [] : response.selectedActivities;
  const preferredTime =
    response.choice === "no" || invitation.event_time ? "" : response.preferredTime;

  if (selectedActivities.some((activity) => !offeredActivities.includes(activity))) {
    throw new InvitationValidationError("Choose only activities in this invitation.");
  }
  if (response.choice === "yes" && offeredActivities.length > 1 && selectedActivities.length === 0) {
    throw new InvitationValidationError("Choose at least one activity you would prefer.");
  }
  if (response.choice !== "no" && offeredActivities.length === 1) {
    selectedActivities = [offeredActivities[0]];
  }
  if (response.choice === "yes" && !invitation.event_time && !preferredTime) {
    throw new InvitationValidationError("Choose the time you would prefer.");
  }

  const respondedAt = Date.now();
  const [insertResult] = await database.batch([
    database
      .prepare(
        "INSERT OR IGNORE INTO invitation_responses (invitation_id, choice, note, responded_at) VALUES (?, ?, ?, ?)",
      )
      .bind(invitation.id, response.choice, response.note, respondedAt),
    database
      .prepare(`
        INSERT INTO invitation_plans (
          invitation_id, activity_options, selected_activity, selected_activities, preferred_time
        )
        SELECT ?, ?, ?, ?, ?
        WHERE EXISTS (
          SELECT 1 FROM invitation_responses
          WHERE invitation_id = ? AND responded_at = ?
        )
        ON CONFLICT(invitation_id) DO UPDATE SET
          selected_activity = excluded.selected_activity,
          selected_activities = excluded.selected_activities,
          preferred_time = excluded.preferred_time
      `)
      .bind(
        invitation.id,
        JSON.stringify(offeredActivities),
        selectedActivities[0] ?? null,
        JSON.stringify(selectedActivities),
        preferredTime || null,
        invitation.id,
        respondedAt,
      ),
    database
      .prepare(`
        UPDATE invitations
        SET status = 'responded'
        WHERE id = ? AND status = 'open' AND EXISTS (
          SELECT 1 FROM invitation_responses
          WHERE invitation_id = ? AND responded_at = ?
        )
      `)
      .bind(invitation.id, invitation.id, respondedAt),
  ]);

  if (!insertResult.success || insertResult.meta.changes !== 1) {
    return { outcome: "responded" as const };
  }

  return {
    outcome: "saved" as const,
    response: {
      choice: response.choice,
      selectedActivities,
      selectedActivity: selectedActivities[0] ?? null,
      preferredTime,
      respondedAt: new Date(respondedAt).toISOString(),
    },
  };
}
