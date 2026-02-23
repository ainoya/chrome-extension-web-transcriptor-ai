/// <reference types="vite/client" />
/// <reference types="@types/dom-chromium-ai" />

declare global {
	interface Window {
		ai?: {
			languageModel: {
				capabilities(): Promise<{ available: string }>;
			};
			assistant: {
				create(options: {
					systemPrompt: string;
					topK?: number;
					temperature?: number;
				}): Promise<{
					prompt(text: string): Promise<string>;
					destroy(): void;
				}>;
			};
		};
	}
}

export {};
