import Popup from "./Popup";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/toaster";

function App() {
	return (
		<ThemeProvider storageKey="chrome-extension-transcriptor-theme">
			<Popup />
			<Toaster />
		</ThemeProvider>
	);
}

export default App;
