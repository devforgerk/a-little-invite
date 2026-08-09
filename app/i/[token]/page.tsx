"use client";

import { Check, Clock3, Heart, LoaderCircle, MessageCircleHeart, Send, X } from "lucide-react";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { FlowHeader } from "@/app/components/flow-header";
import { InvitationPreview } from "@/app/components/invitation-preview";
import {
  getActivityLabel,
  responseLabels,
  type ActivityId,
  type InvitationData,
  type ResponseChoice,
} from "@/app/lib/invitation";

type PublicInvitationPayload = {
  invitation: InvitationData;
  responseChoice: ResponseChoice | null;
  response: {
    choice: ResponseChoice;
    selectedActivity: ActivityId | null;
    preferredTime: string;
  } | null;
};

const responsePrompts: Record<ResponseChoice, { title: string; hint: string }> = {
  yes: {
    title: "Add a little note?",
    hint: "Optional, but a few happy words can make the yes even sweeter.",
  },
  adjust: {
    title: "What would feel better?",
    hint: "Suggest another time, place, or plan so you can shape it together.",
  },
  no: {
    title: "Anything you’d like to say?",
    hint: "A note is optional. A clear answer is already enough.",
  },
};

export default function RecipientInvitationPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [payload, setPayload] = useState<PublicInvitationPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedChoice, setSelectedChoice] = useState<ResponseChoice | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityId | null>(null);
  const [preferredTime, setPreferredTime] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const loadInvitation = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(token)}`, {
        cache: "no-store",
      });
      const result = (await response.json()) as PublicInvitationPayload & { error?: string };
      if (!response.ok) throw new Error(result.error || "This invitation could not be opened.");
      setPayload(result);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "This invitation could not be opened.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadInvitation(), 0);
    return () => window.clearTimeout(timer);
  }, [loadInvitation]);

  function chooseResponse(choice: ResponseChoice) {
    setSelectedChoice(choice);
    if (choice === "no") {
      setSelectedActivity(null);
      setPreferredTime("");
    } else if (payload?.invitation.activities.length === 1) {
      setSelectedActivity(payload.invitation.activities[0]);
    }
    setSubmitError("");
    window.requestAnimationFrame(() => {
      document.querySelector(".response-note-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  async function submitResponse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedChoice) return;

    if (
      selectedChoice === "yes" &&
      payload?.invitation.activities.length !== 1 &&
      !selectedActivity
    ) {
      setSubmitError("Choose the plan that sounds best to you.");
      return;
    }
    if (
      selectedChoice === "yes" &&
      payload?.invitation.timeMode === "recipient" &&
      !preferredTime
    ) {
      setSubmitError("Add the time that would work best for you.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(token)}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choice: selectedChoice,
          note,
          selectedActivity,
          preferredTime,
        }),
      });
      const result = (await response.json()) as {
        choice?: ResponseChoice;
        selectedActivity?: ActivityId | null;
        preferredTime?: string;
        error?: string;
      };
      if (!response.ok) {
        if (response.status === 409) await loadInvitation();
        throw new Error(result.error || "Your response could not be saved just now.");
      }

      setPayload((current) =>
        current
          ? {
              ...current,
              invitation: { ...current.invitation, state: "responded" },
              responseChoice: result.choice ?? selectedChoice,
              response: {
                choice: result.choice ?? selectedChoice,
                selectedActivity: result.selectedActivity ?? selectedActivity,
                preferredTime: result.preferredTime ?? preferredTime,
              },
            }
          : current,
      );
      setSelectedChoice(null);
      setSelectedActivity(null);
      setPreferredTime("");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Your response could not be saved just now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="response-flow-page">
      <FlowHeader label="Your invitation" />

      {isLoading ? (
        <section className="flow-state" aria-live="polite">
          <LoaderCircle className="spin-icon" size={28} aria-hidden="true" />
          <h1>Opening your invitation…</h1>
          <p>Just a tiny moment.</p>
        </section>
      ) : loadError || !payload ? (
        <section className="flow-state flow-state-error">
          <Heart size={28} aria-hidden="true" />
          <h1>This invitation is out of reach.</h1>
          <p>{loadError || "Ask the sender to share the link again."}</p>
          <button type="button" className="secondary-action" onClick={loadInvitation}>
            Try again
          </button>
        </section>
      ) : (
        <div className="recipient-page-layout">
          <InvitationPreview
            draft={payload.invitation}
            templateId={payload.invitation.templateId}
            interactive={payload.invitation.state === "open" && !isSubmitting}
            response={payload.response?.choice ?? payload.responseChoice}
            selectedResponse={selectedChoice}
            onResponse={chooseResponse}
          />

          {payload.invitation.state === "open" && selectedChoice && (
            <form className="response-note-panel" onSubmit={submitResponse}>
              <div className={`response-choice-mark response-choice-${selectedChoice}`}>
                {selectedChoice === "adjust" ? (
                  <MessageCircleHeart size={22} aria-hidden="true" />
                ) : (
                  <Heart size={22} fill={selectedChoice === "yes" ? "currentColor" : "none"} aria-hidden="true" />
                )}
              </div>
              <div className="response-note-heading">
                <span>{responseLabels[selectedChoice]}</span>
                <h2>{responsePrompts[selectedChoice].title}</h2>
                <p>{responsePrompts[selectedChoice].hint}</p>
              </div>
              {selectedChoice !== "no" && payload.invitation.activities.length > 1 && (
                <fieldset className="response-preference-fieldset">
                  <legend>
                    Which plan feels best?
                    {selectedChoice === "adjust" && <small>Optional</small>}
                  </legend>
                  <div className="response-activity-picker">
                    {payload.invitation.activities.map((activity) => {
                      const selected = selectedActivity === activity;
                      return (
                        <button
                          key={activity}
                          type="button"
                          className={selected ? "is-selected" : ""}
                          aria-pressed={selected}
                          onClick={() => {
                            setSelectedActivity(activity);
                            setSubmitError("");
                          }}
                        >
                          {selected && <Check size={15} aria-hidden="true" />}
                          {getActivityLabel(activity, payload.invitation.customActivity)}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}
              {selectedChoice !== "no" && payload.invitation.timeMode === "recipient" && (
                <label className="field-label response-time-field">
                  Your preferred time
                  {selectedChoice === "adjust" && <small>Optional</small>}
                  <span className="input-with-icon">
                    <Clock3 size={18} aria-hidden="true" />
                    <input
                      type="time"
                      className="field-input"
                      value={preferredTime}
                      required={selectedChoice === "yes"}
                      onChange={(event) => {
                        setPreferredTime(event.target.value);
                        setSubmitError("");
                      }}
                    />
                  </span>
                </label>
              )}
              <label className="field-label">
                Your note <small>Optional</small>
                <textarea
                  className="field-input response-note-input"
                  value={note}
                  maxLength={320}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={
                    selectedChoice === "adjust"
                      ? "Could we try Saturday afternoon instead?"
                      : "Write something in your own voice…"
                  }
                />
                <span className="character-count">{note.length}/320</span>
              </label>
              {submitError && <p className="response-submit-error">{submitError}</p>}
              <div className="response-note-actions">
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => {
                    setSelectedChoice(null);
                    setSelectedActivity(null);
                    setPreferredTime("");
                    setSubmitError("");
                  }}
                >
                  <X size={17} aria-hidden="true" />
                  Cancel
                </button>
                <button type="submit" className="primary-action" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <LoaderCircle className="spin-icon" size={18} aria-hidden="true" />
                  ) : (
                    <Send size={18} aria-hidden="true" />
                  )}
                  {isSubmitting ? "Sending…" : "Send my response"}
                </button>
              </div>
            </form>
          )}

          {payload.invitation.state === "expired" && (
            <div className="flow-notice">
              <Heart size={20} aria-hidden="true" />
              <div>
                <strong>This invitation has expired.</strong>
                <p>You can still see the lovely thought behind it, but responses are now closed.</p>
              </div>
            </div>
          )}

          {payload.invitation.state === "responded" && (
            <p className="response-sent-note">Your answer has been saved for {payload.invitation.fromName}.</p>
          )}
        </div>
      )}
    </main>
  );
}
