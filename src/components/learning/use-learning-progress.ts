"use client";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  restoreProgress,
  type LearningProgress,
  type LearningQuestion,
} from "@/lib/learning";

export const LEARNING_STORAGE_KEY = "pravo-na-dlanu.learning.v1";
const eventName = "learning-progress";
const serverSnapshot = () => null;

function createStore() {
  let memory = "";
  let writeFailed = false;
  return {
    subscribe(callback: () => void) {
      window.addEventListener("storage", callback);
      window.addEventListener(eventName, callback);
      return () => {
        window.removeEventListener("storage", callback);
        window.removeEventListener(eventName, callback);
      };
    },
    snapshot() {
      if (writeFailed) return "0:" + memory;
      try {
        return "1:" + (window.localStorage.getItem(LEARNING_STORAGE_KEY) ?? "");
      } catch {
        return "0:" + memory;
      }
    },
    save(progress: LearningProgress | null) {
      memory = progress ? JSON.stringify(progress) : "";
      try {
        if (progress) window.localStorage.setItem(LEARNING_STORAGE_KEY, memory);
        else window.localStorage.removeItem(LEARNING_STORAGE_KEY);
        writeFailed = false;
      } catch {
        writeFailed = true;
      }
      window.dispatchEvent(new Event(eventName));
    },
  };
}

export function useLearningProgress(questions: LearningQuestion[]) {
  const [store] = useState(createStore);
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.snapshot,
    serverSnapshot,
  );
  const progress = useMemo(
    () => restoreProgress(snapshot?.slice(2) ?? "", questions),
    [snapshot, questions],
  );
  function update(change: (current: LearningProgress) => LearningProgress) {
    store.save(change(restoreProgress(store.snapshot().slice(2), questions)));
  }
  return {
    progress,
    ready: snapshot !== null,
    persistent: snapshot?.startsWith("1:") ?? true,
    update,
    reset: () => store.save(null),
  };
}
