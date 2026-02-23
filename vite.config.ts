import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path, { resolve } from "node:path";
import { copyFileSync, mkdirSync, existsSync } from "node:fs";

// Copy ONNX Runtime JSEP .mjs to assets (Chrome extension cannot fetch from CDN)
function copyOrtMjs() {
	return {
		name: "copy-ort-mjs",
		closeBundle() {
			const src = resolve(
				__dirname,
				"node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs",
			);
			const destDir = resolve(__dirname, "dist/assets");
			const dest = resolve(destDir, "ort-wasm-simd-threaded.jsep.mjs");
			if (existsSync(src)) {
				mkdirSync(destDir, { recursive: true });
				copyFileSync(src, dest);
			}
		},
	};
}

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), copyOrtMjs()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	build: {
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
				sidepanel: resolve(__dirname, "sidepanel.html"),
				offscreen: resolve(__dirname, "offscreen.html"),
				background: resolve(__dirname, "src/background.ts"),
			},
			output: {
				entryFileNames: "assets/[name].js",
				chunkFileNames: "assets/[name].js",
				assetFileNames: "assets/[name].[ext]",
			},
		},
	},
});
