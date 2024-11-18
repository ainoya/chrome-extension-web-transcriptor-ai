# Chrome Extension for Transcribing Audio in Chrome Browser Tabs

A Chrome extension that transcribes audio within a browser tab using [transformers.js](https://github.com/huggingface/transformers.js) and the [TabCapture API](https://developer.chrome.com/docs/extensions/reference/tabCapture/).

- **Privacy-Focused**: Only downloads the transcription model; does not send audio files externally for transcription.
- **Offline Processing**: All transcription is performed locally within the browser.
- **Multi-Language Support**: Supports multiple languages for transcription.

## Demo

![Demo](./images/chrome-extension-web-transcriptor-ai.gif)

*This [YouTube video](https://www.youtube.com/watch?v=Boj9eD0Wug8) is licensed under CC BY.*

## References

- [xenova/whisper-web](https://github.com/xenova/whisper-web/tree/81869ed62970ff4373509b6004a6c9a3f0c5b64d): Used as a reference for implementation.
- [transformers.js/examples/webgpu](https://github.com/huggingface/transformers.js/tree/7a58d6e11968dd85dc87ce37b2ab37213165889a/examples/webgpu-whisper): Used as a reference for implementation.
- [Book - Free Education Icons](https://www.flaticon.com/free-icon/book_1679072?term=magic&page=1&position=46&origin=search&related_id=1679072): Used as the icon for the extension.

## Related works

- [ainoya/chrome\-extension\-web\-distiller\-ai: Chrome extension that summarizes web page contents using Gemini Nano\. Features include secure in\-browser summarization, markdown output, and translation options\.](https://github.com/ainoya/chrome-extension-web-distiller-ai)
