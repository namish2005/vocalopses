import React from 'react';
import { motion } from 'motion/react';
import { useVocalOps } from '../context/VocalOpsContext';

export const Logs: React.FC = () => {
  const { logs } = useVocalOps();

  // Filter logs to show only user and agent interactions (simulating the webhook data)
  const interactionLogs = logs.filter(log => log.type === 'user' || log.type === 'agent');

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto lg:overflow-x-hidden">
        <div className="min-w-[800px] lg:min-w-0 border border-[#00ff41]/20 bg-black/40 relative group">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00ff41]" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00ff41]" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00ff41]" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00ff41]" />

          <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[#00ff41]/10 backdrop-blur-md z-10 border-b border-[#00ff41]/30">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black tracking-[0.3em] uppercase opacity-60">Timestamp</th>
              <th className="px-6 py-4 text-[10px] font-black tracking-[0.3em] uppercase opacity-60">Agent</th>
              <th className="px-6 py-4 text-[10px] font-black tracking-[0.3em] uppercase opacity-60">Command / Response</th>
              <th className="px-6 py-4 text-[10px] font-black tracking-[0.3em] uppercase opacity-60">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#00ff41]/10">
            {interactionLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm opacity-40 italic">
                  NO_LOG_DATA_DETECTED // SYSTEM_IDLE
                </td>
              </tr>
            ) : (
              interactionLogs.map((log, i) => (
                <motion.tr 
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-[#00ff41]/5 transition-colors group"
                >
                  <td className="px-6 py-4 text-[10px] font-bold opacity-60 font-mono">
                    {log.timestamp}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black tracking-widest px-2 py-1 border ${
                      log.type === 'user' ? 'border-white text-white' : 'border-[#00ff41] text-[#00ff41]'
                    }`}>
                      {log.type === 'user' ? 'USER' : log.agent?.toUpperCase() || 'SYSTEM'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/80 max-w-md truncate">
                    {log.text}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-pulse" />
                      <span className="text-[10px] font-bold text-[#00ff41] tracking-widest uppercase">Uplinked</span>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

    <div className="mt-4 flex justify-between items-center text-[10px] opacity-40 font-bold uppercase tracking-[0.2em]">
        <span>Total_Entries: {interactionLogs.length}</span>
        <span>Filter: INTERACTION_ONLY</span>
      </div>
    </div>
  );
};
