import type React from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { LANGUAGES, type TranscriptionLanguage } from "@/jotai/settingAtom";

const AUTO_DETECT_VALUE = "__auto__";

export const LanguageSelector: React.FC<{
	language: TranscriptionLanguage | null;
	setLanguage: (language: TranscriptionLanguage | null) => void;
	/** Include "Auto" option for language auto-detection */
	includeAuto?: boolean;
}> = ({ language, setLanguage, includeAuto = false }) => {
	const handleLanguageChange = (value: string) => {
		setLanguage(
			value === AUTO_DETECT_VALUE ? null : (value as TranscriptionLanguage),
		);
	};

	const names = Object.values(LANGUAGES);
	const displayValue = language ?? AUTO_DETECT_VALUE;

	return (
		<Select.Root
			onValueChange={handleLanguageChange}
			value={displayValue}
			key={displayValue}
		>
			<Select.Trigger className="inline-flex h-[35px] items-center justify-center gap-[5px] rounded px-[15px] text-[13px] leading-none outline-hidden hover:bg-mauve3 focus:shadow-[0_0_0_2px]">
				<Select.Value placeholder="Select a language…" />
				<Select.Icon>
					<ChevronDownIcon />
				</Select.Icon>
			</Select.Trigger>
			<Select.Portal>
				<Select.Content className="overflow-hidden rounded-md bg-black shadow-[0px_10px_38px_-10px_rgba(22,23,24,0.35),0px_10px_20px_-15px_rgba(22,23,24,0.2)]">
					<Select.ScrollUpButton className="flex h-[25px] cursor-default items-center justify-center">
						<ChevronUpIcon />
					</Select.ScrollUpButton>
					<Select.Viewport className="p-[5px]">
						<Select.Group>
							<Select.Label className="px-[25px] text-xs leading-[25px]">
								Languages
							</Select.Label>
							{includeAuto && (
								<SelectItem value={AUTO_DETECT_VALUE}>
									Auto (detect from audio)
								</SelectItem>
							)}
							{names.map((name) => (
								<SelectItem key={name} value={name}>
									{name}
								</SelectItem>
							))}
						</Select.Group>
					</Select.Viewport>
					<Select.ScrollDownButton className="flex h-[25px] cursor-default items-center justify-center">
						<ChevronDownIcon />
					</Select.ScrollDownButton>
				</Select.Content>
			</Select.Portal>
		</Select.Root>
	);
};

interface SelectItemProps {
	children: React.ReactNode;
	value: string;
}

const SelectItem: React.FC<SelectItemProps> = ({ children, ...props }) => {
	return (
		<Select.Item
			{...props}
			className="relative flex h-[25px] select-none items-center px-[25px] text-[13px] leading-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1"
		>
			<Select.ItemText>{children}</Select.ItemText>
		</Select.Item>
	);
};
