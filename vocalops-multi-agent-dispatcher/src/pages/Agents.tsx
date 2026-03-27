import React from 'react';
import { motion } from 'motion/react';
import { useVocalOps } from '../context/VocalOpsContext';

export const Agents: React.FC = () => {
  const { agentConfigs, agentStatuses } = useVocalOps();

  const capabilities: Record<string, string[]> = {
    Alpha: ['Threat Intelligence', 'Payload Analysis', 'Vulnerability Assessment'],
    Bravo: ['Software Architecture', 'C++ Debugging', 'Backend Infrastructure'],
    Charlie: ['OSINT Gathering', 'Data Summarization', 'Fact Extraction'],
    Delta: ['Logistics Management', 'Workflow Automation', 'Database Logging'],
  };

  const descriptions: Record<string, string> = {
    Alpha: 'Tactical cybersecurity and reconnaissance specialist. Optimized for red team operations and system breach analysis.',
    Bravo: 'Lead development and software architecture core. Specialized in complex logic and high-performance computing.',
    Charlie: 'Open-source intelligence and rapid data gathering unit. Designed for deep-web research and real-time fact-finding.',
    Delta: 'Operations and logistics coordinator. Manages system memory, logging, and automated task scheduling.',
  };

  return (
    <div className="pr-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 pb-8">
        {agentConfigs.filter(a => ['Alpha', 'Bravo', 'Charlie', 'Delta'].includes(a.id)).map((agent) => {
          const status = agentStatuses[agent.id] || 'idle';
          const Icon = agent.icon;
          
          return (
            <motion.div 
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-4 md:p-8 border border-[#00ff41]/20 bg-black/40 group overflow-hidden"
            >
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00ff41]" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00ff41]/30" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00ff41]/30" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00ff41]" />

              <div className="flex items-start gap-6 mb-6">
                <div className="p-4 border border-[#00ff41] bg-[#00ff41]/5 shadow-[0_0_20px_rgba(0,255,65,0.2)]">
                  <Icon className="w-10 h-10 text-[#00ff41]" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-widest text-white mb-1">{agent.name}</h3>
                  <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      status === 'idle' ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' :
                      status === 'processing' ? 'bg-yellow-500 shadow-[0_0_5px_#eab308]' :
                      'bg-red-500 shadow-[0_0_5px_#ef4444]'
                    }`} />
                    <span className="opacity-60">STATUS:</span>
                    <span className={status === 'error' ? 'text-red-500' : 'text-[#00ff41]'}>{status.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40 mb-2">Capabilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {capabilities[agent.id]?.map((cap, i) => (
                      <span key={i} className="px-2 py-1 bg-[#00ff41]/10 border border-[#00ff41]/20 text-[10px] font-bold text-[#00ff41]">
                        {cap.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black tracking-[0.3em] uppercase opacity-40 mb-2">Description</h4>
                  <p className="text-sm text-white/70 leading-relaxed italic">
                    {descriptions[agent.id]}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#00ff41]/10 flex justify-between items-center">
                  <div className="text-[10px] font-bold opacity-40">
                    WAKE_WORD: <span className="text-[#00ff41]">{agent.wakeWord.toUpperCase()}</span>
                  </div>
                  <div className="text-[10px] font-bold opacity-40">
                    VERBOSITY: <span className="text-[#00ff41]">{agent.verbosity.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Decorative Scanline */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#00ff41_3px)]" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
