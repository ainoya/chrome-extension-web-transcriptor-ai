let pendingTabId: number | undefined;
let isRecording = false;

const sendStartRecording = (tabId: number) => {
	chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => {
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
	});
};

const startRecording = async (tabId: number): Promise<void> => {
	const existingContexts = await chrome.runtime.getContexts({});
	const offscreenDocument = existingContexts.find(
		(c) => c.contextType === "OFFSCREEN_DOCUMENT",
	);

	if (!offscreenDocument) {
		try {
			console.debug("creating offscreenDocument");
			await chrome.offscreen.createDocument({
				url: "offscreen.html",
				reasons: [chrome.offscreen.Reason.USER_MEDIA],
				justification: "Recording from chrome.tabCapture API",
			});
			pendingTabId = tabId;
		} catch (err) {
			console.error("Failed to create offscreen document:", err);
			pendingTabId = undefined;
			throw err;
		}
	} else {
		sendStartRecording(tabId);
	}
};

chrome.action.onClicked.addListener(async (tab) => {
	if (tab.id === undefined) {
		console.debug("Tab ID is undefined");
		return;
	}
	console.debug("Tab ID:", tab.id);
	await startRecording(tab.id);
	console.debug("tab info:", tab);
	console.debug("tab url", tab.url);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	console.debug("Received message", message);

	if (message.type === "start-transcription") {
		chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
			try {
				const tab = tabs[0];
				if (tab?.id) {
					await startRecording(tab.id);
					sendResponse({ success: true });
				} else {
					sendResponse({ success: false, error: "No active tab" });
				}
			} catch (err) {
				console.error("Failed to start transcription:", err);
				sendResponse({ success: false, error: String(err) });
			}
		});
		return true; // Keep channel open for async sendResponse
	}

	if (message.type === "stop-transcription") {
		chrome.runtime.sendMessage({
			type: "stop-recording",
			target: "offscreen",
		});
		sendResponse({ success: true });
		return false;
	}

	if (message.type === "get-recording-state") {
		sendResponse({ recording: isRecording });
		return false;
	}

	if (message.type === "recording-state") {
		isRecording = message.data?.recording ?? false;
		chrome.runtime.sendMessage({
			type: "recording-state",
			data: { recording: isRecording },
		});
		return false;
	}

	if (message.type === "offscreen-ready") {
		if (pendingTabId === undefined) {
			console.debug("No pending tab for recording");
			return false;
		}
		console.debug("Received offscreen-ready message");
		const tabId = pendingTabId;
		pendingTabId = undefined;
		sendStartRecording(tabId);
		return false;
	}

	return false;
});
