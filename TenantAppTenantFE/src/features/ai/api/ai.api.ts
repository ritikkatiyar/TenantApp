import { apiRequest } from '@/src/api/client';

export type AICommandRequest = {
  message: string;
};

export type AICommandResponse = {
  message: string;
  jobId?: string;
  status?: string;
};

export type AIJobStatusResponse = {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  response?: string;
  errorMessage?: string;
};

export function runAICommand(payload: AICommandRequest, token: string): Promise<AICommandResponse> {
  return apiRequest<AICommandResponse>('/api/v1/ai/commands', {
    method: 'POST',
    token,
    useAiApi: true,
    timeout: 30000, // Reduced from 60s since queuing is <50ms
    body: JSON.stringify(payload),
  });
}

export function getJobStatus(jobId: string, token: string): Promise<AIJobStatusResponse> {
  return apiRequest<AIJobStatusResponse>(`/api/v1/ai/jobs/${jobId}`, {
    method: 'GET',
    token,
    useAiApi: true,
  });
}
