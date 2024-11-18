import React from "react";
import { useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./globals.css";
import { useAtom } from "jotai";
import { transcriptionSettingsAtom } from "./jotai/settingAtom";

// https://github.com/huggingface/transformers.js/blob/7a58d6e11968dd85dc87ce37b2ab37213165889a/examples/webgpu-whisper/src/App.jsx
// const IS_WEBGPU_AVAILABLE = !!navigator.gpu;

const WHISPER_SAMPLING_RATE = 16_000;
const MAX_AUDIO_LENGTH = 30; // seconds
const MAX_SAMPLES = WHISPER_SAMPLING_RATE * MAX_AUDIO_LENGTH;

export const Offscreen: React.FC = () => {
	const [transcriptionSettings] = useAtom(transcriptionSettingsAtom);
	const language = transcriptionSettings.language;
	const recorderRef = React.useRef<MediaRecorder | null>(null);
	const [recording, setRecording] = React.useState(false);
	const audioContextRef = React.useRef<AudioContext | null>(null);
	const [chunks, setChunks] = React.useState<Blob[]>([]);

	const setupMediaRecorder = (streamId: string) => {
		if (recorderRef.current) return; // Already set

		navigator.mediaDevices
			.getUserMedia({
				audio: {
					// @ts-expect-error - Chrome-specific properties
					mandatory: {
						chromeMediaSource: "tab",
						chromeMediaSourceId: streamId,
					},
				},
			})
			.then((stream) => {
				console.debug("Setting up media recorder", stream);

				recorderRef.current = new MediaRecorder(stream);
				audioContextRef.current = new AudioContext({
					sampleRate: 16000,
				});

				// Continue to play the captured audio to the user.
				const output = new AudioContext();
				const source = output.createMediaStreamSource(
					recorderRef.current.stream,
				);
				source.connect(output.destination);

				recorderRef.current.onstart = () => {
					setRecording(true);
					setChunks([]);
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
				};
				recorderRef.current.start();
			})
			.catch((err) => console.error("The following error occurred: ", err));
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

				const serializedAudio = JSON.stringify(Array.from(audio));

				// worker.current.postMessage({
				//   type: "generate",
				//   data: { audio, language },
				// });
				chrome.runtime.sendMessage({
					type: "transcription-message",
					data: {
						type: "generate",
						serializedAudio: serializedAudio,
						// model: "Xenova/whisper-tiny",
						// multilingual: true,
						// quantized: false,
						// subtask: "transcribe",
						language: language,
					},
				});
			};
			fileReader.readAsArrayBuffer(blob);
		} else {
			recorderRef.current?.requestData();
		}
	}, [recording, chunks, language]);

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
// biome-ignore lint/style/noNonNullAssertion: <explanation>
ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<Offscreen />
	</React.StrictMode>,
);
