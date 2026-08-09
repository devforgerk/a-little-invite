export type TemplateId = "playful" | "sincere";
export type ResponseChoice = "yes" | "adjust" | "no";
export type ActivityId = "coffee" | "dinner" | "walk" | "movie" | "outing" | "custom";
export type TimeMode = "fixed" | "recipient";

export type InvitationDraft = {
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

export type InvitationData = InvitationDraft & {
  templateId: TemplateId;
  state: "open" | "responded" | "expired";
  createdAt: string;
  expiresAt: string;
};

export const templates = [
  {
    id: "playful" as const,
    name: "Warm & playful",
    description: "Bright, cheeky, and full of little sparks.",
  },
  {
    id: "sincere" as const,
    name: "Soft & sincere",
    description: "Calm, thoughtful, and quietly romantic.",
  },
];

export const activities = [
  { id: "coffee" as const, label: "Coffee", invitationPhrase: "coffee" },
  { id: "dinner" as const, label: "Dinner", invitationPhrase: "dinner together" },
  { id: "walk" as const, label: "A walk", invitationPhrase: "a slow walk" },
  { id: "movie" as const, label: "Movie", invitationPhrase: "a movie" },
  { id: "outing" as const, label: "Tiny outing", invitationPhrase: "a tiny outing" },
  { id: "custom" as const, label: "Custom plan", invitationPhrase: "a little plan" },
];

export const responseLabels: Record<ResponseChoice, string> = {
  yes: "I’d love to",
  adjust: "Let’s adjust it",
  no: "Not this time",
};

export const defaultDraft: InvitationDraft = {
  fromName: "Alex",
  toName: "Sam",
  activities: ["coffee"],
  customActivity: "",
  place: "That cozy place we keep talking about",
  date: "",
  timeMode: "fixed",
  time: "18:30",
  message: "No grand occasion. I would just really like a little time with you.",
};

export function getActivity(id: ActivityId) {
  return activities.find((activity) => activity.id === id) ?? activities[0];
}

export function getActivityLabel(id: ActivityId, customActivity = "") {
  if (id === "custom") return customActivity.trim() || "Custom plan";
  return getActivity(id).label;
}

export function formatDate(value: string) {
  if (!value) return "A day we choose together";

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function formatTime(value: string) {
  if (!value) return "Whenever feels right";

  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
}
