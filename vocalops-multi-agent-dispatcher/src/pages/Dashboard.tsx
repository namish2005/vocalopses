import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff } from 'lucide-react';
import { useVocalOps } from '../context/VocalOpsContext';

export const Dashboard: React.FC = () => {
  const { 
    isListening, 
    isAiSpeaking, 
    isMuted, 
    transcript, 
    logs, 
    activeAgent, 
    isProcessing, 
    agentConfigs, 
    agentStatuses, 
    logFilter,
    setIsMuted,
    stopSpeaking,
    terminalEndRef
  } = useVocalOps();

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-8 lg:h-full lg:overflow-hidden pr-2">
      {/* Left: Terminal Log */}
      <div className="lg:col-span-5 flex flex-col bg-black/40 border border-[#00ff41]/20 overflow-hidden relative group min-h-[250px] lg:min-h-0 shrink-0 lg:shrink">
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00ff41]" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00ff41]" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00ff41]" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00ff41]" />
        
        <div className="bg-[#00ff41]/5 border-b border-[#00ff41]/10 px-4 py-2 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-bold tracking-widest uppercase opacity-80">Terminal_Uplink.log</span>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-amber-500/50" />
            <div className="w-2 h-2 rounded-full bg-green-500/50" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <AnimatePresence initial={false}>
            {logs
              .filter(log => logFilter === 'all' || log.type === 'user' || log.type === 'agent')
              .map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-1"
              >
                <div className="flex items-center gap-2 text-[10px] opacity-30 font-bold">
                  <span>[{log.timestamp}]</span>
                  <span className="uppercase tracking-tighter">{log.type}</span>
                </div>
                
                <div className="flex gap-3 text-sm md:text-base">
                  <span className={`font-bold shrink-0 shadow-[0_0_8px_rgba(0,255,65,0.2)] ${
                    log.type === 'user' ? 'text-white' : 
                    log.type === 'error' ? 'text-red-500' : 'text-[#00ff41]'
                  }`}>
                    {log.type === 'user' ? 'USER:' : 
                     log.type === 'agent' ? `${log.agent?.toUpperCase()}:` : 'SYS:'}
                  </span>
                  <span className={`${
                    log.type === 'user' ? 'text-white/90' : 
                    log.type === 'error' ? 'text-red-400' : 'text-[#00ff41]/90'
                  } leading-relaxed`}>
                    {log.text}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Center: Audio Interface */}
      <div className="lg:col-span-3 flex flex-col items-center justify-center relative py-4 lg:py-0 shrink-0 lg:shrink">
        <div className="relative flex items-center justify-center">
          <AnimatePresence>
            {isAiSpeaking && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={stopSpeaking}
                className="absolute -top-20 px-4 py-2 bg-red-600/20 border border-red-500 text-red-500 text-[10px] uppercase tracking-widest font-bold hover:bg-red-600/40 transition-colors z-20"
              >
                Stop Speaking
              </motion.button>
            )}
          </AnimatePresence>

          {/* Radar Rings */}
          <AnimatePresence>
            {isListening && !isMuted && !isAiSpeaking && (
              <>
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [0.8, 1.8, 2.5], opacity: [0, 0.3, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.6,
                      ease: "easeOut"
                    }}
                    className="absolute w-32 h-32 border border-[#00ff41] rounded-full"
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Main Mic Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`relative z-10 w-32 h-32 flex items-center justify-center border-2 transition-all duration-500 group ${
              isMuted 
                ? 'border-red-600/50 bg-red-950/20 shadow-[0_0_20px_rgba(220,38,38,0.2)]' 
                : 'border-[#00ff41] bg-[#00ff41]/5 shadow-[0_0_30px_rgba(0,255,65,0.3)]'
            }`}
          >
            <div className="absolute inset-1 border border-[#00ff41]/20" />
            {isMuted ? (
              <MicOff className="w-12 h-12 text-red-500" />
            ) : (
              <Mic className={`w-12 h-12 text-[#00ff41] ${isListening ? 'animate-pulse' : ''}`} />
            )}
            
            {/* Corner Accents */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-inherit" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-inherit" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-inherit" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-inherit" />
          </button>
        </div>

        <div className="mt-6 md:mt-12 text-center">
          <div className="text-[10px] uppercase tracking-[0.5em] opacity-40 mb-2">Voice_Input_Status</div>
          <div className={`text-sm font-black tracking-widest uppercase ${isMuted || isAiSpeaking ? 'text-red-500' : 'text-[#00ff41]'}`}>
            {isMuted ? 'PROTOCOL_PAUSED' : isAiSpeaking ? 'SYSTEM SPEAKING / MIC MUTED' : isProcessing ? `PROCESSING_${activeAgent?.toUpperCase()}` : isListening ? 'LISTENING...' : 'STANDBY'}
          </div>
          {transcript && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 md:mt-4 text-[10px] text-white/60 italic max-w-[200px] truncate mx-auto"
            >
              "{transcript}"
            </motion.div>
          )}
        </div>
      </div>

      {/* Right: Agent Grid */}
      <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0 lg:shrink pb-8">
        {agentConfigs.filter(a => ['Alpha', 'Bravo', 'Charlie', 'Delta'].includes(a.id)).map((agent) => {
          const isActive = activeAgent === agent.id;
          const status = agentStatuses[agent.id] || 'idle';
          const Icon = agent.icon;
          
          return (
            <div 
              key={agent.id}
              className={`relative p-6 border transition-all duration-500 flex flex-col items-center justify-center gap-4 group overflow-hidden ${
                isActive 
                  ? 'border-[#00ff41] bg-[#00ff41]/10 shadow-[0_0_20px_rgba(0,255,65,0.2)]' 
                  : 'border-[#00ff41]/20 bg-black/40 hover:border-[#00ff41]/50'
              }`}
            >
              {/* Glitch Effect Overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#00ff41_3px)]" />
              
              <div className={`relative ${isActive ? 'animate-bounce' : 'group-hover:animate-pulse'}`}>
                <Icon className={`w-10 h-10 ${isActive ? 'text-[#00ff41]' : 'text-[#00ff41]/40'}`} />
                {status === 'processing' && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-2 border-2 border-t-[#00ff41] border-transparent rounded-full"
                  />
                )}
              </div>

              <div className="text-center">
                <div className="text-xs font-black tracking-widest mb-1">
                  {agent.name} <span className="text-[8px] opacity-40 font-normal ml-1">[{agent.wakeWord.toUpperCase()}]</span>
                </div>
                <div className="text-[8px] opacity-40 uppercase tracking-tighter flex items-center justify-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    status === 'idle' ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' :
                    status === 'processing' ? 'bg-yellow-500 shadow-[0_0_5px_#eab308]' :
                    'bg-red-500 shadow-[0_0_5px_#ef4444]'
                  }`} />
                  <span>Status: <span className={status === 'error' ? 'text-red-500' : 'text-[#00ff41]'}>{status}</span></span>
                </div>
              </div>

              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-inherit" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-inherit" />
            </div>
          );
        })}
        
        {/* System Stats Card */}
        <div className="col-span-1 sm:col-span-2 mt-4 p-4 border border-[#00ff41]/10 bg-black/20 space-y-3">
          <div className="flex justify-between text-[10px] opacity-40 font-bold">
            <span>CPU_CORE_TEMP</span>
            <span>42°C</span>
          </div>
          <div className="h-1 bg-[#00ff41]/5 w-full">
            <motion.div 
              animate={{ width: ["20%", "45%", "30%"] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="h-full bg-[#00ff41]/40" 
            />
          </div>
          <div className="flex justify-between text-[10px] opacity-40 font-bold">
            <span>MEMORY_ALLOCATION</span>
            <span>8.4GB / 32GB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
