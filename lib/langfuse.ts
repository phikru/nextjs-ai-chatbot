import { LangfuseClient } from '@langfuse/client';

// Initialize the Langfuse client
// It will automatically use environment variables:
// LANGFUSE_SECRET_KEY, LANGFUSE_PUBLIC_KEY, LANGFUSE_BASE_URL
export const langfuse = new LangfuseClient();

// Error handling - LangfuseClient doesn't have an 'on' method
// Errors will be logged automatically by the client

export default langfuse;
