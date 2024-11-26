# Chrome Extension for Transcribing Audio in Chrome Browser Tabs

A Chrome extension that transcribes audio within a browser tab using [transformers.js](https://github.com/huggingface/transformers.js) and the [TabCapture API](https://developer.chrome.com/docs/extensions/reference/tabCapture/).

- **Privacy-Focused**: Only downloads the transcription model; does not send audio files externally for transcription.
- **Offline Processing**: All transcription is performed locally within the browser.
- **Multi-Language Support**: Supports multiple languages for transcription.

## Install

1. You can use the pre-built `dist.zip` from the releases:
    - Download it from [here](https://github.com/ainoya/chrome-extension-web-transcriptor-ai/releases/latest).

2. Load the extension into Chrome:

    - Open Chrome and navigate to `chrome://extensions/`.
    - Enable "Developer mode" in the top right corner.
    - Click "Load unpacked" and select the `dist` directory from this repository or the extracted `dist.zip`.

## Usage

1. Right-click the Chrome extension icon to open the side panel.
2. Left-click the Chrome extension icon to start capturing audio within the tab.
3. Once the model setup is complete, the transcribed text will be displayed in the transcription area.
4. You can copy the transcribed text to the clipboard using the copy button.

## Demo

![Demo](./images/chrome-extension-web-transcriptor-ai.gif)

*This [YouTube video](https://www.youtube.com/watch?v=Boj9eD0Wug8) is licensed under CC BY.*

## References

- [xenova/whisper-web](https://github.com/xenova/whisper-web/tree/81869ed62970ff4373509b6004a6c9a3f0c5b64d): Used as a reference for implementation.
- [transformers.js/examples/webgpu](https://github.com/huggingface/transformers.js/tree/7a58d6e11968dd85dc87ce37b2ab37213165889a/examples/webgpu-whisper): Used as a reference for implementation.
- [Book - Free Education Icons](https://www.flaticon.com/free-icon/book_1679072?term=magic&page=1&position=46&origin=search&related_id=1679072): Used as the icon for the extension.
- [My blob article](https://ainoya.dev/posts/chrome-extension-for-edge-transcription/)

## Related works

- [ainoya/chrome\-extension\-web\-distiller\-ai: Chrome extension that summarizes web page contents using Gemini Nano\. Features include secure in\-browser summarization, markdown output, and translation options\.](https://github.com/ainoya/chrome-extension-web-distiller-ai)
