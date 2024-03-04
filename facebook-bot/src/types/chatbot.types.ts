export interface ChatBotResponse {
  replay?: string;
  errorCode?: string;
  errorMessage?: string;
  slots?: {
    lang?: string;
    name?: string;
    suggested_response?: string;
  }
}
