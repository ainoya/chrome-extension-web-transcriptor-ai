import React from "react";
import ReactDOM from "react-dom/client";
import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/toaster";
import SidePanelApp from "./side-panel-app";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
// biome-ignore lint/style/noNonNullAssertion: <explanation>
ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<ThemeProvider storageKey="chrome-extension-transcriptor-theme">
			<SidePanelApp />
			<Toaster />
		</ThemeProvider>
	</React.StrictMode>,
);
