// transcription model state

import { atom } from "jotai";

export type ModelStatus = "unknown" | "loading" | "ready" | "error";

export const modelStatusAtom = atom<ModelStatus>("unknown");
export const modelLoadingProgressAtom = atom<number>(0);
export type transcriptionModelName =
	| "onnx-community/whisper-base"
	| "onnx-community/whisper-large-turbo-v3";
export const transcriptionModelAtom = atom<transcriptionModelName>(
	"onnx-community/whisper-large-turbo-v3",
);
