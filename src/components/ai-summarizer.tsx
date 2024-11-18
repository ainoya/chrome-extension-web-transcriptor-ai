import { Label } from "@radix-ui/react-label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@radix-ui/react-select";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { toast } from "./ui/use-toast";
import type { TranscriptionLanguage } from "@/jotai/settingAtom";

interface AiSummarizerProps {
	setLanguage: (e: TranscriptionLanguage) => void;
	language: string;
	isSummaryLoading: boolean;
	handleSummarize: () => Promise<void>;
	summary: string;
}

export const AiSummarizer: React.FC<AiSummarizerProps> = ({
	setLanguage,
	language,
	isSummaryLoading,
	handleSummarize,
	summary,
}) => {
	return (
		<div className="flex flex-col m-1 p-1">
			<div className="flex flex-row my-1 justify">
				<div className="basis-1/2">
					<div>
						<Label htmlFor="language">Summarization Language</Label>
						<Select
							onValueChange={(e) => {
								setLanguage(e as TranscriptionLanguage);
							}}
							defaultValue={language}
						>
							<SelectTrigger className="w-[180px]">
								<SelectValue
									placeholder="Select Language"
									defaultValue={language}
								/>
							</SelectTrigger>
							<SelectContent defaultValue={language} id="language">
								<SelectItem value="english">English</SelectItem>
								<SelectItem value="japanese">Japanese</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				<div className="basis-1/2 flex flex-col justify-end items-end my-1">
					{isSummaryLoading ? (
						<Button disabled variant={"outline"}>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Summarizing...
						</Button>
					) : (
						<Button onClick={handleSummarize}>
							Summarize This Transcription
						</Button>
					)}
				</div>
			</div>
			<div className="basis-1/1 grid w-full gap-2">
				<Textarea value={summary} rows={10} readOnly />
				<Button
					variant={"outline"}
					onClick={() => {
						navigator.clipboard.writeText(summary).then(() => {
							toast({
								description: "Copied to clipboard",
							});
						});
					}}
				>
					Copy to Clipboard
				</Button>
			</div>
		</div>
	);
};
