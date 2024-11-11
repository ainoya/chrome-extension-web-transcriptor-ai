import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/toaster";
import Popup from "./Popup";

function App() {
  return (
    <ThemeProvider storageKey="chrome-extension-transcriptor-theme">
      <Popup />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
