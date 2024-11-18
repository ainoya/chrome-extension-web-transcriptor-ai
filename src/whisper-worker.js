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

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
class AutomaticSpeechRecognitionPipeline {
  static model_id = null;
  static tokenizer = null;
  static processor = null;
  static model = null;

  static async getInstance(progress_callback = null) {
    // biome-ignore lint/complexity/noThisInStatic: <explanation>
    this.model_id = "onnx-community/whisper-base";
    // this.model_id = "onnx-community/whisper-large-v3-turbo";

    AutomaticSpeechRecognitionPipeline;
    AutomaticSpeechRecognitionPipeline.tokenizer ??=
      // biome-ignore lint/complexity/noThisInStatic: <explanation>
      AutoTokenizer.from_pretrained(this.model_id, {
        progress_callback,
      });
    // biome-ignore lint/complexity/noThisInStatic: <explanation>
    this.processor ??= AutoProcessor.from_pretrained(this.model_id, {
      progress_callback,
    });

    // biome-ignore lint/complexity/noThisInStatic: <explanation>
    this.model ??= WhisperForConditionalGeneration.from_pretrained(
      // biome-ignore lint/complexity/noThisInStatic: <explanation>
      this.model_id,
      {
        dtype: {
          encoder_model: "fp32", // 'fp16' works too
          decoder_model_merged: "q4", // or 'fp32' ('fp16' is broken)
        },
        device: "webgpu",
        progress_callback,
      }
    );
    // biome-ignore lint/complexity/noThisInStatic: <explanation>
    return Promise.all([this.tokenizer, this.processor, this.model]);
  }
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
  console.debug("processWhisperMessage", audio, language);
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
      }
      // self.postMessage(data);
    });

  let startTime;
  let numTokens = 0;
  const callback_function = (output) => {
    startTime ??= performance.now();

    let tps;
    if (numTokens++ > 0) {
      tps = (numTokens / (performance.now() - startTime)) * 1000;
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

  const outputs = await model.generate({
    ...inputs,
    max_new_tokens: MAX_NEW_TOKENS,
    language,
    streamer,
  });

  const outputText = tokenizer.batch_decode(outputs, {
    skip_special_tokens: true,
  });

  // Send the output back to the main thread
  console.debug("outputText", outputText);
  // self.postMessage({
  //   status: "complete",
  //   output: outputText,
  // });
  processing = false;
  return outputText;
}

async function load() {
  // self.postMessage({
  //   status: "loading",
  //   data: "Loading model...",
  // });

  // Load the pipeline and save it for future use.
  const [tokenizer, processor, model] =
    await AutomaticSpeechRecognitionPipeline.getInstance((data) => {
      // We also add a progress callback to the pipeline so that we can
      // track model loading.
      if (
        data.status === "progress" &&
        Math.ceil(data.progress * 100) % 10 === 0
      ) {
        console.debug(`Model loading: ${data.progress}%`);
      }
      // self.postMessage(data);
    });

  // self.postMessage({
  //   status: "loading",
  //   data: "Compiling shaders and warming up model...",
  // });

  // Run model with dummy input to compile shaders
  await model.generate({
    input_features: full([1, 80, 3000], 0.0),
    max_new_tokens: 1,
  });
  // self.postMessage({ status: "ready" });
}
// Listen for messages from the main thread
// chrome.addEventListener(async (message) => {
//   const { type, data } = message.data;
//   if (type !== "transcription-generate") return;

//   switch (data.type) {
//     case "load":
//       load();
//       break;

//     case "generate":
//       generate(data);
//       break;
//   }
// });
