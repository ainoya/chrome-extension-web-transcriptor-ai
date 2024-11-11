/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-explicit-any */
// https://github.com/xenova/whisper-web/blob/81869ed62970ff4373509b6004a6c9a3f0c5b64d/src/utils/BlobFix.ts#L519
/*
 * There is a bug where `navigator.mediaDevices.getUserMedia` + `MediaRecorder`
 * creates WEBM files without duration metadata. See:
 * - https://bugs.chromium.org/p/chromium/issues/detail?id=642012
 * - https://stackoverflow.com/a/39971175/13989043
 *
 * This file contains a function that fixes the duration metadata of a WEBM file.
 *  - Answer found: https://stackoverflow.com/a/75218309/13989043
 *  - Code adapted from: https://github.com/mat-sz/webm-fix-duration
 *    (forked from https://github.com/yusitnikov/fix-webm-duration)
 */

/*
 * This is the list of possible WEBM file sections by their IDs.
 * Possible types: Container, Binary, Uint, Int, String, Float, Date
 */
interface Section {
	name: string;
	type: string;
}

const sections: Record<number, Section> = {
	172351395: { name: "EBML", type: "Container" },
	646: { name: "EBMLVersion", type: "Uint" },
	759: { name: "EBMLReadVersion", type: "Uint" },
	754: { name: "EBMLMaxIDLength", type: "Uint" },
	755: { name: "EBMLMaxSizeLength", type: "Uint" },
	642: { name: "DocType", type: "String" },
	647: { name: "DocTypeVersion", type: "Uint" },
	645: { name: "DocTypeReadVersion", type: "Uint" },
	108: { name: "Void", type: "Binary" },
	63: { name: "CRC-32", type: "Binary" },
	190023271: { name: "SignatureSlot", type: "Container" },
	16010: { name: "SignatureAlgo", type: "Uint" },
	16026: { name: "SignatureHash", type: "Uint" },
	16037: { name: "SignaturePublicKey", type: "Binary" },
	16053: { name: "Signature", type: "Binary" },
	15963: { name: "SignatureElements", type: "Container" },
	15995: { name: "SignatureElementList", type: "Container" },
	9522: { name: "SignedElement", type: "Binary" },
	139690087: { name: "Segment", type: "Container" },
	21863284: { name: "SeekHead", type: "Container" },
	3515: { name: "Seek", type: "Container" },
	5035: { name: "SeekID", type: "Binary" },
	5036: { name: "SeekPosition", type: "Uint" },
	88713574: { name: "Info", type: "Container" },
	13220: { name: "SegmentUID", type: "Binary" },
	13188: { name: "SegmentFilename", type: "String" },
	1882403: { name: "PrevUID", type: "Binary" },
	1868715: { name: "PrevFilename", type: "String" },
	2013475: { name: "NextUID", type: "Binary" },
	1999803: { name: "NextFilename", type: "String" },
	1092: { name: "SegmentFamily", type: "Binary" },
	10532: { name: "ChapterTranslate", type: "Container" },
	10748: { name: "ChapterTranslateEditionUID", type: "Uint" },
	10687: { name: "ChapterTranslateCodec", type: "Uint" },
	10661: { name: "ChapterTranslateID", type: "Binary" },
	710577: { name: "TimecodeScale", type: "Uint" },
	1161: { name: "Duration", type: "Float" },
	1121: { name: "DateUTC", type: "Date" },
	15273: { name: "Title", type: "String" },
	3456: { name: "MuxingApp", type: "String" },
	5953: { name: "WritingApp", type: "String" },
	// 0xf43b675: { name: 'Cluster', type: 'Container' },
	103: { name: "Timecode", type: "Uint" },
	6228: { name: "SilentTracks", type: "Container" },
	6359: { name: "SilentTrackNumber", type: "Uint" },
	39: { name: "Position", type: "Uint" },
	43: { name: "PrevSize", type: "Uint" },
	35: { name: "SimpleBlock", type: "Binary" },
	32: { name: "BlockGroup", type: "Container" },
	33: { name: "Block", type: "Binary" },
	34: { name: "BlockVirtual", type: "Binary" },
	13729: { name: "BlockAdditions", type: "Container" },
	38: { name: "BlockMore", type: "Container" },
	110: { name: "BlockAddID", type: "Uint" },
	37: { name: "BlockAdditional", type: "Binary" },
	27: { name: "BlockDuration", type: "Uint" },
	122: { name: "ReferencePriority", type: "Uint" },
	123: { name: "ReferenceBlock", type: "Int" },
	125: { name: "ReferenceVirtual", type: "Int" },
	36: { name: "CodecState", type: "Binary" },
	13730: { name: "DiscardPadding", type: "Int" },
	14: { name: "Slices", type: "Container" },
	104: { name: "TimeSlice", type: "Container" },
	76: { name: "LaceNumber", type: "Uint" },
	77: { name: "FrameNumber", type: "Uint" },
	75: { name: "BlockAdditionID", type: "Uint" },
	78: { name: "Delay", type: "Uint" },
	79: { name: "SliceDuration", type: "Uint" },
	72: { name: "ReferenceFrame", type: "Container" },
	73: { name: "ReferenceOffset", type: "Uint" },
	74: { name: "ReferenceTimeCode", type: "Uint" },
	47: { name: "EncryptedBlock", type: "Binary" },
	106212971: { name: "Tracks", type: "Container" },
	46: { name: "TrackEntry", type: "Container" },
	87: { name: "TrackNumber", type: "Uint" },
	13253: { name: "TrackUID", type: "Uint" },
	3: { name: "TrackType", type: "Uint" },
	57: { name: "FlagEnabled", type: "Uint" },
	8: { name: "FlagDefault", type: "Uint" },
	5546: { name: "FlagForced", type: "Uint" },
	28: { name: "FlagLacing", type: "Uint" },
	11751: { name: "MinCache", type: "Uint" },
	11768: { name: "MaxCache", type: "Uint" },
	254851: { name: "DefaultDuration", type: "Uint" },
	216698: { name: "DefaultDecodedFieldDuration", type: "Uint" },
	209231: { name: "TrackTimecodeScale", type: "Float" },
	4991: { name: "TrackOffset", type: "Int" },
	5614: { name: "MaxBlockAdditionID", type: "Uint" },
	4974: { name: "Name", type: "String" },
	177564: { name: "Language", type: "String" },
	6: { name: "CodecID", type: "String" },
	9122: { name: "CodecPrivate", type: "Binary" },
	362120: { name: "CodecName", type: "String" },
	13382: { name: "AttachmentLink", type: "Uint" },
	1742487: { name: "CodecSettings", type: "String" },
	1785920: { name: "CodecInfoURL", type: "String" },
	438848: { name: "CodecDownloadURL", type: "String" },
	42: { name: "CodecDecodeAll", type: "Uint" },
	12203: { name: "TrackOverlay", type: "Uint" },
	5802: { name: "CodecDelay", type: "Uint" },
	5819: { name: "SeekPreRoll", type: "Uint" },
	9764: { name: "TrackTranslate", type: "Container" },
	9980: { name: "TrackTranslateEditionUID", type: "Uint" },
	9919: { name: "TrackTranslateCodec", type: "Uint" },
	9893: { name: "TrackTranslateTrackID", type: "Binary" },
	96: { name: "Video", type: "Container" },
	26: { name: "FlagInterlaced", type: "Uint" },
	5048: { name: "StereoMode", type: "Uint" },
	5056: { name: "AlphaMode", type: "Uint" },
	5049: { name: "OldStereoMode", type: "Uint" },
	48: { name: "PixelWidth", type: "Uint" },
	58: { name: "PixelHeight", type: "Uint" },
	5290: { name: "PixelCropBottom", type: "Uint" },
	5307: { name: "PixelCropTop", type: "Uint" },
	5324: { name: "PixelCropLeft", type: "Uint" },
	5341: { name: "PixelCropRight", type: "Uint" },
	5296: { name: "DisplayWidth", type: "Uint" },
	5306: { name: "DisplayHeight", type: "Uint" },
	5298: { name: "DisplayUnit", type: "Uint" },
	5299: { name: "AspectRatioType", type: "Uint" },
	963876: { name: "ColourSpace", type: "Binary" },
	1029411: { name: "GammaValue", type: "Float" },
	230371: { name: "FrameRate", type: "Float" },
	97: { name: "Audio", type: "Container" },
	53: { name: "SamplingFrequency", type: "Float" },
	14517: { name: "OutputSamplingFrequency", type: "Float" },
	31: { name: "Channels", type: "Uint" },
	15739: { name: "ChannelPositions", type: "Binary" },
	8804: { name: "BitDepth", type: "Uint" },
	98: { name: "TrackOperation", type: "Container" },
	99: { name: "TrackCombinePlanes", type: "Container" },
	100: { name: "TrackPlane", type: "Container" },
	101: { name: "TrackPlaneUID", type: "Uint" },
	102: { name: "TrackPlaneType", type: "Uint" },
	105: { name: "TrackJoinBlocks", type: "Container" },
	109: { name: "TrackJoinUID", type: "Uint" },
	64: { name: "TrickTrackUID", type: "Uint" },
	65: { name: "TrickTrackSegmentUID", type: "Binary" },
	70: { name: "TrickTrackFlag", type: "Uint" },
	71: { name: "TrickMasterTrackUID", type: "Uint" },
	68: { name: "TrickMasterTrackSegmentUID", type: "Binary" },
	11648: { name: "ContentEncodings", type: "Container" },
	8768: { name: "ContentEncoding", type: "Container" },
	4145: { name: "ContentEncodingOrder", type: "Uint" },
	4146: { name: "ContentEncodingScope", type: "Uint" },
	4147: { name: "ContentEncodingType", type: "Uint" },
	4148: { name: "ContentCompression", type: "Container" },
	596: { name: "ContentCompAlgo", type: "Uint" },
	597: { name: "ContentCompSettings", type: "Binary" },
	4149: { name: "ContentEncryption", type: "Container" },
	2017: { name: "ContentEncAlgo", type: "Uint" },
	2018: { name: "ContentEncKeyID", type: "Binary" },
	2019: { name: "ContentSignature", type: "Binary" },
	2020: { name: "ContentSigKeyID", type: "Binary" },
	2021: { name: "ContentSigAlgo", type: "Uint" },
	2022: { name: "ContentSigHashAlgo", type: "Uint" },
	206814059: { name: "Cues", type: "Container" },
	59: { name: "CuePoint", type: "Container" },
	51: { name: "CueTime", type: "Uint" },
	55: { name: "CueTrackPositions", type: "Container" },
	119: { name: "CueTrack", type: "Uint" },
	113: { name: "CueClusterPosition", type: "Uint" },
	112: { name: "CueRelativePosition", type: "Uint" },
	50: { name: "CueDuration", type: "Uint" },
	4984: { name: "CueBlockNumber", type: "Uint" },
	106: { name: "CueCodecState", type: "Uint" },
	91: { name: "CueReference", type: "Container" },
	22: { name: "CueRefTime", type: "Uint" },
	23: { name: "CueRefCluster", type: "Uint" },
	4959: { name: "CueRefNumber", type: "Uint" },
	107: { name: "CueRefCodecState", type: "Uint" },
	155296873: { name: "Attachments", type: "Container" },
	8615: { name: "AttachedFile", type: "Container" },
	1662: { name: "FileDescription", type: "String" },
	1646: { name: "FileName", type: "String" },
	1632: { name: "FileMimeType", type: "String" },
	1628: { name: "FileData", type: "Binary" },
	1710: { name: "FileUID", type: "Uint" },
	1653: { name: "FileReferral", type: "Binary" },
	1633: { name: "FileUsedStartTime", type: "Uint" },
	1634: { name: "FileUsedEndTime", type: "Uint" },
	4433776: { name: "Chapters", type: "Container" },
	1465: { name: "EditionEntry", type: "Container" },
	1468: { name: "EditionUID", type: "Uint" },
	1469: { name: "EditionFlagHidden", type: "Uint" },
	1499: { name: "EditionFlagDefault", type: "Uint" },
	1501: { name: "EditionFlagOrdered", type: "Uint" },
	54: { name: "ChapterAtom", type: "Container" },
	13252: { name: "ChapterUID", type: "Uint" },
	5716: { name: "ChapterStringUID", type: "String" },
	17: { name: "ChapterTimeStart", type: "Uint" },
	18: { name: "ChapterTimeEnd", type: "Uint" },
	24: { name: "ChapterFlagHidden", type: "Uint" },
	1432: { name: "ChapterFlagEnabled", type: "Uint" },
	11879: { name: "ChapterSegmentUID", type: "Binary" },
	11964: { name: "ChapterSegmentEditionUID", type: "Uint" },
	9155: { name: "ChapterPhysicalEquiv", type: "Uint" },
	15: { name: "ChapterTrack", type: "Container" },
	9: { name: "ChapterTrackNumber", type: "Uint" },
	0: { name: "ChapterDisplay", type: "Container" },
	5: { name: "ChapString", type: "String" },
	892: { name: "ChapLanguage", type: "String" },
	894: { name: "ChapCountry", type: "String" },
	10564: { name: "ChapProcess", type: "Container" },
	10581: { name: "ChapProcessCodecID", type: "Uint" },
	1293: { name: "ChapProcessPrivate", type: "Binary" },
	10513: { name: "ChapProcessCommand", type: "Container" },
	10530: { name: "ChapProcessTime", type: "Uint" },
	10547: { name: "ChapProcessData", type: "Binary" },
	39109479: { name: "Tags", type: "Container" },
	13171: { name: "Tag", type: "Container" },
	9152: { name: "Targets", type: "Container" },
	10442: { name: "TargetTypeValue", type: "Uint" },
	9162: { name: "TargetType", type: "String" },
	9157: { name: "TagTrackUID", type: "Uint" },
	9161: { name: "TagEditionUID", type: "Uint" },
	9156: { name: "TagChapterUID", type: "Uint" },
	9158: { name: "TagAttachmentUID", type: "Uint" },
	10184: { name: "SimpleTag", type: "Container" },
	1443: { name: "TagName", type: "String" },
	1146: { name: "TagLanguage", type: "String" },
	1156: { name: "TagDefault", type: "Uint" },
	1159: { name: "TagString", type: "String" },
	1157: { name: "TagBinary", type: "Binary" },
};

