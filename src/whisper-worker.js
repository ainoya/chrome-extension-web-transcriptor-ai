/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
	AutoProcessor,
	AutoTokenizer,
	TextStreamer,
	WhisperForConditionalGeneration,
	full,
} from "@huggingface/transformers";

const MAX_NEW_TOKENS = 64;

/**
 * This class uses the Singleton pattern to ensure that only one instance of the model is loaded.
 */

// biome-ignore lint/complexity/noStaticOnlyClass: Singleton pattern for model loading
class AutomaticSpeechRecognitionPipeline {
	static model_id = null;
	static tokenizer = null;
	static processor = null;
	static model = null;

	static async getInstance(progress_callback = null) {
		// biome-ignore lint/complexity/noThisInStatic: static class with shared state for model loading
		this.model_id = "onnx-community/whisper-large-v3-turbo";
		// this.model_id = "onnx-community/whisper-base";

		AutomaticSpeechRecognitionPipeline;
		AutomaticSpeechRecognitionPipeline.tokenizer ??=
			// biome-ignore lint/complexity/noThisInStatic: static class with shared state for model loading
			AutoTokenizer.from_pretrained(this.model_id, {
				progress_callback,
			});
		// biome-ignore lint/complexity/noThisInStatic: static class with shared state for model loading
		this.processor ??= AutoProcessor.from_pretrained(this.model_id, {
			progress_callback,
		});

		// biome-ignore lint/complexity/noThisInStatic: static class with shared state for model loading
		this.model ??= WhisperForConditionalGeneration.from_pretrained(
			// biome-ignore lint/complexity/noThisInStatic: static class with shared state for model loading
			this.model_id,
			{
				dtype: {
					encoder_model: "fp16", // 'fp16' works too
					decoder_model_merged: "q4", // or 'fp32' ('fp16' is broken)
				},
				device: "webgpu",
				progress_callback,
			},
		);
		// biome-ignore lint/complexity/noThisInStatic: static class with shared state for model loading
		return Promise.all([this.tokenizer, this.processor, this.model]);
	}
}

/**
 * Convert UI language format to Whisper format.
 * UI uses compound names (e.g. "spanish/castilian") but Whisper expects single names (e.g. "spanish").
 */
function toWhisperLanguage(language) {
	if (!language || typeof language !== "string") return language;
	return language.includes("/") ? language.split("/")[0].trim() : language;
}

/**
 * Get Whisper task based on language.
 * - English: transcribe (output in English)
 * - Non-English: translate (output in English, translating from source language)
 */
function getTaskFromLanguage(language) {
	const whisperLang = toWhisperLanguage(language);
	return whisperLang === "english" ? "transcribe" : "translate";
}

let processing = false;
export async function processWhisperMessage(audio, language) {
	if (processing) return;
	processing = true;
	if (!audio) {
		console.debug("No audio data provided.");
		processing = false;
		return;
	}
	const whisperLanguage = toWhisperLanguage(language);
	console.debug("processWhisperMessage", audio, whisperLanguage);
	// const audioF32 = new Float32Array(audio);
	// console.debug("audio", audioF32);

	// Tell the main thread we are starting
	// self.postMessage({ status: "start" });

	// Retrieve the text-generation pipeline.
	const [tokenizer, processor, model] =
		await AutomaticSpeechRecognitionPipeline.getInstance((data) => {
			// We also add a progress callback to the pipeline so that we can
			// track model loading.
			if (
				data.status === "progress" &&
				Math.ceil(data.progress * 100) % 10 === 0
			) {
				console.debug(`Model loading: ${data.progress}%`);
				chrome.runtime.sendMessage({ type: "whisper-progress", data });
			}
			// self.postMessage(data);
		});

	let startTime;
	let numTokens = 0;
	const callback_function = (output) => {
		startTime ??= performance.now();

		let _tps;
		if (numTokens++ > 0) {
			_tps = (numTokens / (performance.now() - startTime)) * 1000;
		}
		console.debug("callback_func/output", output);
		// self.postMessage({
		//   status: "update",
		//   output,
		//   tps,
		//   numTokens,
		// });
	};

	const streamer = new TextStreamer(tokenizer, {
		skip_prompt: true,
		skip_special_tokens: true,
		callback_function,
	});

	const inputs = await processor(audio);

	const task = getTaskFromLanguage(language);
	console.debug("Whisper task:", task, "language:", whisperLanguage);

	const outputs = await model.generate({
		...inputs,
		max_new_tokens: MAX_NEW_TOKENS,
		task,
		language: whisperLanguage,
		streamer,
	});

	const outputText = tokenizer.batch_decode(outputs, {
		skip_special_tokens: true,
	});

	// Send the output back to the main thread
	console.debug("outputText", outputText);
	processing = false;
	return outputText;
}

export async function initializeWhisperWorker(progress_callback) {
	// Load the pipeline and save it for future use.
	const [_tokenizer, _processor, model] =
		await AutomaticSpeechRecognitionPipeline.getInstance((data) => {
			// We also add a progress callback to the pipeline so that we can
			// track model loading.
			console.debug("data", data);
			if (
				data.status === "progress" &&
				Math.ceil(data.progress * 100) % 10 === 0
			) {
				console.debug(`Model loading: ${data.progress}%`);
				progress_callback(data.progress);
			}
			// self.postMessage(data);
		});

	// Run model with dummy input to compile shaders
	await model.generate({
		input_features: full([1, 128, 3000], 0.0),
		max_new_tokens: 1,
	});
}
