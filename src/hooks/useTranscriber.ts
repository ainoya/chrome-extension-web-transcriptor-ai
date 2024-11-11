/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
// https://github.com/xenova/whisper-web/blob/main/src/hooks/useTranscriber.ts
// import { useCallback, useMemo, useState } from "react";

// interface ProgressItem {
//   file: string;
//   loaded: number;
//   progress: number;
//   total: number;
//   name: string;
//   status: string;
// }

// interface TranscriberUpdateData {
//   data: [
//     string,
//     { chunks: { text: string; timestamp: [number, number | null] }[] }
//   ];
//   text: string;
// }

// interface TranscriberCompleteData {
//   data: {
//     text: string;
//     chunks: { text: string; timestamp: [number, number | null] }[];
//   };
// }

// export interface TranscriberData {
//   isBusy: boolean;
//   text: string;
//   chunks: { text: string; timestamp: [number, number | null] }[];
// }

// export interface Transcriber {
//   onInputChange: () => void;
//   isBusy: boolean;
//   isModelLoading: boolean;
//   progressItems: ProgressItem[];
//   start: (audioData: AudioBuffer | undefined) => void;
//   output?: TranscriberData;
//   model: string;
//   setModel: (model: string) => void;
//   multilingual: boolean;
//   setMultilingual: (model: boolean) => void;
//   quantized: boolean;
//   setQuantized: (model: boolean) => void;
//   subtask: string;
//   setSubtask: (subtask: string) => void;
//   language?: string;
//   setLanguage: (language: string) => void;
// }

// export function useTranscriber(): Transcriber {
//   const [transcript, setTranscript] = useState<TranscriberData | undefined>(
//     undefined
//   );
//   const [isBusy, setIsBusy] = useState(false);
//   const [isModelLoading, setIsModelLoading] = useState(false);

//   const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);

//   const [model, setModel] = useState<string>(Constants.DEFAULT_MODEL);
//   const [subtask, setSubtask] = useState<string>(Constants.DEFAULT_SUBTASK);
//   const [quantized, setQuantized] = useState<boolean>(false);
//   const [multilingual, setMultilingual] = useState<boolean>(
//     Constants.DEFAULT_MULTILINGUAL
//   );
//   const [language, setLanguage] = useState<string>(Constants.DEFAULT_LANGUAGE);

//   const onInputChange = useCallback(() => {
//     setTranscript(undefined);
//   }, []);

//   // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
//   const postRequest = useCallback(
//     async (audioData: AudioBuffer | undefined) => {
//       if (audioData) {
//         setTranscript(undefined);
//         setIsBusy(true);

//         // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
//         let audio;
//         if (audioData.numberOfChannels === 2) {
//           const SCALING_FACTOR = Math.sqrt(2);

//           const left = audioData.getChannelData(0);
//           const right = audioData.getChannelData(1);

//           audio = new Float32Array(left.length);
//           for (let i = 0; i < audioData.length; ++i) {
//             audio[i] = (SCALING_FACTOR * (left[i] + right[i])) / 2;
//           }
//         } else {
//           // If the audio is not stereo, we can just use the first channel:
//           audio = audioData.getChannelData(0);
//         }

//         // webWorker.postMessage({
//         //   audio,
//         //   model,
//         //   multilingual,
//         //   quantized,
//         //   subtask: multilingual ? subtask : null,
//         //   language: multilingual && language !== "auto" ? language : null,
//         // });
//       }
//     },
//     [model, multilingual, quantized, subtask, language]
//   );

//   // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
//   const transcriber = useMemo(() => {
//     return {
//       onInputChange,
//       isBusy,
//       isModelLoading,
//       progressItems,
//       start: postRequest,
//       output: transcript,
//       model,
//       setModel,
//       multilingual,
//       setMultilingual,
//       quantized,
//       setQuantized,
//       subtask,
//       setSubtask,
//       language,
//       setLanguage,
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [
//     isBusy,
//     isModelLoading,
//     progressItems,
//     postRequest,
//     transcript,
//     model,
//     multilingual,
//     quantized,
//     subtask,
//     language,
//   ]);

//   return transcriber;
// }

// const Constants = {
//   SAMPLING_RATE: 16000,
//   DEFAULT_MODEL: "Xenova/whisper-tiny",
//   DEFAULT_SUBTASK: "transcribe",
//   DEFAULT_LANGUAGE: "english",
//   DEFAULT_MULTILINGUAL: false,
// };
