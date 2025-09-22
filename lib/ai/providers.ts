import { customProvider } from 'ai';
import { openai } from '@ai-sdk/openai';
import { isTestEnvironment } from '../constants';

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require('./models.mock');
      return customProvider({
        languageModels: {
          'chat-model': chatModel,
          'chat-model-reasoning': reasoningModel,
          'title-model': titleModel,
          'artifact-model': artifactModel,
        },
      });
    })()
  : customProvider({
      languageModels: {
        'gpt-4o': openai('gpt-4o'),
        'gpt-4o-mini': openai('gpt-4o-mini'),
        'title-model': openai('gpt-4o-mini'),
        'artifact-model': openai('gpt-4o'),
      },
    });
