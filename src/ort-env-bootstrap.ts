/**
 * Must run BEFORE any transformers/onnx imports.
 * Configures ONNX Runtime to use local WASM files - Chrome extension CSP blocks CDN.
 */
// @ts-expect-error onnxruntime-web has type resolution issues with package.json exports
import * as ort from "onnxruntime-web";
ort.env.wasm.wasmPaths = chrome.runtime.getURL("assets/");
