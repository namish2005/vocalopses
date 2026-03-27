import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { Activity } from 'lucide-react';
import { AgentConfig, LogEntry, AgentId } from '../types';
import { INITIAL_AGENT_CONFIGS } from '../constants';

const createWavBlob = (pcmBase64: string, sampleRate: number = 24000): Blob => {
  const binaryString = atob(pcmBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  // file length
  view.setUint32(4, 36 + len, true);
  // RIFF type
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // format chunk identifier
  view.setUint32(12, 0x666d7420, false); // "fmt "
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (PCM)
  view.setUint16(20, 1, true);
  // channel count (Mono)
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  view.setUint32(36, 0x64617461, false); // "data"
  // data chunk length
  view.setUint32(40, len, true);

  return new Blob([wavHeader, bytes], { type: 'audio/wav' });
};

interface VocalOpsContextType {
  isBooting: boolean;
  isListening: boolean;
  isAiSpeaking: boolean;
  isSpeechEnabled: boolean;
  isMuted: boolean;
  transcript: string;
  logs: LogEntry[];
  activeAgent: AgentId | null;
  isProcessing: boolean;
  webhookUrl: string;
  isTestMode: boolean;
  agentConfigs: AgentConfig[];
  agentStatuses: Record<AgentId, 'idle' | 'processing' | 'error'>;
  logFilter: 'all' | 'history';
  setIsBooting: (booting: boolean) => void;
  setIsMuted: (muted: boolean) => void;
  setIsSpeechEnabled: (enabled: boolean) => void;
  setWebhookUrl: (url: string) => void;
  setIsTestMode: (test: boolean) => void;
  setAgentConfigs: (configs: AgentConfig[]) => void;
  setLogFilter: (filter: 'all' | 'history') => void;
  addLog: (text: string, type: LogEntry['type'], agent?: AgentId) => void;
  setLogs: (logs: LogEntry[]) => void;
  speak: (text: string) => void;
  handleVocalOpsCommand: (command: string) => Promise<void>;
  testConnection: () => Promise<void>;
  handleAddAgent: () => void;
  handleDeleteAgent: (id: AgentId) => void;
  stopSpeaking: () => void;
  terminalEndRef: React.RefObject<HTMLDivElement>;
}

const VocalOpsContext = createContext<VocalOpsContextType | undefined>(undefined);

export const VocalOpsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBooting, setIsBooting] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeAgent, setActiveAgent] = useState<AgentId | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://namishn8n.app.n8n.cloud/webhook/vocalops-command');
  const [isTestMode, setIsTestMode] = useState(false);
  const [agentConfigs, setAgentConfigs] = useState<AgentConfig[]>(INITIAL_AGENT_CONFIGS);
  const [agentStatuses, setAgentStatuses] = useState<Record<AgentId, 'idle' | 'processing' | 'error'>>({});
  const [logFilter, setLogFilter] = useState<'all' | 'history'>('all');
  
  const chatSessionsRef = useRef<Record<string, any>>({});
  const recognitionRef = useRef<any>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isSpeakingRef = useRef(false);
  const isMutedRef = useRef(isMuted);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const ttsQuotaCooldownRef = useRef<number>(0);
  
  const startListeningRef = useRef<() => void>(() => {});
  const speakRef = useRef<(text: string) => Promise<void>>(async () => {});
  const handleCommandRef = useRef<(cmd: string) => Promise<void>>(async () => {});

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const getChatSession = useCallback((agentId: AgentId) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    if (chatSessionsRef.current[agentId]) {
      return chatSessionsRef.current[agentId];
    }

    const agent = agentConfigs.find(a => a.id === agentId) || agentConfigs.find(a => a.id === 'Default');
    const systemInstruction = agent?.systemPrompt || 'You are VocalOps, a cyberpunk command AI. Respond in plain text, maximum 2 sentences.';

    const ai = new GoogleGenAI({ apiKey });
    const session = ai.chats.create({
      model: 'gemini-3.1-flash-lite-preview',
      config: {
        systemInstruction: systemInstruction + ' Absolutely NO markdown formatting, asterisks, hash symbols, or lists. Respond in pure plain text only, as your output will be read aloud by a Text-to-Speech engine.',
      }
    });

    chatSessionsRef.current[agentId] = session;
    return session;
  }, [agentConfigs]);

  useEffect(() => {
    // Initialize default session
    getChatSession('Default');
  }, [getChatSession]);

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'system', agent?: AgentId) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      agent,
      text,
    };
    setLogs(prev => [...prev, newLog].slice(-100));
  }, []);

  const scrollToBottom = useCallback(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [logs, transcript, logFilter, scrollToBottom]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const speak = useCallback(async (text: string) => {
    if (!isSpeechEnabled) return;
    if (text.trim() === 'Standing by.') return;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Stop any current speech
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const useLocalSynth = () => {
      if (!window.speechSynthesis) {
        setIsAiSpeaking(false);
        isSpeakingRef.current = false;
        if (!isMutedRef.current) startListeningRef.current();
        return;
      }

      const speakWithVoice = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        
        if (voices.length > 0) {
          // Try to find a good English voice
          utterance.voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('Guy'))) || 
                           voices.find(v => v.lang.startsWith('en')) || 
                           voices[0];
        }

        utterance.onstart = () => {
          setIsAiSpeaking(true);
          isSpeakingRef.current = true;
        };
        utterance.onend = () => {
          setIsAiSpeaking(false);
          isSpeakingRef.current = false;
          setActiveAgent(null);
          if (!isMutedRef.current) startListeningRef.current();
        };
        utterance.onerror = (e) => {
          console.warn("Local TTS Warning:", e);
          setIsAiSpeaking(false);
          isSpeakingRef.current = false;
          if (!isMutedRef.current) startListeningRef.current();
        };
        
        window.speechSynthesis.speak(utterance);
        
        // Safety timeout
        setTimeout(() => {
          if (isSpeakingRef.current && !window.speechSynthesis.speaking) {
            setIsAiSpeaking(false);
            isSpeakingRef.current = false;
            if (!isMutedRef.current) startListeningRef.current();
          }
        }, 3000);
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          speakWithVoice();
        };
      } else {
        speakWithVoice();
      }
    };

    // Check if we are in a quota cooldown (5 minutes)
    if (Date.now() < ttsQuotaCooldownRef.current) {
      useLocalSynth();
      return;
    }

    setIsAiSpeaking(true);
    isSpeakingRef.current = true;

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Fenrir' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      const mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType;

      if (base64Audio) {
        let audioSrc: string;
        
        if (mimeType && (mimeType.includes('wav') || mimeType.includes('mp3'))) {
          audioSrc = `data:${mimeType};base64,${base64Audio}`;
        } else {
          // Assume raw PCM and wrap in WAV header
          const blob = createWavBlob(base64Audio);
          audioSrc = URL.createObjectURL(blob);
        }

        const audio = new Audio(audioSrc);
        audioRef.current = audio;
        
        audio.onended = () => {
          if (audioSrc.startsWith('blob:')) {
            URL.revokeObjectURL(audioSrc);
          }
          setIsAiSpeaking(false);
          isSpeakingRef.current = false;
          setActiveAgent(null);
          if (!isMutedRef.current) {
            startListeningRef.current();
          }
        };

        audio.onerror = () => {
          if (audioSrc.startsWith('blob:')) {
            URL.revokeObjectURL(audioSrc);
          }
          setIsAiSpeaking(false);
          isSpeakingRef.current = false;
          if (!isMutedRef.current) {
            startListeningRef.current();
          }
        };

        await audio.play();
      } else {
        throw new Error("No audio data");
      }
    } catch (error: any) {
      const isQuotaError = 
        error?.status === 429 || 
        error?.code === 429 ||
        error?.error?.code === 429 ||
        (error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) ||
        JSON.stringify(error).includes('429') ||
        JSON.stringify(error).includes('RESOURCE_EXHAUSTED');

      if (isQuotaError) {
        addLog('SYSTEM_NOTICE: TTS_QUOTA_EXHAUSTED. ACTIVATING_LOCAL_SYNTH_MODULE.', 'system');
        // Set 5-minute cooldown
        ttsQuotaCooldownRef.current = Date.now() + 5 * 60 * 1000;
      } else {
        console.error("TTS Error:", error);
        addLog(`TTS_CORE_FAILURE: ${error instanceof Error ? error.message : 'UNKNOWN_ERROR'}`, 'error');
      }

      useLocalSynth();
    }
  }, [isSpeechEnabled, addLog]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsAiSpeaking(false);
    isSpeakingRef.current = false;
    if (!isMutedRef.current) {
      startListeningRef.current();
    }
  }, []);

  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

  const handleVocalOpsCommand = useCallback(async (command: string) => {
    setIsProcessing(true);
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('clear terminal')) {
      setLogs([]);
      addLog('TERMINAL_BUFFER_PURGED', 'system');
      setIsProcessing(false);
      speak('Terminal cleared.');
      return;
    }

    if (lowerCommand.includes('deactivate')) {
      setActiveAgent(null);
      setIsProcessing(false);
      setAgentStatuses({});
      speak('All agents deactivated. System in standby.');
      return;
    }

    if (lowerCommand.includes('show command history')) {
      setLogFilter('history');
      setIsProcessing(false);
      addLog('FILTER_APPLIED: COMMAND_HISTORY_ONLY', 'system');
      speak('Displaying command history only.');
      return;
    }

    if (lowerCommand.includes('show all logs') || lowerCommand.includes('reset logs')) {
      setLogFilter('all');
      setIsProcessing(false);
      addLog('FILTER_REMOVED: ALL_SYSTEM_LOGS', 'system');
      speak('Displaying all system logs.');
      return;
    }

    const detectedAgent = agentConfigs.find(a => 
      lowerCommand.includes(a.wakeWord.toLowerCase()) || 
      lowerCommand.includes(a.id.toLowerCase())
    );

    const targetAgentId = detectedAgent ? detectedAgent.id : 'Default';
    setActiveAgent(targetAgentId);
    setAgentStatuses(prev => ({ ...prev, [targetAgentId]: 'processing' }));
    
    addLog(command, 'user');
    addLog(`UPLINKING TO ${targetAgentId.toUpperCase()} CORE...`, 'system');

    // Handle the proxy fetch with better error reporting
    const proxyPromise = fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_command: command, 
        target_agent: targetAgentId,
        webhook_url: webhookUrl 
      }),
    }).then(async (res) => {
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        addLog(`UPLINK_FAILURE: ${errData.details || errData.error || 'NETWORK_ERROR'}`, 'error');
      }
    }).catch(err => {
      console.error('Proxy fetch failed:', err);
      addLog(`UPLINK_OFFLINE: UNABLE_TO_REACH_PROXY_ENDPOINT`, 'error');
    });

    try {
      const session = getChatSession(targetAgentId);
      if (!session) throw new Error('Gemini session not initialized');
      
      const result = await session.sendMessage({ message: command });
      const rawReply = result.text || 'NO DATA RECEIVED.';
      const cleanReply = rawReply.replace(/[*#_~`>\[\]\(\)]/g, '').trim();
      
      addLog(cleanReply, 'agent', targetAgentId);
      setIsProcessing(false);
      setAgentStatuses(prev => ({ ...prev, [targetAgentId]: 'idle' }));
      speak(cleanReply);
    } catch (error: any) {
      const isQuotaError = 
        error?.status === 429 || 
        error?.code === 429 ||
        error?.error?.code === 429 ||
        (error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) ||
        JSON.stringify(error).includes('429') ||
        JSON.stringify(error).includes('RESOURCE_EXHAUSTED');

      if (isQuotaError) {
        addLog('SYSTEM_NOTICE: CHAT_QUOTA_EXHAUSTED. ACTIVATING_LOCAL_FALLBACK_PROTOCOLS.', 'system');
      } else {
        console.error('Gemini error:', error);
        addLog(`CORE_FAILURE: ${error instanceof Error ? error.message : 'UNKNOWN ERROR'}`, 'error');
      }
      
      const fallbackResponses = [
        "Core communication offline. Switching to local buffer.",
        "Uplink unstable. Standing by for reconnection.",
        "System resources constrained. Unable to process complex queries.",
        "Neural link interrupted. Please repeat command later.",
        "Local processing only. AI core currently unreachable."
      ];
      
      const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      setIsProcessing(false);
      setAgentStatuses(prev => ({ ...prev, [targetAgentId]: 'error' }));
      
      // Still speak the fallback message so the agent "talks without issue"
      speak(randomFallback);
    }
  }, [webhookUrl, isTestMode, agentConfigs, addLog, speak]);

  useEffect(() => {
    handleCommandRef.current = handleVocalOpsCommand;
  }, [handleVocalOpsCommand]);

  const testConnection = async () => {
    addLog('TESTING UPLINK CONNECTION...', 'system');
    setIsProcessing(true);
    let finalUrl = webhookUrl;
    if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
    if (isTestMode && finalUrl.includes('/webhook/')) {
      finalUrl = finalUrl.replace('/webhook/', '/webhook-test/');
    }

    const performTest = async (url: string) => {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_agent: 'Default', user_command: 'ping', webhook_url: url }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        const error = new Error(errorData.details || errorData.error || `HTTP error! status: ${response.status}`);
        (error as any).status = response.status;
        throw error;
      }
      return response;
    };

    try {
      try {
        await performTest(finalUrl);
      } catch (error: any) {
        if (error.status === 404 && !isTestMode && finalUrl.includes('/webhook/')) {
          const testUrl = finalUrl.replace('/webhook/', '/webhook-test/');
          addLog('UPLINK 404: ATTEMPTING TEST_WEBHOOK_FALLBACK...', 'system');
          await performTest(testUrl);
        } else {
          throw error;
        }
      }
      addLog('UPLINK CONNECTION: STABLE', 'system');
      speak('Uplink connection stable.');
    } catch (error) {
      addLog(`UPLINK CONNECTION: FAILED - ${error instanceof Error ? error.message : 'UNKNOWN'}`, 'error');
      speak('Uplink connection failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = useCallback(() => {
    if (!SpeechRecognition || isMuted || isSpeakingRef.current) return;
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      addLog('VOCALOPS SYSTEM: ONLINE', 'system');
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let currentFinal = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) currentFinal += transcriptPart;
        else interimTranscript += transcriptPart;
      }
      setTranscript(interimTranscript || currentFinal);
      if (currentFinal) {
        accumulatedTranscriptRef.current += ' ' + currentFinal.trim();
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
          const fullText = accumulatedTranscriptRef.current.trim();
          if (!fullText) return;
          accumulatedTranscriptRef.current = '';
          if (recognitionRef.current) recognitionRef.current.stop();
          handleCommandRef.current(fullText);
        }, 1000);
      }
    };

    recognition.onerror = (event: any) => {
      const error = event.error;
      if (error === 'network') addLog('NETWORK ERROR DETECTED. RECONNECTING...', 'error');
      else if (error === 'not-allowed') {
        addLog('MIC ACCESS DENIED.', 'error');
        setIsMuted(true);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (!isMutedRef.current && !isSpeakingRef.current && !isProcessing) {
        setTimeout(() => { try { recognition.start(); } catch (e) {} }, 100);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isMuted, isProcessing, webhookUrl, addLog]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (!isMuted) startListening();
    else {
      stopListening();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
    return () => stopListening();
  }, [isMuted, startListening, stopListening]);

  useEffect(() => {
    if (!isBooting) {
      const timer = setTimeout(() => {
        speak("Hello Master. VocalOps system is online and waiting for your command.");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isBooting, speak]);

  const handleAddAgent = () => {
    const newId = `Agent_${Math.random().toString(36).substring(7).toUpperCase()}`;
    const newAgent: AgentConfig = {
      id: newId,
      name: `NEW_AGENT_${agentConfigs.length + 1}`,
      color: 'text-green-400',
      icon: Activity as any,
      wakeWord: `agent${agentConfigs.length + 1}`,
      systemPrompt: 'You are a new AI voice agent. How can I help you?',
      verbosity: 'normal'
    };
    setAgentConfigs([...agentConfigs, newAgent]);
    addLog(`NEW AGENT INITIALIZED: ${newId}`, 'system');
  };

  const handleDeleteAgent = (id: AgentId) => {
    const systemAgents = ['Alpha', 'Bravo', 'Charlie', 'Delta'];
    if (systemAgents.includes(id)) {
      addLog(`SYSTEM ERROR: CANNOT DECOMMISSION CORE AGENT ${id}.`, 'error');
      return;
    }
    setAgentConfigs(agentConfigs.filter(a => a.id !== id));
    addLog(`AGENT ${id} DECOMMISSIONED.`, 'system');
  };

  return (
    <VocalOpsContext.Provider value={{
      isBooting, isListening, isAiSpeaking, isSpeechEnabled, isMuted, transcript, logs, activeAgent, isProcessing,
      webhookUrl, isTestMode, agentConfigs, agentStatuses, logFilter,
      setIsBooting, setIsMuted, setIsSpeechEnabled, setWebhookUrl, setIsTestMode, setAgentConfigs, setLogFilter,
      addLog, setLogs, speak, handleVocalOpsCommand, testConnection, handleAddAgent, handleDeleteAgent,
      stopSpeaking,
      terminalEndRef
    }}>
      {children}
    </VocalOpsContext.Provider>
  );
};

export const useVocalOps = () => {
  const context = useContext(VocalOpsContext);
  if (!context) throw new Error('useVocalOps must be used within a VocalOpsProvider');
  return context;
};
