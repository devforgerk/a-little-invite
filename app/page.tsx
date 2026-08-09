"use client";

import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  MessageCircleHeart,
  MoonStar,
  PartyPopper,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type TemplateId = "playful" | "sincere";
type ResponseChoice = "yes" | "adjust" | "no";

type InvitationDraft = {
  fromName: string;
  toName: string;
  activity: string;
  customActivity: string;
  place: string;
  date: string;
  time: string;
  message: string;
};

const templates: Array<{
  id: TemplateId;
  name: string;
  description: string;
  icon: typeof Sparkles;
}> = [
  {
    id: "playful",
    name: "Warm & playful",
    description: "Bright, cheeky, and full of little sparks.",
    icon: Sparkles,
  },
  {
    id: "sincere",
    name: "Soft & sincere",
    description: "Calm, thoughtful, and quietly romantic.",
    icon: MoonStar,
  },
];

const steps = ["Feeling", "The plan", "Your note"];

const activities = [
  "Coffee",
  "Dinner",
  "A walk",
  "Movie",
  "Tiny outing",
  "Custom plan",
];

const defaultDraft: InvitationDraft = {
  fromName: "Alex",
  toName: "Sam",
  activity: "Coffee",
  customActivity: "",
  place: "That cozy place we keep talking about",
  date: "",
  time: "18:30",
  message:
    "No grand occasion. I would just really like a little time with you.",
};

