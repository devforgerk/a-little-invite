"use client";

import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Coffee,
  Compass,
  Copy,
  ExternalLink,
  Eye,
  Footprints,
  Heart,
  Link2,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  MoonStar,
  PencilLine,
  Share2,
  Sparkles,
  UtensilsCrossed,
  WandSparkles,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { InvitationPreview } from "@/app/components/invitation-preview";
import {
  activities,
  defaultDraft,
  getActivity,
  templates,
  type ActivityId,
  type InvitationDraft,
  type ResponseChoice,
  type TemplateId,
} from "@/app/lib/invitation";

type MobileView = "editor" | "preview";

const steps = ["Feeling", "The plan", "Your note"];

const templateIcons: Record<TemplateId, LucideIcon> = {
  playful: Sparkles,
  sincere: MoonStar,
};

const activityIcons: Record<ActivityId, LucideIcon> = {
  coffee: Coffee,
  dinner: UtensilsCrossed,
  walk: Footprints,
  movie: Clapperboard,
  outing: Compass,
  custom: Sparkles,
};

type CreatedInvitation = {
  shareUrl: string;
  statusUrl: string;
  expiresAt: string;
};

export default function Home() {
  const [step, setStep] = useState(0);
  const [templateId, setTemplateId] = useState<TemplateId>("playful");
  const [draft, setDraft] = useState<InvitationDraft>(defaultDraft);
  const [mobileView, setMobileView] = useState<MobileView>("editor");
  const [showRecipientView, setShowRecipientView] = useState(false);
  const [previewResponse, setPreviewResponse] =
    useState<ResponseChoice | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState("");
  const [createdInvitation, setCreatedInvitation] =
    useState<CreatedInvitation | null>(null);
  const [copiedLink, setCopiedLink] = useState<"share" | "status" | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === templateId) ?? templates[0],
    [templateId],
  );
  const selectedActivity = useMemo(() => getActivity(draft.activity), [draft.activity]);
  const SelectedTemplateIcon = templateIcons[selectedTemplate.id];

  function updateDraft<Key extends keyof InvitationDraft>(
    key: Key,
    value: InvitationDraft[Key],
  ) {
    setCreationError("");
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function openRecipientView() {
    setPreviewResponse(null);
    setShowRecipientView(true);
  }

  function changeMobileView(view: MobileView) {
    setMobileView(view);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function validateDraft() {
    if (!draft.fromName.trim() || !draft.toName.trim()) {
      return { step: 0, message: "Add both names before creating the invitation." };
    }
    if (draft.activity === "custom" && !draft.customActivity.trim()) {
      return { step: 1, message: "Give your custom plan a name." };
    }
    if (!draft.place.trim() || !draft.date || !draft.time) {
      return { step: 1, message: "Add the place, date, and time before creating." };
    }
    if (!draft.message.trim()) {
      return { step: 2, message: "Add a short personal note before creating." };
    }

    return null;
  }

  async function createInvitation() {
    const validation = validateDraft();
    if (validation) {
      setStep(validation.step);
      setMobileView("editor");
      setCreationError(validation.message);
      return;
    }

    setIsCreating(true);
    setCreationError("");

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, templateId }),
      });
      const result = (await response.json()) as CreatedInvitation & { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "The invitation could not be created just now.");
      }

      setCreatedInvitation(result);
      setCopiedLink(null);
    } catch (error) {
      setCreationError(
        error instanceof Error ? error.message : "The invitation could not be created just now.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function copyLink(kind: "share" | "status", value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedLink(kind);
    window.setTimeout(() => setCopiedLink((current) => (current === kind ? null : current)), 1800);
  }

  async function shareInvitation() {
    if (!createdInvitation) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${draft.fromName} has a little invitation for ${draft.toName}`,
          text: "I made a little invitation for you.",
          url: createdInvitation.shareUrl,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await copyLink("share", createdInvitation.shareUrl);
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
              <p className="brand-wordmark truncate">A Little Invite</p>
              <p className="brand-tagline truncate">Make a moment, not a message.</p>
            </div>
          </div>
          <span className="hidden items-center gap-2 text-sm font-semibold text-[#68625b] sm:flex">
            <WandSparkles size={17} aria-hidden="true" />
            Invitation studio
          </span>
        </div>
      </header>

      <div className="mobile-view-bar">
        <div className="mobile-view-switch" role="tablist" aria-label="Invitation studio view">
          <button
            type="button"
            role="tab"
            aria-selected={mobileView === "editor"}
            aria-controls="invitation-editor"
            className={mobileView === "editor" ? "is-selected" : ""}
            onClick={() => changeMobileView("editor")}
          >
            <PencilLine size={17} aria-hidden="true" />
            Create
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileView === "preview"}
            aria-controls="invitation-live-preview"
            className={mobileView === "preview" ? "is-selected" : ""}
            onClick={() => changeMobileView("preview")}
          >
            <Eye size={17} aria-hidden="true" />
            Preview
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1440px] lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(360px,0.78fr)_minmax(520px,1.22fr)]">
        <section
          id="invitation-editor"
          className={`editor-stage border-b border-[#292724]/12 bg-[#fbfaf7] px-4 py-7 sm:px-7 lg:border-b-0 lg:border-r lg:py-9 ${
            mobileView === "preview" ? "mobile-view-hidden" : ""
          }`}
        >
          <div className="mx-auto max-w-xl">
            <div className="mb-7">
              <p className="romantic-kicker mb-2">Create an invitation</p>
              <h1 className="studio-title max-w-lg">
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

            {creationError && (
              <div className="form-error" role="alert">
                <span aria-hidden="true">!</span>
                {creationError}
              </div>
            )}

            <div className="min-h-[420px]">
              {step === 0 && (
                <div className="form-section">
                  <div>
                    <h2>Choose the feeling</h2>
                    <p>The same invitation can carry a completely different energy.</p>
                  </div>

                  <div className="template-picker" role="radiogroup" aria-label="Invitation feeling">
                    {templates.map((template) => {
                      const Icon = templateIcons[template.id];
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
                          <span className="template-copy">
                            <strong>{template.name}</strong>
                            <small>{template.description}</small>
                            <span
                              className={`template-swatches template-swatches-${template.id}`}
                              aria-hidden="true"
                            >
                              <i />
                              <i />
                              <i />
                            </span>
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
                        required
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
                        required
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

                  <fieldset className="activity-fieldset">
                    <legend>What are you inviting them to?</legend>
                    <div className="activity-picker">
                      {activities.map((activity) => {
                        const Icon = activityIcons[activity.id];
                        const selected = activity.id === draft.activity;

                        return (
                          <button
                            key={activity.id}
                            type="button"
                            className={selected ? "is-selected" : ""}
                            onClick={() => updateDraft("activity", activity.id)}
                            aria-pressed={selected}
                          >
                            <span className="activity-option-icon">
                              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
                            </span>
                            <span>{activity.label}</span>
                            {selected && <Check size={14} aria-hidden="true" />}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  {draft.activity === "custom" && (
                    <label className="field-label">
                      Name your plan
                      <input
                        className="field-input"
                        value={draft.customActivity}
                        maxLength={60}
                        required
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
                        required
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
                        required
                        onChange={(event) => updateDraft("date", event.target.value)}
                      />
                    </label>
                    <label className="field-label">
                      Time
                      <input
                        type="time"
                        className="field-input"
                        value={draft.time}
                        required
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
                      required
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
                        {draft.activity === "custom"
                          ? draft.customActivity || "Custom plan"
                          : selectedActivity.label}
                        {draft.toName ? ` for ${draft.toName}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="creation-actions">
                    <button
                      type="button"
                      className="primary-action"
                      onClick={createInvitation}
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <LoaderCircle className="spin-icon" size={19} aria-hidden="true" />
                      ) : (
                        <Link2 size={19} aria-hidden="true" />
                      )}
                      {isCreating ? "Creating…" : "Create invitation"}
                    </button>
                    <button type="button" className="secondary-action" onClick={openRecipientView}>
                      <Eye size={18} aria-hidden="true" />
                      Preview first
                    </button>
                  </div>
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

        <section
          id="invitation-live-preview"
          className={`preview-stage px-4 py-7 sm:px-8 lg:px-10 lg:py-9 ${
            mobileView === "editor" ? "mobile-view-hidden" : ""
          }`}
          aria-label="Live invitation preview"
        >
          <div className="mx-auto w-full max-w-2xl lg:sticky lg:top-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="preview-status-copy">
                <p className="text-sm font-black">
                  <span className="live-mark" aria-hidden="true" />
                  Live recipient preview
                </p>
                <p className="text-xs text-[#68625b]">Updates as you type</p>
              </div>
              <button type="button" className="preview-open-button" onClick={openRecipientView}>
                <Sparkles size={17} aria-hidden="true" />
                Open preview
              </button>
            </div>
            <InvitationPreview
              key={`${templateId}-${draft.activity}-live`}
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
              key={`${templateId}-${draft.activity}-recipient`}
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

      {createdInvitation && (
        <div
          className="share-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invitation-ready-title"
        >
          <section className="share-dialog">
            <button
              type="button"
              className="icon-button share-dialog-close"
              onClick={() => setCreatedInvitation(null)}
              aria-label="Close invitation links"
            >
              <X size={20} aria-hidden="true" />
            </button>

            <div className="share-success-mark" aria-hidden="true">
              <CheckCircle2 size={30} />
            </div>
            <p className="romantic-kicker">Ready when you are</p>
            <h2 id="invitation-ready-title">Your invitation is ready to send.</h2>
            <p className="share-dialog-intro">
              Share the first link with {draft.toName}. Keep the second one private so only you
              can see their response.
            </p>

            <div className="share-link-section">
              <div className="share-link-heading">
                <span className="share-link-icon share-link-icon-public">
                  <Share2 size={18} aria-hidden="true" />
                </span>
                <div>
                  <strong>Send this to {draft.toName}</strong>
                  <span>They can open it without signing in.</span>
                </div>
              </div>
              <div className="link-copy-row">
                <input readOnly value={createdInvitation.shareUrl} aria-label="Recipient link" />
                <button
                  type="button"
                  onClick={() => copyLink("share", createdInvitation.shareUrl)}
                >
                  {copiedLink === "share" ? (
                    <Check size={17} aria-hidden="true" />
                  ) : (
                    <Copy size={17} aria-hidden="true" />
                  )}
                  {copiedLink === "share" ? "Copied" : "Copy"}
                </button>
              </div>
              <button type="button" className="primary-action share-native-action" onClick={shareInvitation}>
                <Share2 size={18} aria-hidden="true" />
                Share invitation
              </button>
            </div>

            <div className="share-link-section share-link-private">
              <div className="share-link-heading">
                <span className="share-link-icon share-link-icon-private">
                  <LockKeyhole size={18} aria-hidden="true" />
                </span>
                <div>
                  <strong>Your private response page</strong>
                  <span>Save this link. Anyone with it can see the answer.</span>
                </div>
              </div>
              <div className="link-copy-row">
                <input readOnly value={createdInvitation.statusUrl} aria-label="Private status link" />
                <button
                  type="button"
                  onClick={() => copyLink("status", createdInvitation.statusUrl)}
                >
                  {copiedLink === "status" ? (
                    <Check size={17} aria-hidden="true" />
                  ) : (
                    <Copy size={17} aria-hidden="true" />
                  )}
                  {copiedLink === "status" ? "Copied" : "Copy"}
                </button>
              </div>
              <a href={createdInvitation.statusUrl} target="_blank" rel="noreferrer">
                Open private status page
                <ExternalLink size={16} aria-hidden="true" />
              </a>
            </div>

            <p className="share-expiry-note">
              Links stay active until {new Date(createdInvitation.expiresAt).toLocaleDateString("en", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
