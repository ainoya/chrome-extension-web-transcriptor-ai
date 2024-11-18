// transcription model state

import { atom } from "jotai";

export type ModelStatus = "unknown" | "loading" | "ready" | "error";

export const modelStatusAtom = atom<ModelStatus>("unknown");
export const modelLoadingProgressAtom = atom<number>(0);
