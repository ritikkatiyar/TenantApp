import { apiRequest } from './client';

export type AICommandRequest = {
  message: string;
};

export type AICommandResponse = {
  message: string;
};

export function runAICommand(payload: AICommandRequest, token: string): Promise<AICommandResponse> {
  return apiRequest<AICommandResponse>('/api/v1/ai/commands', {
    method: 'POST',
    token,
    timeout: 60000,
    body: JSON.stringify(payload),
  });
}
