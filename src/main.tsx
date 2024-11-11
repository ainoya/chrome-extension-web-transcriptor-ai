import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./globals.css";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
// biome-ignore lint/style/noNonNullAssertion: <explanation>
ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
