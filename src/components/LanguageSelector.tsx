import * as Select from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import { LANGUAGES, type TranscriptionLanguage } from "@/jotai/settingAtom";

export const LanguageSelector: React.FC<{
  language: TranscriptionLanguage;
  setLanguage: (language: TranscriptionLanguage) => void;
}> = ({ language, setLanguage }) => {
  const handleLanguageChange = (value: string) => {
    setLanguage(value as TranscriptionLanguage);
  };

  const names = Object.values(LANGUAGES).map(titleCase);

  return (
    <Select.Root value={language} onValueChange={handleLanguageChange}>
      <Select.Trigger className="">
        <Select.Value />
        <Select.Icon>
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Content>
        <Select.ScrollUpButton />
        <Select.Viewport>
          {Object.keys(LANGUAGES).map((key, i) => (
            <Select.Item
              key={key}
              value={key}
              className="flex items-center p-2"
            >
              <Select.ItemText>{names[i]}</Select.ItemText>
              <Select.ItemIndicator>
                <CheckIcon />
              </Select.ItemIndicator>
            </Select.Item>
          ))}
        </Select.Viewport>
        <Select.ScrollDownButton />
      </Select.Content>
    </Select.Root>
  );
};

function titleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
