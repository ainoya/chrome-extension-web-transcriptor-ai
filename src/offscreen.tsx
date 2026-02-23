// MUST be first: configure ONNX Runtime to use local WASM (Chrome extension CSP blocks CDN)
import "./ort-env-bootstrap";

import React from "react";
import { useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./globals.css";
import { useAtom } from "jotai";
import { transcriptionSettingsAtom } from "./jotai/settingAtom";
import {
	initializeWhisperWorker,
	processWhisperMessage,
} from "./whisper-worker.js";

// https://github.com/huggingface/transformers.js/blob/7a58d6e11968dd85dc87ce37b2ab37213165889a/examples/webgpu-whisper/src/App.jsx
// const IS_WEBGPU_AVAILABLE = !!navigator.gpu;

const WHISPER_SAMPLING_RATE = 16_000;
const MAX_AUDIO_LENGTH = 30; // seconds
const MAX_SAMPLES = WHISPER_SAMPLING_RATE * MAX_AUDIO_LENGTH;

export const Offscreen: React.FC = () => {
	const [transcriptionSettings] = useAtom(transcriptionSettingsAtom);
	const recorderRef = React.useRef<MediaRecorder | null>(null);
	const [recording, setRecording] = React.useState(false);
	const audioContextRef = React.useRef<AudioContext | null>(null);
	const [chunks, setChunks] = React.useState<Blob[]>([]);
	const modelLoadedRef = React.useRef(false);
	const micStreamRef = React.useRef<MediaStream | null>(null);
	const mixContextRef = React.useRef<AudioContext | null>(null);

	const setupMediaRecorder = async (streamId: string) => {
		if (recorderRef.current) return; // Already set

		const includeMicrophone = transcriptionSettings.includeMicrophone ?? false;

		try {
			const tabStream = await navigator.mediaDevices.getUserMedia({
				audio: {
					// @ts-expect-error - Chrome-specific properties
					mandatory: {
						chromeMediaSource: "tab",
						chromeMediaSourceId: streamId,
					},
				},
			});

			let streamToRecord: MediaStream;

			if (includeMicrophone) {
				try {
					const micStream = await navigator.mediaDevices.getUserMedia({
						audio: true,
					});
					micStreamRef.current = micStream;

					// Mix tab and microphone using Web Audio API
					const mixContext = new AudioContext({ sampleRate: 16000 });
					const destination = mixContext.createMediaStreamDestination();

					const tabSource = mixContext.createMediaStreamSource(tabStream);
					const micSource = mixContext.createMediaStreamSource(micStream);

					tabSource.connect(destination);
					micSource.connect(destination);

					streamToRecord = destination.stream;
					mixContextRef.current = mixContext;
				} catch (micErr) {
					console.warn(
						"Microphone access denied, using tab audio only:",
						micErr,
					);
					streamToRecord = tabStream;
				}
			} else {
				streamToRecord = tabStream;
			}

			console.debug("Setting up media recorder", streamToRecord);

			recorderRef.current = new MediaRecorder(streamToRecord);
			audioContextRef.current = new AudioContext({
				sampleRate: 16000,
			});

			// Continue to play the captured audio to the user.
			const output = new AudioContext();
			const source = output.createMediaStreamSource(recorderRef.current.stream);
			source.connect(output.destination);

			recorderRef.current.onstart = () => {
				setRecording(true);
				setChunks([]);
				chrome.runtime.sendMessage({
					type: "recording-state",
					data: { recording: true },
				});
			};
			recorderRef.current.ondataavailable = (e) => {
				if (e.data.size > 0) {
					console.debug("Received chunk", e.data);
					setChunks((prev) => [...prev, e.data]);

					// requestData after 25 seconds
					setTimeout(() => {
						if (recorderRef.current) recorderRef.current.requestData();
					}, 10 * 1000);
				} else {
					// Empty chunk received, so we request new data after a short timeout
					console.debug("Empty chunk received");
					setTimeout(() => {
						if (recorderRef.current) recorderRef.current.requestData();
					}, 25);
				}
			};

			recorderRef.current.onstop = () => {
				setRecording(false);
				chrome.runtime.sendMessage({
					type: "recording-state",
					data: { recording: false },
				});
			};
			recorderRef.current.start();
		} catch (err) {
			console.error("The following error occurred: ", err);
		}
	};

	// transcription
	useEffect(() => {
		if (!recorderRef.current) return;
		if (!recording) return;

		if (chunks.length > 0) {
			// Generate from data
			const blob = new Blob(chunks, { type: recorderRef.current.mimeType });

			const fileReader = new FileReader();

			fileReader.onloadend = async () => {
				const arrayBuffer = fileReader.result;
				if (audioContextRef.current === null) {
					console.debug("Audio context is null");
					return;
				}
				if (!arrayBuffer) {
					console.debug("Array buffer is null");
					return;
				}
				if (!(arrayBuffer instanceof ArrayBuffer)) {
					console.debug("Array buffer is not an ArrayBuffer");
					return;
				}
				const decoded =
					await audioContextRef.current.decodeAudioData(arrayBuffer);
				let audio = decoded.getChannelData(0);
				if (audio.length > MAX_SAMPLES) {
					// Get last MAX_SAMPLES
					audio = audio.slice(-MAX_SAMPLES);
				}
				console.debug("Decoded audio", audio);

				const audioFloat32 = new Float32Array(audio);

				// Run Whisper in Offscreen Document (supports dynamic import() for WebGPU)
				// Service Worker does not support dynamic import() per HTML spec
				try {
					if (!modelLoadedRef.current) {
						chrome.runtime.sendMessage({
							type: "model-status",
							data: { status: "loading", progress: 0 },
						});
						await initializeWhisperWorker((progress) => {
							chrome.runtime.sendMessage({
								type: "model-status",
								data: { status: "loading", progress },
							});
						});
						modelLoadedRef.current = true;
						chrome.runtime.sendMessage({
							type: "model-status",
							data: { status: "ready" },
						});
					}

					const { mode, transcribeLanguage } = transcriptionSettings;
					const task = mode === "translate" ? "translate" : "transcribe";
					const language = mode === "transcribe" ? transcribeLanguage : null;

					const transcripted = (await processWhisperMessage(
						audioFloat32,
						language,
						task,
					)) as string[] | undefined;

					if (transcripted) {
						chrome.runtime.sendMessage({
							type: "transcript",
							data: {
								transcripted: transcripted.join("\n"),
							},
						});
					}
				} catch (err) {
					console.error("Transcription failed:", err);
					chrome.runtime.sendMessage({
						type: "model-status",
						data: { status: "error" },
					});
				}
			};
			fileReader.readAsArrayBuffer(blob);
		} else {
			recorderRef.current?.requestData();
		}
	}, [recording, chunks, transcriptionSettings]);

	const setupTriggeredRef = React.useRef(false);
	const setupOffscreen = () => {
		if (setupTriggeredRef.current) return;
		setupTriggeredRef.current = true;
		console.debug("Setting up offscreen script");
		chrome.runtime.onMessage.addListener(async (message) => {
			if (message.target !== "offscreen") return;
			console.debug("Received message", message);

			if (message.type === "start-recording") {
				console.debug("Received start-recording message", message.streamId);
				setupMediaRecorder(message.streamId);
			} else if (message.type === "stop-recording") {
				console.debug("Received stop-recording message");
				if (recorderRef.current?.state === "recording") {
					recorderRef.current.stop();
					recorderRef.current.stream.getTracks().forEach((track) => {
						track.stop();
					});
					recorderRef.current = null;
				}
				micStreamRef.current?.getTracks().forEach((track) => {
					track.stop();
				});
				micStreamRef.current = null;
				mixContextRef.current?.close();
				mixContextRef.current = null;
			}
		});

		// send offscreen ready message
		chrome.runtime.sendMessage({
			type: "offscreen-ready",
		});
	};

	useEffect(() => {
		setupOffscreen();
	});
	return (
		<div>
			<h1>Offscreen</h1>
			{/* mic permission button */}
		</div>
	);
};

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
// biome-ignore lint/style/noNonNullAssertion: root element is guaranteed to exist in index.html
ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<Offscreen />
	</React.StrictMode>,
);
