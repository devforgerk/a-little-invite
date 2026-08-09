"use client";

import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Heart,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  MessageCircleHeart,
  RefreshCw,
  Send,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FlowHeader } from "@/app/components/flow-header";
import {
  formatDate,
  formatTime,
  getActivityLabel,
  responseLabels,
  type ActivityId,
  type InvitationData,
  type ResponseChoice,
} from "@/app/lib/invitation";
import { withPublicOrigin } from "@/app/lib/public-url";

type StatusPayload = {
  invitation: InvitationData;
  response: {
    choice: ResponseChoice;
    note: string;
    selectedActivity: ActivityId | null;
    preferredTime: string;
    respondedAt: string;
  } | null;
  shareUrl: string;
};

const answerIcons = {
  yes: CheckCircle2,
  adjust: MessageCircleHeart,
  no: Heart,
};

const AUTO_REFRESH_INTERVAL_MS = 60_000;
const MAX_AUTO_REFRESHES = 15;

export default function PrivateStatusPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [payload, setPayload] = useState<StatusPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [copied, setCopied] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const loadStatus = useCallback(
    async (quiet = false) => {
      if (quiet) setIsRefreshing(true);
      else setIsLoading(true);
      setLoadError("");

      try {
        const response = await fetch(`/api/status/${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        const result = (await response.json()) as StatusPayload & { error?: string };
        if (!response.ok) throw new Error(result.error || "The response status could not be opened.");
        setPayload({
          ...result,
          shareUrl: withPublicOrigin(result.shareUrl, window.location.origin),
        });
        setLastChecked(new Date());
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : "The response status could not be opened.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void loadStatus(), 0);
    return () => window.clearTimeout(timer);
  }, [loadStatus]);

  useEffect(() => {
    if (payload?.invitation.state !== "open") return;

    let automaticRefreshes = 0;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (automaticRefreshes >= MAX_AUTO_REFRESHES) {
        window.clearInterval(timer);
        return;
      }

      automaticRefreshes += 1;
      void loadStatus(true);
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [loadStatus, payload?.invitation.state]);

  async function copyShareLink() {
    if (!payload) return;
    await navigator.clipboard.writeText(payload.shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const activitySummary = payload
    ? payload.invitation.activities
        .map((activity) => getActivityLabel(activity, payload.invitation.customActivity))
        .join(", ")
    : "";
  const AnswerIcon = payload?.response ? answerIcons[payload.response.choice] : null;

  return (
    <main className="status-flow-page">
      <FlowHeader label="Private response page" privateView />

      {isLoading ? (
        <section className="flow-state" aria-live="polite">
          <LoaderCircle className="spin-icon" size={28} aria-hidden="true" />
          <h1>Checking for a response…</h1>
          <p>This page is only for the invitation creator.</p>
        </section>
      ) : loadError && !payload ? (
        <section className="flow-state flow-state-error">
          <LockKeyhole size={28} aria-hidden="true" />
          <h1>This private page is out of reach.</h1>
          <p>{loadError}</p>
          <button type="button" className="secondary-action" onClick={() => loadStatus()}>
            Try again
          </button>
        </section>
      ) : payload ? (
        <div className="status-page-layout">
          <section className="status-intro">
            <p className="romantic-kicker">Private response</p>
            <div className="status-title-row">
              <div>
                <h1>{payload.invitation.toName}’s answer lives here.</h1>
                <p>Keep this page private. Their answer will appear here when it arrives.</p>
              </div>
              <span className={`status-badge status-${payload.invitation.state}`}>
                {payload.invitation.state === "open"
                  ? "Waiting"
                  : payload.invitation.state === "responded"
                    ? "Answered"
                    : "Expired"}
              </span>
            </div>
          </section>

          <section className="status-plan" aria-label="Invitation summary">
            <div className="status-plan-heading">
              <span>Invitation sent</span>
              <h2>
                {activitySummary}
                {payload.invitation.toName ? ` with ${payload.invitation.toName}` : ""}
              </h2>
            </div>
            <dl className="status-plan-details">
              <div>
                <CalendarDays size={18} aria-hidden="true" />
                <dt>Date</dt>
                <dd>{formatDate(payload.invitation.date)}</dd>
              </div>
              <div>
                <Clock3 size={18} aria-hidden="true" />
                <dt>Time</dt>
                <dd>
                  {payload.invitation.timeMode === "recipient"
                    ? "They choose what works"
                    : formatTime(payload.invitation.time)}
                </dd>
              </div>
              <div>
                <MapPin size={18} aria-hidden="true" />
                <dt>Place</dt>
                <dd>{payload.invitation.place}</dd>
              </div>
            </dl>
          </section>

          {payload.response && AnswerIcon ? (
            <section className={`status-answer status-answer-${payload.response.choice}`}>
              <div className="status-answer-icon">
                <AnswerIcon size={30} aria-hidden="true" />
              </div>
              <p>They answered</p>
              <h2>{responseLabels[payload.response.choice]}</h2>
              {(payload.response.selectedActivity || payload.response.preferredTime) && (
                <dl className="status-answer-preferences">
                  {payload.response.selectedActivity && (
                    <div>
                      <Check size={17} aria-hidden="true" />
                      <dt>Their plan</dt>
                      <dd>
                        {getActivityLabel(
                          payload.response.selectedActivity,
                          payload.invitation.customActivity,
                        )}
                      </dd>
                    </div>
                  )}
                  {payload.response.preferredTime && (
                    <div>
                      <Clock3 size={17} aria-hidden="true" />
                      <dt>Their time</dt>
                      <dd>{formatTime(payload.response.preferredTime)}</dd>
                    </div>
                  )}
                </dl>
              )}
              {payload.response.note && <blockquote>“{payload.response.note}”</blockquote>}
              <time dateTime={payload.response.respondedAt}>
                Received {new Date(payload.response.respondedAt).toLocaleString("en", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </time>
            </section>
          ) : payload.invitation.state === "expired" ? (
            <section className="status-waiting status-expired-message">
              <Heart size={26} aria-hidden="true" />
              <h2>No response arrived before this invitation expired.</h2>
              <p>You can always make a fresh invitation when the moment feels right.</p>
            </section>
          ) : (
            <section className="status-waiting">
              <span className="waiting-pulse" aria-hidden="true">
                <Send size={23} />
              </span>
              <h2>Waiting for {payload.invitation.toName}…</h2>
              <p>Their answer and optional note will appear here after they submit it.</p>
            </section>
          )}

          <section className="status-tools">
            <div>
              <strong>Recipient link</strong>
              <span>Share this one with {payload.invitation.toName}.</span>
            </div>
            <div className="status-tool-actions">
              <button type="button" className="secondary-action" onClick={copyShareLink}>
                {copied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
                {copied ? "Copied" : "Copy link"}
              </button>
              <a href={payload.shareUrl} target="_blank" rel="noreferrer" className="secondary-action">
                <ExternalLink size={17} aria-hidden="true" />
                Open
              </a>
            </div>
          </section>

          <div className="status-refresh-row">
            <button
              type="button"
              className="primary-action"
              onClick={() => loadStatus(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={isRefreshing ? "spin-icon" : ""} size={18} aria-hidden="true" />
              {isRefreshing ? "Checking…" : "Refresh response"}
            </button>
            <p aria-live="polite">
              {loadError
                ? loadError
                : lastChecked
                  ? `Last checked at ${lastChecked.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}`
                  : "Not checked yet"}
            </p>
          </div>

          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="status-create-another">
            Create another invitation
          </a>
        </div>
      ) : null}
    </main>
  );
}
