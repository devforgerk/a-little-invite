"use client";

import {
  CalendarDays,
  Check,
  Clapperboard,
  Clock3,
  Coffee,
  Compass,
  Footprints,
  Heart,
  MapPin,
  MessageCircleHeart,
  MoonStar,
  PartyPopper,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  formatDate,
  formatTime,
  getActivity,
  templates,
  type ActivityId,
  type InvitationDraft,
  type ResponseChoice,
  type TemplateId,
} from "@/app/lib/invitation";

const activityIcons: Record<ActivityId, LucideIcon> = {
  coffee: Coffee,
  dinner: UtensilsCrossed,
  walk: Footprints,
  movie: Clapperboard,
  outing: Compass,
  custom: Sparkles,
};

function responseCopy(choice: ResponseChoice, fromName: string) {
  if (choice === "yes") {
    const owner = fromName.trim() ? `${fromName.trim()}’s` : "their";

    return {
      icon: PartyPopper,
      title: `That just made ${owner} day.`,
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

export function InvitationPreview({
  draft,
  templateId,
  interactive = false,
  response,
  selectedResponse = null,
  onResponse,
}: {
  draft: InvitationDraft;
  templateId: TemplateId;
  interactive?: boolean;
  response: ResponseChoice | null;
  selectedResponse?: ResponseChoice | null;
  onResponse?: (choice: ResponseChoice) => void;
}) {
  const offeredActivities = (draft.activities.length ? draft.activities : ["coffee" as const]).map(
    (activity) => getActivity(activity),
  );
  const primaryActivity = offeredActivities[0];
  const activityPhrase =
    primaryActivity.id === "custom"
      ? draft.customActivity.trim() || primaryActivity.invitationPhrase
      : primaryActivity.invitationPhrase;
  const ActivityIcon = activityIcons[primaryActivity.id];
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
        <span className="preview-for-you">
          <Heart size={13} fill="currentColor" aria-hidden="true" />
          just for you
        </span>
      </header>

      <div className="preview-copy">
        <div
          key={`${templateId}-${draft.activities.join("-")}`}
          className={`preview-illustration activity-${primaryActivity.id}`}
          aria-hidden="true"
        >
          <span className="activity-symbol">
            <ActivityIcon size={38} strokeWidth={1.7} />
          </span>
          <span className="activity-mark activity-mark-one" />
          <span className="activity-mark activity-mark-two" />
        </div>
        <p className="preview-whisper">
          {templateId === "playful"
            ? "A tiny plan with lovely potential"
            : "A quiet question, meant just for you"}
        </p>
        <p className="preview-greeting">Hey {draft.toName || "you"},</p>
        <h2>
          {offeredActivities.length > 1
            ? "Which little plan sounds good to you?"
            : `Would you join me for ${activityPhrase}?`}
        </h2>
        {offeredActivities.length > 1 && (
          <div className="preview-activity-list" aria-label="Activity options">
            {offeredActivities.map((activity) => {
              const Icon = activityIcons[activity.id];
              return (
                <span key={activity.id}>
                  <Icon size={15} aria-hidden="true" />
                  {activity.id === "custom"
                    ? draft.customActivity.trim() || activity.label
                    : activity.label}
                </span>
              );
            })}
          </div>
        )}
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
          <dd>{draft.timeMode === "recipient" ? "You choose what works" : formatTime(draft.time)}</dd>
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
            <div className={`response-actions ${selectedResponse ? "has-selection" : ""}`}>
              <button
                type="button"
                disabled={!interactive}
                className={selectedResponse === "yes" ? "is-selected" : ""}
                aria-pressed={interactive ? selectedResponse === "yes" : undefined}
                onClick={() => onResponse?.("yes")}
              >
                <Check size={17} aria-hidden="true" />
                I’d love to
              </button>
              <button
                type="button"
                disabled={!interactive}
                className={selectedResponse === "adjust" ? "is-selected" : ""}
                aria-pressed={interactive ? selectedResponse === "adjust" : undefined}
                onClick={() => onResponse?.("adjust")}
              >
                <MessageCircleHeart size={17} aria-hidden="true" />
                Adjust it
              </button>
              <button
                type="button"
                disabled={!interactive}
                className={selectedResponse === "no" ? "is-selected" : ""}
                aria-pressed={interactive ? selectedResponse === "no" : undefined}
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
