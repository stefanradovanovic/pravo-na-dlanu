"use client";

import { ConvexProvider, useQuery } from "convex/react";
import { Star } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Toolbar, ToolbarButton } from "@/components/ui/toolbar";
import { api } from "../../../../convex/_generated/api";
import {
  ratingCooldownHours,
  ratingScores,
  type PrivateRating,
  type RatingRequest,
  type RatingResponse,
} from "../../../../convex/ratingContract";
import type { Member } from "./member-map";
import {
  ratingConfiguration as configuration,
  ratingNumber,
} from "./rating-client";
import { Turnstile } from "./turnstile";
import "./member-rating.css";

const storageKey = "assembly-rating-guest";
const confirmationDuration = 3_000;
type RatingFeedback =
  { status: "saved" } | { status: "already-voted"; nextVoteAt: number };
const newGuest: PrivateRating = {
  registered: false,
  score: null,
  nextVoteAt: null,
};
const voteTimeFormat = new Intl.DateTimeFormat("sr-Cyrl-RS", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Belgrade",
});

function readCredential() {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

async function guestCredential() {
  function remember() {
    const existing = readCredential();
    if (existing) return existing;
    const credential = crypto.randomUUID();
    localStorage.setItem(storageKey, credential);
    return credential;
  }
  return navigator.locks
    ? navigator.locks.request(storageKey, remember)
    : remember();
}

async function ratingRequest(
  endpoint: URL,
  body: RatingRequest,
  signal?: AbortSignal,
): Promise<RatingResponse> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  const timeout = window.setTimeout(abort, 15_000);
  signal?.addEventListener("abort", abort, { once: true });
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return await response.json();
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

function PublishedRating({
  term,
  memberId,
}: {
  term: number;
  memberId: string;
}) {
  const published = useQuery(api.ratings.result, { term, memberId });
  if (published?.sum == null) return null;
  return (
    <p role="status" className="mt-1 text-muted-foreground">
      Укупно поена: {ratingNumber.format(published.sum)}{" "}
      <span aria-label={`Број оцена: ${ratingNumber.format(published.count)}`}>
        ({ratingNumber.format(published.count)})
      </span>
    </p>
  );
}

function RatingChoices({
  endpoint,
  siteKey,
  term,
  member,
  onRecorded,
}: {
  endpoint: URL;
  siteKey: string;
  term: number;
  member: Member;
  onRecorded: (feedback: RatingFeedback) => void;
}) {
  const memberId = member.id;
  const [initialCredential] = useState(readCredential);
  const [current, setCurrent] = useState<PrivateRating | null>(
    initialCredential ? null : newGuest,
  );
  const [readFailed, setReadFailed] = useState(false);
  const [activeScore, setActiveScore] = useState<number | null>(null);
  const [verification, setVerification] = useState<{
    credential: string;
    score: number;
  } | null>(null);
  const [error, setError] = useState("");
  const activeRequest = useRef<AbortController | null>(null);
  const loading = !current && !readFailed;

  useEffect(() => {
    if (!initialCredential) return;
    const controller = new AbortController();
    void ratingRequest(
      endpoint,
      { operation: "read", term, memberId, credential: initialCredential },
      controller.signal,
    )
      .then((response) => {
        if (controller.signal.aborted) return;
        if (response.status !== "ok") setReadFailed(true);
        else if (response.rating.nextVoteAt != null) {
          onRecorded({
            status: "already-voted",
            nextVoteAt: response.rating.nextVoteAt,
          });
        } else setCurrent(response.rating);
      })
      .catch(() => {
        if (!controller.signal.aborted) setReadFailed(true);
      });
    return () => controller.abort();
  }, [endpoint, initialCredential, memberId, onRecorded, term]);

  useEffect(() => () => activeRequest.current?.abort(), []);

  function finish() {
    activeRequest.current = null;
    setActiveScore(null);
    setVerification(null);
  }

  async function submit(credential: string, score: number, challenge?: string) {
    const request = activeRequest.current;
    if (!request) return;
    const response = await ratingRequest(
      endpoint,
      {
        operation: "write",
        term,
        memberId,
        credential,
        score,
        ...(challenge && { challenge }),
      },
      request.signal,
    ).catch(() => null);
    if (request.signal.aborted) return;
    if (response?.status === "ok") {
      onRecorded({ status: "saved" });
      return;
    }
    if (response?.status === "cooldown") {
      onRecorded({ status: "already-voted", nextVoteAt: response.nextVoteAt });
      return;
    }
    if (!response) {
      setError("Веза са сервисом за оцене је прекинута. Покушајте поново.");
    } else if (response.status === "challenge") {
      setCurrent(newGuest);
      setError("Изаберите оцену да поновите проверу посетиоца.");
    } else if (response.status === "limited") {
      setError("Превише захтева. Сачекајте мало па покушајте поново.");
    } else {
      setError("Оцену тренутно није могуће сачувати. Покушајте поново.");
    }
    finish();
  }

  async function activate(score: number) {
    if (activeRequest.current || loading) return;
    const request = new AbortController();
    activeRequest.current = request;
    setActiveScore(score);
    setError("");

    const credential = await guestCredential().catch(() => null);
    if (request.signal.aborted) return;
    if (!credential) {
      setError(
        "Дозволите овом сајту да сачува податке у прегледачу, па покушајте поново.",
      );
      finish();
      return;
    }

    let previous = current;
    if (!previous || credential !== initialCredential) {
      try {
        const response = await ratingRequest(
          endpoint,
          { operation: "read", term, memberId, credential },
          request.signal,
        );
        if (request.signal.aborted) return;
        if (response.status === "ok") {
          previous = response.rating;
          setCurrent(previous);
          setReadFailed(false);
        }
      } catch {
        if (request.signal.aborted) return;
      }
      if (!previous) {
        finish();
        return;
      }
    }

    if (previous.nextVoteAt != null) {
      onRecorded({ status: "already-voted", nextVoteAt: previous.nextVoteAt });
    } else if (previous.registered) await submit(credential, score);
    else setVerification({ credential, score });
  }

  if (loading) {
    return (
      <DialogTitle className="assembly-rating-message">Учитавање…</DialogTitle>
    );
  }
  return (
    <div className="assembly-rating-layout">
      <Star
        aria-hidden="true"
        className="assembly-rating-icon"
        fill="currentColor"
        strokeWidth={1.75}
        viewBox="1 1 22 22"
      />
      <DialogTitle>Оцена рада</DialogTitle>
      <DialogDescription>{member.name}</DialogDescription>
      <div className="grid gap-3" aria-busy={activeScore !== null}>
        <div>
          <Toolbar
            aria-label="Оцена од 1 до 10"
            className="assembly-rating-scores"
            disabled={activeScore !== null}
          >
            {ratingScores.map((score) => (
              <ToolbarButton
                key={score}
                className="assembly-rating-score"
                data-pending={score === activeScore || undefined}
                onClick={() => void activate(score)}
              >
                <span
                  className="assembly-rating-score-number"
                  style={
                    {
                      "--score-hue": 4 + (score - 1) * 13,
                      "--score-lightness": `${67 - (score - 1) * 3}%`,
                    } as CSSProperties
                  }
                >
                  {score}
                </span>
              </ToolbarButton>
            ))}
          </Toolbar>
          {verification && (
            <Turnstile
              siteKey={siteKey}
              onToken={(token) =>
                void submit(verification.credential, verification.score, token)
              }
              onFailure={() => {
                finish();
                setError(
                  "Провера посетиоца није успела. Изаберите оцену да покушате поново.",
                );
              }}
            />
          )}
        </div>
        {(error || readFailed) && (
          <p role="alert" className="text-destructive">
            {error ||
              "Није могуће учитати вашу оцену. Изаберите оцену да покушате поново."}
          </p>
        )}
      </div>
    </div>
  );
}

export function MemberRating({
  member,
  term,
}: {
  member: Member;
  term: number;
}) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<RatingFeedback | null>(null);

  useEffect(() => {
    if (!open || !feedback) return;
    const timer = window.setTimeout(() => setOpen(false), confirmationDuration);
    return () => window.clearTimeout(timer);
  }, [open, feedback]);

  if (!configuration) return null;
  return (
    <div className="assembly-rating-control">
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) setFeedback(null);
          setOpen(next);
        }}
      >
        <DialogTrigger
          render={<Button size="sm" className="assembly-rating-action" />}
        >
          Оцените рад
        </DialogTrigger>
        <DialogContent
          className="text-start text-base"
          showCloseButton={false}
          data-assembly-rating-dialog=""
          data-rating-feedback={feedback?.status}
          initialFocus="content"
        >
          {feedback ? (
            <div className="assembly-rating-feedback" aria-live="polite">
              <DialogTitle>
                {feedback.status === "saved"
                  ? "Ваш глас је забележен."
                  : "Ваш глас је већ забележен."}
              </DialogTitle>
              <DialogDescription>
                {feedback.status === "saved"
                  ? `Поново можете да гласате за ${ratingCooldownHours} сата.`
                  : `Поново можете да гласате од ${voteTimeFormat.format(feedback.nextVoteAt)}.`}
              </DialogDescription>
            </div>
          ) : open ? (
            <RatingChoices
              term={term}
              member={member}
              endpoint={configuration.endpoint}
              siteKey={configuration.siteKey}
              onRecorded={setFeedback}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <ConvexProvider client={configuration.client}>
        <PublishedRating term={term} memberId={member.id} />
      </ConvexProvider>
    </div>
  );
}