function formatDate(value: string) {
  if (!value) return "A day we choose together";

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatTime(value: string) {
  if (!value) return "Whenever feels right";

  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function responseCopy(choice: ResponseChoice, fromName: string) {
  if (choice === "yes") {
    return {
      icon: PartyPopper,
      title: `That just made ${fromName || "their"} day.`,
      text: "A tiny yes can make a very ordinary day feel special.",
    };
  }

  if (choice === "adjust") {
    return {
      icon: MessageCircleHeart,
      title: "A little planning together sounds perfect.",
      text: "The answer is warm, and the details can wait for a conversation.",
    };
  }

  return {
    icon: Heart,
    title: "Thank you for answering honestly.",
    text: "Kind invitations should always leave room for a kind no.",
  };
}

function InvitationPreview({
  draft,
  templateId,
  interactive = false,
  response,
  onResponse,
}: {
  draft: InvitationDraft;
  templateId: TemplateId;
  interactive?: boolean;
  response: ResponseChoice | null;
  onResponse?: (choice: ResponseChoice) => void;
}) {
  const activity =
    draft.activity === "Custom plan"
      ? draft.customActivity.trim() || "a little plan"
      : draft.activity;
  const answer = response ? responseCopy(response, draft.fromName) : null;
  const AnswerIcon = answer?.icon;

  return (
    <article
      className={`invitation-preview template-${templateId}`}
      aria-label={`${templates.find((template) => template.id === templateId)?.name} invitation preview`}
    >
      <div className="preview-decoration" aria-hidden="true">
        {templateId === "playful" ? (
          <>
            <span className="paper-mark paper-mark-one" />
            <span className="paper-mark paper-mark-two" />
            <span className="paper-mark paper-mark-three" />
            <span className="paper-mark paper-mark-four" />
          </>
        ) : (
          <>
            <MoonStar className="quiet-moon" strokeWidth={1.5} />
            <Heart className="quiet-heart" fill="currentColor" strokeWidth={1.5} />
          </>
        )}
      </div>

      <header className="preview-header">
        <span className="preview-stamp">
          {templateId === "playful" ? (
            <Sparkles size={15} aria-hidden="true" />
          ) : (
            <Heart size={15} aria-hidden="true" />
          )}
          A little invitation from {draft.fromName || "someone special"}
        </span>
        <span className="preview-number" aria-hidden="true">
          01
        </span>
      </header>

      <div className="preview-copy">
        <div className="preview-illustration" aria-hidden="true">
          {templateId === "playful" ? (
            <span className="coffee-cup">☕</span>
          ) : (
            <span className="letter-heart">♡</span>
          )}
        </div>
        <p className="preview-greeting">Hey {draft.toName || "you"},</p>
        <h2>Would you join me for {activity.toLowerCase()}?</h2>
        <p className="preview-message">“{draft.message || "I saved this moment for you."}”</p>
      </div>

      <dl className="preview-details">
        <div>
          <CalendarDays size={18} aria-hidden="true" />
          <dt>Day</dt>
          <dd>{formatDate(draft.date)}</dd>
        </div>
        <div>
          <Clock3 size={18} aria-hidden="true" />
          <dt>Time</dt>
          <dd>{formatTime(draft.time)}</dd>
        </div>
        <div>
          <MapPin size={18} aria-hidden="true" />
          <dt>Place</dt>
          <dd>{draft.place || "Somewhere we both like"}</dd>
        </div>
      </dl>

      <div className="preview-response" aria-live="polite">
        {answer && AnswerIcon ? (
          <div className={`response-result response-${response}`}>
            <AnswerIcon size={28} aria-hidden="true" />
            <div>
              <h3>{answer.title}</h3>
              <p>{answer.text}</p>
            </div>
          </div>
        ) : (
          <>
            <p className="response-prompt">What does your heart say?</p>
            <div className="response-actions">
              <button
                type="button"
                disabled={!interactive}
                onClick={() => onResponse?.("yes")}
              >
                <Check size={17} aria-hidden="true" />
                I’d love to
              </button>
              <button
                type="button"
                disabled={!interactive}
                onClick={() => onResponse?.("adjust")}
              >
                <MessageCircleHeart size={17} aria-hidden="true" />
                Adjust it
              </button>
              <button
                type="button"
                disabled={!interactive}
                onClick={() => onResponse?.("no")}
              >
                Not this time
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

export default function Home() {
  const [step, setStep] = useState(0);
  const [templateId, setTemplateId] = useState<TemplateId>("playful");
  const [draft, setDraft] = useState<InvitationDraft>(defaultDraft);
  const [showRecipientView, setShowRecipientView] = useState(false);
  const [previewResponse, setPreviewResponse] =
    useState<ResponseChoice | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === templateId) ?? templates[0],
    [templateId],
  );
  const SelectedTemplateIcon = selectedTemplate.icon;

  function updateDraft<Key extends keyof InvitationDraft>(
    key: Key,
    value: InvitationDraft[Key],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function openRecipientView() {
    setPreviewResponse(null);
    setShowRecipientView(true);
  }

  return (
    <main className="min-h-screen bg-[#f4f1ec] text-[#292724]">
      <header className="border-b border-[#292724]/12 bg-[#fbfaf7] px-4 sm:px-7">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-[#292724] text-white">
              <Heart size={19} fill="currentColor" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-black">A Little Invite</p>
              <p className="truncate text-xs text-[#68625b]">Make a moment, not a message.</p>
            </div>
          </div>
          <span className="hidden items-center gap-2 text-sm font-semibold text-[#68625b] sm:flex">
            <WandSparkles size={17} aria-hidden="true" />
            Invitation studio
          </span>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(360px,0.78fr)_minmax(520px,1.22fr)]">
        <section className="border-b border-[#292724]/12 bg-[#fbfaf7] px-4 py-7 sm:px-7 lg:border-b-0 lg:border-r lg:py-9">
          <div className="mx-auto max-w-xl">
            <div className="mb-7">
              <p className="mb-2 text-sm font-bold text-[#b74734]">Create an invitation</p>
              <h1 className="max-w-lg text-3xl font-black leading-tight sm:text-4xl">
                Ask with a little more feeling.
              </h1>
            </div>

            <nav aria-label="Invitation steps" className="step-nav mb-8">
              {steps.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className={index === step ? "is-current" : index < step ? "is-complete" : ""}
                  onClick={() => setStep(index)}
                  aria-current={index === step ? "step" : undefined}
                >
                  <span>{index < step ? <Check size={14} aria-hidden="true" /> : index + 1}</span>
                  {label}
                </button>
              ))}
            </nav>

            <div className="min-h-[420px]">
              {step === 0 && (
                <div className="form-section">
                  <div>
                    <h2>Choose the feeling</h2>
                    <p>The same invitation can carry a completely different energy.</p>
                  </div>

                  <div className="template-picker" role="radiogroup" aria-label="Invitation feeling">
                    {templates.map((template) => {
                      const Icon = template.icon;
                      const selected = template.id === templateId;
                      return (
                        <button
                          key={template.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          className={selected ? "is-selected" : ""}
                          onClick={() => setTemplateId(template.id)}
                        >
                          <span className={`template-icon template-icon-${template.id}`}>
                            <Icon size={20} aria-hidden="true" />
                          </span>
                          <span>
                            <strong>{template.name}</strong>
                            <small>{template.description}</small>
                          </span>
                          <span className="template-check">
                            {selected && <Check size={14} aria-hidden="true" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="field-label">
                      Your name
                      <input
                        className="field-input"
                        value={draft.fromName}
                        maxLength={40}
                        onChange={(event) => updateDraft("fromName", event.target.value)}
                        placeholder="Alex"
                      />
                    </label>
                    <label className="field-label">
                      Their name
                      <input
                        className="field-input"
                        value={draft.toName}
                        maxLength={40}
                        onChange={(event) => updateDraft("toName", event.target.value)}
                        placeholder="Sam"
                      />
                    </label>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="form-section">
                  <div>
                    <h2>Shape the plan</h2>
                    <p>Give them enough detail to picture the moment.</p>
                  </div>

                  <label className="field-label">
                    What are you inviting them to?
                    <select
                      className="field-input"
                      value={draft.activity}
                      onChange={(event) => updateDraft("activity", event.target.value)}
                    >
                      {activities.map((activity) => (
                        <option key={activity}>{activity}</option>
                      ))}
                    </select>
                  </label>

                  {draft.activity === "Custom plan" && (
                    <label className="field-label">
                      Name your plan
                      <input
                        className="field-input"
                        value={draft.customActivity}
                        maxLength={60}
                        onChange={(event) => updateDraft("customActivity", event.target.value)}
                        placeholder="A sunset picnic"
                      />
                    </label>
                  )}

                  <label className="field-label">
                    Place
                    <span className="input-with-icon">
                      <MapPin size={18} aria-hidden="true" />
                      <input
                        className="field-input"
                        value={draft.place}
                        maxLength={100}
                        onChange={(event) => updateDraft("place", event.target.value)}
                        placeholder="A favorite cafe or meeting spot"
                      />
                    </span>
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="field-label">
                      Date
                      <input
                        type="date"
                        className="field-input"
                        value={draft.date}
                        onChange={(event) => updateDraft("date", event.target.value)}
                      />
                    </label>
                    <label className="field-label">
                      Time
                      <input
                        type="time"
                        className="field-input"
                        value={draft.time}
                        onChange={(event) => updateDraft("time", event.target.value)}
                      />
                    </label>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="form-section">
                  <div>
                    <h2>Say it in your voice</h2>
                    <p>A short honest note usually lands better than a perfect speech.</p>
                  </div>

                  <label className="field-label">
                    Personal note
                    <textarea
                      className="field-input min-h-36 resize-none"
                      value={draft.message}
                      maxLength={220}
                      onChange={(event) => updateDraft("message", event.target.value)}
                      placeholder="What would you really like them to know?"
                    />
                    <span className="character-count">{draft.message.length}/220</span>
                  </label>

                  <div className="review-band">
                    <span className={`template-icon template-icon-${templateId}`}>
                      <SelectedTemplateIcon size={20} aria-hidden="true" />
                    </span>
                    <div>
                      <strong>{selectedTemplate.name}</strong>
                      <p>
                        {draft.activity === "Custom plan"
                          ? draft.customActivity || "Custom plan"
                          : draft.activity}
                        {draft.toName ? ` for ${draft.toName}` : ""}
                      </p>
                    </div>
                  </div>

                  <button type="button" className="primary-action" onClick={openRecipientView}>
                    <WandSparkles size={19} aria-hidden="true" />
                    Open recipient view
                  </button>
                </div>
              )}
            </div>

            <div className="mt-7 flex items-center justify-between border-t border-[#292724]/12 pt-5">
              <button
                type="button"
                className="secondary-action"
                onClick={() => setStep((current) => Math.max(0, current - 1))}
                disabled={step === 0}
              >
                <ChevronLeft size={18} aria-hidden="true" />
                Back
              </button>
              {step < steps.length - 1 && (
                <button
                  type="button"
                  className="primary-action primary-action-compact"
                  onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
                >
                  Continue
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="preview-stage px-4 py-7 sm:px-8 lg:px-10 lg:py-9" aria-label="Live invitation preview">
          <div className="mx-auto w-full max-w-2xl lg:sticky lg:top-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black">Live recipient preview</p>
                <p className="text-xs text-[#68625b]">Updates as you type</p>
              </div>
              <button type="button" className="preview-open-button" onClick={openRecipientView}>
                <Sparkles size={17} aria-hidden="true" />
                Open preview
              </button>
            </div>
            <InvitationPreview
              draft={draft}
              templateId={templateId}
              response={null}
            />
          </div>
        </section>
      </div>

      {showRecipientView && (
        <div className="recipient-overlay" role="dialog" aria-modal="true" aria-label="Recipient invitation preview">
          <div className="recipient-toolbar">
            <div>
              <strong>Recipient view</strong>
              <span>Preview only</span>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => setShowRecipientView(false)}
              aria-label="Close recipient preview"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <div className="recipient-canvas">
            <InvitationPreview
              draft={draft}
              templateId={templateId}
              interactive
              response={previewResponse}
              onResponse={setPreviewResponse}
            />
            {previewResponse && (
              <button
                type="button"
                className="try-again-button"
                onClick={() => setPreviewResponse(null)}
              >
                Try another response
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
