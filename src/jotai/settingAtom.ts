import { atomWithStorage } from "jotai/utils";

export type TranscriptionModel = "onnx-community/whisper-base";

// List of supported languages:
// https://help.openai.com/en/articles/7031512-whisper-api-faq
// https://github.com/openai/whisper/blob/248b6cb124225dd263bb9bd32d060b6517e067f8/whisper/tokenizer.py#L79
export const LANGUAGES = {
	en: "english",
	zh: "chinese",
	de: "german",
	es: "spanish/castilian",
	ru: "russian",
	ko: "korean",
	fr: "french",
	ja: "japanese",
	pt: "portuguese",
	tr: "turkish",
	pl: "polish",
	ca: "catalan/valencian",
	nl: "dutch/flemish",
	ar: "arabic",
	sv: "swedish",
	it: "italian",
	id: "indonesian",
	hi: "hindi",
	fi: "finnish",
	vi: "vietnamese",
	he: "hebrew",
	uk: "ukrainian",
	el: "greek",
	ms: "malay",
	cs: "czech",
	ro: "romanian/moldavian/moldovan",
	da: "danish",
	hu: "hungarian",
	ta: "tamil",
	no: "norwegian",
	th: "thai",
	ur: "urdu",
	hr: "croatian",
	bg: "bulgarian",
	lt: "lithuanian",
	la: "latin",
	mi: "maori",
	ml: "malayalam",
	cy: "welsh",
	sk: "slovak",
	te: "telugu",
	fa: "persian",
	lv: "latvian",
	bn: "bengali",
	sr: "serbian",
	az: "azerbaijani",
	sl: "slovenian",
	kn: "kannada",
	et: "estonian",
	mk: "macedonian",
	br: "breton",
	eu: "basque",
	is: "icelandic",
	hy: "armenian",
	ne: "nepali",
	mn: "mongolian",
	bs: "bosnian",
	kk: "kazakh",
	sq: "albanian",
	sw: "swahili",
	gl: "galician",
	mr: "marathi",
	pa: "punjabi/panjabi",
	si: "sinhala/sinhalese",
	km: "khmer",
	sn: "shona",
	yo: "yoruba",
	so: "somali",
	af: "afrikaans",
	oc: "occitan",
	ka: "georgian",
	be: "belarusian",
	tg: "tajik",
	sd: "sindhi",
	gu: "gujarati",
	am: "amharic",
	yi: "yiddish",
	lo: "lao",
	uz: "uzbek",
	fo: "faroese",
	ht: "haitian creole/haitian",
	ps: "pashto/pushto",
	tk: "turkmen",
	nn: "nynorsk",
	mt: "maltese",
	sa: "sanskrit",
	lb: "luxembourgish/letzeburgesch",
	my: "myanmar/burmese",
	bo: "tibetan",
	tl: "tagalog",
	mg: "malagasy",
	as: "assamese",
	tt: "tatar",
	haw: "hawaiian",
	ln: "lingala",
	ha: "hausa",
	ba: "bashkir",
	jw: "javanese",
	su: "sundanese",
} as const;

// language set to union of values of LANGUAGES
export type TranscriptionLanguage = (typeof LANGUAGES)[keyof typeof LANGUAGES];

/** Whisper task: transcribe (same language) or translate (to English) */
export type TranscriptionTask = "transcribe" | "translate";

/** Returns transcription task based on language. English=transcribe, others=translate to English */
export function getTaskFromLanguage(
	language: TranscriptionLanguage,
): TranscriptionTask {
	const base = language.includes("/")
		? language.split("/")[0].trim()
		: language;
	return base === "english" ? "transcribe" : "translate";
}

export type TranscriptionSettings = {
	language: TranscriptionLanguage;
};

export const transcriptionSettingsAtom = atomWithStorage<TranscriptionSettings>(
	"transcriptionSettings",
	{
		language: "english" as TranscriptionLanguage,
	},
);
