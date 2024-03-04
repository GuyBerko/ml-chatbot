export interface WebSpellCheckerMatche {
  type: string;
  offset: number;
  length: number;
  message: string;
  rule: string;
  description: string;
  category: string;
  suggestions: string[];
}

export interface WebSpellCheckerResult {
  result?: [
    {
      matches?: WebSpellCheckerMatche[];
    }
  ];
}

export interface CheckSpellingResult {
  inputTextHtml: string;
  foundSpellingError: boolean;
}
