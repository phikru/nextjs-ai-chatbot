export const DEFAULT_CHAT_MODEL: string = 'gpt-4o';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description:
      "OpenAI's most advanced multimodal model with vision and text capabilities",
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description:
      "OpenAI's faster and more cost-effective model with good performance",
  },
];
