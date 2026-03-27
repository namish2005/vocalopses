import { LucideIcon } from 'lucide-react';

export type AgentId = string;

export interface AgentConfig {
  id: AgentId;
  name: string;
  color: string;
  icon: LucideIcon;
  wakeWord: string;
  systemPrompt: string;
  verbosity: 'concise' | 'normal' | 'detailed';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'user' | 'system' | 'agent' | 'error';
  agent?: AgentId;
  text: string;
}

export interface AgentStatus {
  id: AgentId;
  status: 'idle' | 'processing' | 'error';
}
