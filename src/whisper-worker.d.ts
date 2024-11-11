/* eslint-disable @typescript-eslint/no-explicit-any */
export declare module "./whisper-worker.js" {
	export declare function processWhisperMessage(
		audio: Float32Array,
		language: string,
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	): Promise<any>;
}
