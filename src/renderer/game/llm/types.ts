export interface MessageOptions {
  speaker?: string;
  role?: "user" | "assistant" | "system";
  metadata?: Record<string, any>;
}
