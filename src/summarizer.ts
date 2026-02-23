import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

export async function summarizeWebPage(language: string): Promise<string> {
	// get current tab content
	console.debug("summarizeWebPage");
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	if (!tab.id) {
		throw new Error("No active tab found");
	}
	const [{ result: content }] = await chrome.scripting.executeScript({
		target: { tabId: tab.id },
		func: () => document.documentElement.outerHTML,
	});
	if (!content) {
		throw new Error("Failed to get content from the active tab");
	}

	// Extract article content using Readability
	const doc = new DOMParser().parseFromString(content, "text/html");
	const reader = new Readability(doc);
	const article = reader.parse();

	if (!article?.content) {
		throw new Error("Failed to extract article content");
	}

	// Convert article content to markdown using Turndown
	const turndownService = new TurndownService();
	const markdown = turndownService.turndown(article.content);

	const markdownLines = markdown.split("\n");

	// extract first N lines to avoid exceeding the input limit
	const maxLength = 40;
	if (markdownLines.length > maxLength) {
		markdownLines.splice(maxLength);
	}

	// Generate summary using Gemini Nano
	if (!window.ai) {
		throw new Error("AI capabilities not available");
	}
	const session = await window.ai.assistant.create({
		systemPrompt:
			"You are helpful assistant to summarize web article. Your output is markdown formatted. please summary with bullet points and meaningful sections.",
		topK: 10,
		temperature: 0,
	});

	const markdownPrompt = markdownLines.join("\n");

	const prompt = `Summarize the following text.:\n\n${markdownPrompt}`;
	console.debug("prompt", prompt);
	let summary = await session.prompt(prompt);
	session.destroy();

	// Translate the summary to Japanese
	console.debug("language", language);
	// initialize session for tlanslation
	const sessionTranslator = await window.ai.assistant.create({
		systemPrompt: "You are helpful assistant to translate the summary",
		topK: 10,
		temperature: 0,
	});

	if (language === "japanese") {
		summary = await sessionTranslator.prompt(
			`日本語に翻訳してください:\n\n${summary}`,
		);
		console.debug("translated", summary);
	}
	sessionTranslator.destroy();

	console.debug("summary", summary);

	// Add title and URL to the summary
	const titleAndUrl = `# [${tab.title}](${tab.url})\n\n`;
	return titleAndUrl + summary;
}
