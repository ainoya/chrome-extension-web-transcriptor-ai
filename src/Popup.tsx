import type React from "react";
import { useEffect, useState } from "react";
import { AiSummarizer } from "./components/ai-summarizer";
import { Textarea } from "./components/ui/textarea";
import { useToast } from "./components/ui/use-toast";
import { summarizeWebPage } from "./summarizer";

const getDefaultLanguage = () => {
	const browserLocale = navigator.language;
	if (browserLocale.startsWith("ja")) {
		return "japanese";
	}
	return "english";
};

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

const Popup: React.FC = () => {
	const [summary, setSummary] = useState("");
	const [language, setLanguage] = useState(getDefaultLanguage());
	const [isSummaryLoading, setIsSummaryLoading] = useState(false);
	const [aiCapabilities, setAiCapabilities] = useState<{ available: string }>({
		available: "no",
	});
	const [transcription, setTranscription] = useState("");

	useEffect(() => {
		fetchAiCapabilities().then((capabilities) => {
			setAiCapabilities(capabilities);
		});

		chrome.runtime.onMessage.addListener((message) => {
			if (message.type === "transcript") {
				setTranscription((prev) => `${prev}\n${message.data}`);
			}
		});
	}, []);

	const { toast } = useToast();

	const handleSummarize = async () => {
		setIsSummaryLoading(true);
		try {
			const result = await summarizeWebPage(language);
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
			<div className="box-border h-auto w-[400px]">
				{/* Transcription from web speech api */}
				<div className="flex flex-col m-1 p-1">
					<div className="text-center">
						<h1>Transcription</h1>
						<Textarea value={transcription} rows={10} readOnly />
					</div>
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
						setLanguage={setLanguage}
						language={language}
						isSummaryLoading={isSummaryLoading}
						handleSummarize={handleSummarize}
						summary={summary}
					/>
				)}
			</div>
		</div>
	);
};

export default Popup;
