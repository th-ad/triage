export const DEFAULT_CHAT_MODEL: string = "chat-model";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "openai/gpt-5-nano",
    name: "GPT-5 Nano",
    description: "",
  },
];
