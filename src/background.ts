import { processWhisperMessage } from "./whisper-worker.js";

chrome.action.onClicked.addListener(async (tab) => {
	if (tab.id === undefined) {
		console.debug("Tab ID is undefined");
		return;
	}
	console.debug("Tab ID:", tab.id);

	const existingContexts = await chrome.runtime.getContexts({});

	const offscreenDocument = existingContexts.find(
		(c) => c.contextType === "OFFSCREEN_DOCUMENT",
	);

	// If an offscreen document is not already open, create one.
	if (!offscreenDocument) {
		// Create an offscreen document.
		console.debug("creating offscreenDocument");
		await chrome.offscreen.createDocument({
			url: "offscreen.html",
			reasons: [chrome.offscreen.Reason.USER_MEDIA],
			justification: "Recording from chrome.tabCapture API",
		});
	}

	// once the offscreen document is ready, send the stream ID to start recording
	chrome.runtime.onMessage.addListener(async (message) => {
		if (message.type === "offscreen-ready") {
			console.debug("Received offscreen-ready message");
			// Send the stream ID to the offscreen document to start recording.
			chrome.tabCapture.getMediaStreamId(
				{
					targetTabId: tab.id,
				},
				(streamId) => {
					if (!streamId) {
						console.error("service-worker: Failed to get stream ID");
						return;
					}
					console.debug("Stream ID:", streamId);
					chrome.runtime.sendMessage({
						type: "start-recording",
						target: "offscreen",
						streamId,
					});
					console.debug("Sent start-recording message");
				},
			);
		}
		if (message.type === "transcription-message") {
			console.debug("Received transcripton message", message);
			const { serializedAudio, language } = message.data;
			const audio = new Float32Array(JSON.parse(serializedAudio));
			console.debug("audio, language", audio, language);
			const transcripted = (await processWhisperMessage(
				audio,
				language,
			)) as string[];

			chrome.runtime.sendMessage({
				type: "transcript",
				data: {
					transcripted: transcripted.join("\n"),
				},
			});
		}
	});

	console.debug("tab info:", tab);
	console.debug("tab url", tab.url);
});

// chrome.sidePanel
//   .setPanelBehavior({
//     openPanelOnActionClick: true,
//   })
//   .catch((error) => {
//     console.error("Failed to set panel behavior:", error);
//   });
