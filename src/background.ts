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
	chrome.runtime.onMessage.addListener((message) => {
		console.debug("Received message", message);
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
		// Whisper transcription runs in Offscreen Document (not Service Worker)
		// because Service Worker does not support dynamic import() required by WebGPU
	});

	console.debug("tab info:", tab);
	console.debug("tab url", tab.url);
});