class WebmBase<T> {
	source?: Uint8Array;
	data?: T;

	// @ts-expect-error ignore unused constructor
	constructor(
		private name = "Unknown",
		private type = "Unknown",
	) {}

	updateBySource() {}

	setSource(source: Uint8Array) {
		this.source = source;
		this.updateBySource();
	}

	updateByData() {}

	setData(data: T) {
		this.data = data;
		this.updateByData();
	}
}

class WebmUint extends WebmBase<string> {
	constructor(name: string, type: string) {
		super(name, type || "Uint");
	}

	updateBySource() {
		// use hex representation of a number instead of number value
		this.data = "";
		for (let i = 0; i < this.source?.length; i++) {
			const hex = this.source?.[i].toString(16);
			this.data += padHex(hex);
		}
	}

	updateByData() {
		const length = this.data?.length / 2;
		this.source = new Uint8Array(length);
		for (let i = 0; i < length; i++) {
			const hex = this.data?.substr(i * 2, 2);
			this.source[i] = Number.parseInt(hex, 16);
		}
	}

	getValue() {
		return Number.parseInt(this.data!, 16);
	}

	setValue(value: number) {
		this.setData(padHex(value.toString(16)));
	}
}

function padHex(hex: string) {
	return hex.length % 2 === 1 ? `0${hex}` : hex;
}

