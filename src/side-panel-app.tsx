import type React from "react";
import { useEffect, useState } from "react";
import { AiSummarizer } from "./components/ai-summarizer";
import { Button } from "./components/ui/button";
import { Textarea } from "./components/ui/textarea";
import { useToast } from "./components/ui/use-toast";
import { summarizeWebPage } from "./summarizer";
import { LanguageSelector } from "./components/LanguageSelector";
import {
	type TranscriptionLanguage,
	transcriptionSettingsAtom,
	TRANSLATE_TARGET_LANGUAGES,
} from "./jotai/settingAtom";
import { useAtom } from "jotai";
import {
	modelLoadingProgressAtom,
	modelStatusAtom,
} from "./jotai/modelStatusAtom";

const fetchAiCapabilities = async () => {
	if (!window.ai) {
		return {
			available: "no",
		};
	}

	const { available } = await window.ai.languageModel.capabilities();

	return {
		available,
	};
};

const SidePanelApp: React.FC = () => {
	const [summary, setSummary] = useState("");
	const [transcriptionSettings, setTranscriptionSettings] = useAtom(
		transcriptionSettingsAtom,
	);
	const [isSummaryLoading, setIsSummaryLoading] = useState(false);
	const [aiCapabilities, setAiCapabilities] = useState<{ available: string }>({
		available: "no",
	});
	const [transcription, setTranscription] = useState("");
	const [modelStatus, setModelStatus] = useAtom(modelStatusAtom);
	const [loadingProgress, setLoadingProgress] = useAtom(
		modelLoadingProgressAtom,
	);

	useEffect(() => {
		fetchAiCapabilities().then((capabilities) => {
			setAiCapabilities(capabilities);
		});

		chrome.runtime.onMessage.addListener((message) => {
			if (message.type === "transcript") {
				console.debug("Received transcript message", message.data.transcripted);
				setTranscription((prev) => `${prev}\n${message.data.transcripted}`);
			} else if (message.type === "model-status") {
				console.debug("Received model status", message.data.status);
				setModelStatus(message.data.status);
				if (message.data.status === "loading") {
					setLoadingProgress(message.data.progress);
				}
			}
		});
	}, [setModelStatus, setLoadingProgress]);

	const { toast } = useToast();

	const handleSummarize = async () => {
		setIsSummaryLoading(true);
		try {
			const result = await summarizeWebPage(
				transcriptionSettings.summarizationLanguage,
			);
			setSummary(result);
			toast({
				description: "Summarized",
				color: "success",
			});
		} catch (error) {
			console.error(error);
			setSummary(`Failed to summarize: ${error}`);
			toast({
				description: "Failed to summarize",
				color: "error",
			});
		} finally {
			setIsSummaryLoading(false);
		}
	};

	return (
		<div className="container">
			<div className="box-border">
				{/* Transcription from web speech api */}
				<div className="flex flex-col m-1 p-1">
					<h1>Transcription</h1>
					<div className="text-center mt-1">
						<Textarea value={transcription} rows={20} readOnly />
					</div>
					{/* model status */}
					<div className="text-center">
						<h1>Model Status: {modelStatus}</h1>
						{modelStatus === "loading" && <p>{loadingProgress}% loaded</p>}
					</div>
				</div>
				<div className="flex flex-col m-1 p-1">
					{/* Mode selector */}
					<div className="mb-2">
						<label className="text-sm font-medium block mb-1">
							Transcription Mode
						</label>
						<div className="flex gap-4">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									name="mode"
									checked={transcriptionSettings.mode === "transcribe"}
									onChange={() =>
										setTranscriptionSettings((prev) => ({
											...prev,
											mode: "transcribe",
										}))
									}
								/>
								<span className="text-sm">Transcribe</span>
							</label>
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="radio"
									name="mode"
									checked={transcriptionSettings.mode === "translate"}
									onChange={() =>
										setTranscriptionSettings((prev) => ({
											...prev,
											mode: "translate",
										}))
									}
								/>
								<span className="text-sm">Translate</span>
							</label>
						</div>
					</div>

					{/* Transcribe mode: source language */}
					{transcriptionSettings.mode === "transcribe" && (
						<div className="mb-2">
							<label className="text-sm font-medium block mb-1">
								Source Language
							</label>
							<LanguageSelector
								language={transcriptionSettings.transcribeLanguage}
								setLanguage={(lang) =>
									setTranscriptionSettings((prev) => ({
										...prev,
										transcribeLanguage: lang,
									}))
								}
								includeAuto
							/>
							<p className="text-xs text-muted-foreground mt-1">
								Output in the same language as input
							</p>
						</div>
					)}

					{/* Translate mode: target language */}
					{transcriptionSettings.mode === "translate" && (
						<div className="mb-2">
							<label className="text-sm font-medium block mb-1">
								Target Language
							</label>
							<select
								className="rounded px-3 py-1.5 text-sm border"
								value={
									transcriptionSettings.translateTargetLanguage ?? "english"
								}
								onChange={(e) =>
									setTranscriptionSettings((prev) => ({
										...prev,
										translateTargetLanguage: e.target
											.value as "english",
									}))
								}
							>
								{TRANSLATE_TARGET_LANGUAGES.map((lang) => (
									<option key={lang} value={lang}>
										{lang.charAt(0).toUpperCase() + lang.slice(1)}
									</option>
								))}
							</select>
							<p className="text-xs text-muted-foreground mt-1">
								Translate audio to English (Whisper limitation)
							</p>
						</div>
					)}

					<label className="flex items-center gap-2 mt-2 cursor-pointer">
						<input
							type="checkbox"
							checked={transcriptionSettings.includeMicrophone ?? false}
							onChange={(e) =>
								setTranscriptionSettings((prev) => ({
									...prev,
									includeMicrophone: e.target.checked,
								}))
							}
							className="rounded"
						/>
						<span className="text-sm">Include microphone</span>
					</label>
					<p className="text-xs text-muted-foreground mt-0.5">
						Mix your voice with tab audio for transcription
					</p>
				</div>
				{/* record button */}
				{/* <div className="flex flex-col m-1 p-1">
          <Button
            onClick={() => chrome.runtime.sendMessage({ type: "startCapture" })}
          >
            Stop Recording
          </Button>
        </div> */}
				{/* if status is unknown or error, show loading model button */}
				{/* {(modelStatus === "unknown" || modelStatus === "error") && (
          <div className="flex flex-col m-1 p-1">
            <Button
              onClick={() =>
                chrome.runtime.sendMessage({
                  type: "initialize-transcription-model",
                })
              }
            >
              Load Model
            </Button>
          </div>
        )} */}

				{/* copy to clipboard button */}
				<div className="flex flex-col m-1 p-1">
					<Button
						onClick={() => {
							navigator.clipboard.writeText(transcription);
							toast({
								description: "Copied to clipboard",
								color: "success",
								duration: 1000,
							});
						}}
					>
						Copy to Clipboard
					</Button>
				</div>

				{aiCapabilities.available === "no" && (
					<div className="flex flex-col m-1 p-1">
						<div className="text-center">
							<h1>AI Summarization is not available</h1>
							<p>
								AI Summarization is not available. Please make sure your chrome
								supports Prompt API.
							</p>
						</div>
					</div>
				)}
				{aiCapabilities.available !== "no" && (
					<AiSummarizer
						setLanguage={(language: TranscriptionLanguage) =>
							setTranscriptionSettings((prev) => ({
								...prev,
								summarizationLanguage: language,
							}))
						}
						language={transcriptionSettings.summarizationLanguage}
						isSummaryLoading={isSummaryLoading}
						handleSummarize={handleSummarize}
						summary={summary}
					/>
				)}
			</div>
		</div>
	);
};

export default SidePanelApp;
