import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVocalOps } from '../context/VocalOpsContext';

export const BootSequence = () => {
  const { setIsBooting } = useVocalOps();
  const [lines, setLines] = useState<string[]>([]);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const hex = Math.random().toString(16).substring(2, 10).toUpperCase();
      const addr = '0x' + Math.random().toString(16).substring(2, 6).toUpperCase();
      setLines(prev => [...prev, `${addr}: ${hex} ${hex} ${hex}`].slice(-20));
    }, 50);

    const promptTimer = setTimeout(() => {
      setShowPrompt(true);
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(promptTimer);
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-[#050505] text-[#00ff41] font-mono flex flex-col items-center justify-center p-8 overflow-hidden relative">
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden p-4">
        {lines.map((line, i) => (
          <div key={i} className="text-[10px] leading-tight whitespace-nowrap">
            {line}
          </div>
        ))}
      </div>
      
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="z-10 flex flex-col items-center gap-4 sm:gap-8 w-full max-w-xs sm:max-w-none"
          >
            <div className="p-4 border-2 border-[#00ff41] shadow-[0_0_20px_rgba(0,255,65,0.4)] bg-black text-center w-full">
              <h2 className="text-xl sm:text-3xl font-black tracking-[0.3em] animate-pulse">SYSTEM ONLINE</h2>
            </div>
            
            <button
              onClick={() => setIsBooting(false)}
              className="group relative w-full sm:w-auto px-8 py-4 border border-[#00ff41] bg-[#00ff41]/5 hover:bg-[#00ff41] transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-[#00ff41]/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10 text-xs font-black tracking-[0.5em] group-hover:text-black">
                [ INITIALIZE_SYSTEM ]
              </span>
            </button>

            <div className="text-[10px] tracking-[0.5em] opacity-60">AWAITING USER_INTERACTION...</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-8 left-8 text-[8px] opacity-40">
        BOOT_LOADER_V4.2.0 // KERNEL_HASH: 0x88AF2
      </div>
    </div>
  );
};