class WebmFloat extends WebmBase<number> {
	constructor(name: string, type: string) {
		super(name, type || "Float");
	}

	getFloatArrayType() {
		return this.source && this.source.length === 4
			? Float32Array
			: Float64Array;
	}
	updateBySource() {
		const byteArray = this.source?.reverse();
		const floatArrayType = this.getFloatArrayType();
		const floatArray = new floatArrayType(byteArray.buffer);
		this.data! = floatArray[0];
	}
	updateByData() {
		const floatArrayType = this.getFloatArrayType();
		const floatArray = new floatArrayType([this.data!]);
		const byteArray = new Uint8Array(floatArray.buffer);
		this.source = byteArray.reverse();
	}
	getValue() {
		return this.data;
	}
	setValue(value: number) {
		this.setData(value);
	}
}

interface ContainerData {
	id: number;
	idHex?: string;
	data: WebmBase<any>;
}

class WebmContainer extends WebmBase<ContainerData[]> {
	offset = 0;
	data: ContainerData[] = [];

	constructor(name: string, type: string) {
		super(name, type || "Container");
	}

	readByte() {
		return this.source?.[this.offset++];
	}
	readUint() {
		const firstByte = this.readByte();
		const bytes = 8 - firstByte.toString(2).length;
		let value = firstByte - (1 << (7 - bytes));
		for (let i = 0; i < bytes; i++) {
			// don't use bit operators to support x86
			value *= 256;
			value += this.readByte();
		}
		return value;
	}
	updateBySource() {
		let end: number | undefined = undefined;
		this.data = [];
		for (
			this.offset = 0;
			this.offset < this.source?.length;
			this.offset = end
		) {
			const id = this.readUint();
			const len = this.readUint();
			end = Math.min(this.offset + len, this.source?.length);
			const data = this.source?.slice(this.offset, end);

			const info = sections[id] || { name: "Unknown", type: "Unknown" };
			let ctr: any = WebmBase;
			switch (info.type) {
				case "Container":
					ctr = WebmContainer;
					break;
				case "Uint":
					ctr = WebmUint;
					break;
				case "Float":
					ctr = WebmFloat;
					break;
			}
			const section = new ctr(info.name, info.type);
			section.setSource(data);
			this.data.push({
				id: id,
				idHex: id.toString(16),
				data: section,
			});
		}
	}
	writeUint(x: number, draft = false) {
		for (
			let bytes = 1, flag = 0x80;
			x >= flag && bytes < 8;
			bytes++, flag *= 0x80
		) {
			/* empty */
		}

		if (!draft) {
			let value = flag + x;
			for (let i = bytes - 1; i >= 0; i--) {
				// don't use bit operators to support x86
				const c = value % 256;
				this.source![this.offset! + i] = c;
				value = (value - c) / 256;
			}
		}

		this.offset += bytes;
	}

	writeSections(draft = false) {
		this.offset = 0;
		for (let i = 0; i < this.data.length; i++) {
			const section = this.data[i];
			const content = section.data.source;
			const contentLength = content?.length;
			this.writeUint(section.id, draft);
			this.writeUint(contentLength, draft);
			if (!draft) {
				this.source?.set(content!, this.offset);
			}
			this.offset += contentLength;
		}
		return this.offset;
	}

	updateByData() {
		// run without accessing this.source to determine total length - need to know it to create Uint8Array
		const length = this.writeSections(true);
		this.source = new Uint8Array(length);
		// now really write data
		this.writeSections();
	}

	getSectionById(id: number) {
		for (let i = 0; i < this.data.length; i++) {
			const section = this.data[i];
			if (section.id === id) {
				return section.data;
			}
		}

		return undefined;
	}
}

class WebmFile extends WebmContainer {
	constructor(source: Uint8Array) {
		super("File", "File");
		this.setSource(source);
	}

	fixDuration(duration: number) {
		const segmentSection = this.getSectionById(0x8538067) as WebmContainer;
		if (!segmentSection) {
			return false;
		}

		const infoSection = segmentSection.getSectionById(
			0x549a966,
		) as WebmContainer;
		if (!infoSection) {
			return false;
		}

		const timeScaleSection = infoSection.getSectionById(0xad7b1) as WebmFloat;
		if (!timeScaleSection) {
			return false;
		}

		let durationSection = infoSection.getSectionById(0x489) as WebmFloat;
		if (durationSection) {
			if (durationSection.getValue()! <= 0) {
				durationSection.setValue(duration);
			} else {
				return false;
			}
		} else {
			// append Duration section
			durationSection = new WebmFloat("Duration", "Float");
			durationSection.setValue(duration);
			infoSection.data.push({
				id: 0x489,
				data: durationSection,
			});
		}

		// set default time scale to 1 millisecond (1000000 nanoseconds)
		timeScaleSection.setValue(1000000);
		infoSection.updateByData();
		segmentSection.updateByData();
		this.updateByData();

		return true;
	}

	toBlob(type = "video/webm") {
		return new Blob([this.source?.buffer], { type });
	}
}

/**
 * Fixes duration on MediaRecorder output.
 * @param blob Input Blob with incorrect duration.
 * @param duration Correct duration (in milliseconds).
 * @param type Output blob mimetype (default: video/webm).
 * @returns
 */
export const webmFixDuration = (
	blob: Blob,
	duration: number,
	type = "video/webm",
): Promise<Blob> => {
	return new Promise((resolve, reject) => {
		try {
			const reader = new FileReader();

			reader.addEventListener("loadend", () => {
				try {
					const result = reader.result as ArrayBuffer;
					const file = new WebmFile(new Uint8Array(result));
					if (file.fixDuration(duration)) {
						resolve(file.toBlob(type));
					} else {
						resolve(blob);
					}
				} catch (ex) {
					reject(ex);
				}
			});

			reader.addEventListener("error", () => reject());

			reader.readAsArrayBuffer(blob);
		} catch (ex) {
			reject(ex);
		}
	});
};
