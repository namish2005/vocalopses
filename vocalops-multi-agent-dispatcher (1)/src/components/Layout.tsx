import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Terminal, 
  Users, 
  Database, 
  Settings as SettingsIcon,
  Activity,
  Menu,
  X
} from 'lucide-react';
import { useVocalOps } from '../context/VocalOpsContext';
import { BootSequence } from './BootSequence';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isBooting, isListening, isMuted } = useVocalOps();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isBooting) {
    return <BootSequence />;
  }

  const navItems = [
    { path: '/', icon: Terminal, label: 'DASHBOARD' },
    { path: '/agents', icon: Users, label: 'AGENTS' },
    { path: '/logs', icon: Database, label: 'LOGS' },
    { path: '/settings', icon: SettingsIcon, label: 'SETTINGS' },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-[#00ff41] font-mono selection:bg-[#00ff41] selection:text-black overflow-hidden flex flex-col md:flex-row p-2 sm:p-4 md:p-8 relative crt-effect">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-3 border border-[#00ff41]/20 bg-black/40 mb-2 shrink-0 relative">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5" />
          <h1 className="text-base font-black tracking-[0.2em] uppercase leading-tight">
            VOCAL<span className="text-white">OPS</span>
          </h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 border border-[#00ff41]/40 text-[#00ff41]"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className={`
        fixed inset-0 z-50 md:relative md:inset-auto
        w-full md:w-64 flex flex-col border border-[#00ff41]/20 bg-black/95 md:bg-black/40 
        md:mr-8 shrink-0 md:relative group
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00ff41]" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00ff41]" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00ff41]" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00ff41]" />

        <div className="p-6 border-b border-[#00ff41]/10 hidden md:flex items-center gap-4">
          <div className="p-2 border border-[#00ff41] shadow-[0_0_10px_rgba(0,255,65,0.3)]">
            <Activity className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black tracking-[0.2em] uppercase leading-tight">
            VOCAL<span className="text-white">OPS</span>
          </h1>
        </div>

        <div className="flex-1 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMobileMenu}
              className={({ isActive }) => `
                flex items-center gap-4 px-6 py-3 transition-all duration-300 group relative
                ${isActive 
                  ? 'text-white bg-[#00ff41]/10 border-y border-[#00ff41]/30 shadow-[0_0_15px_rgba(0,255,65,0.1)]' 
                  : 'text-[#00ff41]/60 hover:text-[#00ff41] hover:bg-[#00ff41]/5 hover:shadow-[0_0_10px_rgba(0,255,65,0.1)]'}
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-bold tracking-[0.2em] uppercase">{item.label}</span>
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00ff41] opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          ))}
        </div>

        <div className="p-6 border-t border-[#00ff41]/10 space-y-4">
          <div className="flex flex-col gap-1 opacity-40 text-[10px]">
            <span>UPLINK: SECURE</span>
            <span>ENCRYPTION: AES-256</span>
          </div>
          <button 
            onClick={closeMobileMenu}
            className="md:hidden w-full py-2 border border-[#00ff41]/40 text-[10px] uppercase tracking-widest"
          >
            CLOSE_MENU
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#00ff41]/30 pb-2 md:pb-4 mb-4 md:mb-8 shrink-0 gap-2 md:gap-4">
          <div>
            <h2 className="text-xs md:text-sm font-black tracking-[0.3em] uppercase opacity-60">
              {location.pathname === '/' ? 'SYSTEM_DASHBOARD' : location.pathname.substring(1).toUpperCase() + '_MODULE'}
            </h2>
            <div className="flex items-center gap-2 text-[8px] md:text-[10px] opacity-40">
              <span className="animate-pulse">●</span> LATENCY: 24MS
              <span className="ml-2">PACKET_LOSS: 0%</span>
            </div>
          </div>

          <div className="flex items-center gap-6 self-end sm:self-auto">
            <div className="flex flex-col items-end text-[8px] md:text-[10px] opacity-40">
              <span>PROTO: VX-9</span>
              <span>SYNC: 100%</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-4 md:mt-8 flex flex-col sm:flex-row justify-between items-center text-[8px] md:text-[10px] text-[#00ff41]/30 uppercase tracking-[0.3em] border-t border-[#00ff41]/10 pt-2 md:pt-4 shrink-0 gap-2 md:gap-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-center">
            <span className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isListening && !isMuted ? 'bg-[#00ff41] shadow-[0_0_5px_#00ff41]' : 'bg-red-900'}`} />
              VOICE_LINK: {isListening && !isMuted ? 'ACTIVE' : 'OFFLINE'}
            </span>
            <span>SESSION_ID: VX-909</span>
          </div>
          <div className="text-center sm:text-right">© 2026 VOCALOPS_CORP // NEURAL_INTERFACE_V5</div>
        </footer>
      </div>

      <style>{`
        .crt-effect::after {
          content: " ";
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          z-index: 100;
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
          opacity: 0.15;
        }

        @keyframes flicker {
          0% { opacity: 0.98; }
          50% { opacity: 1; }
          100% { opacity: 0.99; }
        }

        .crt-effect {
          animation: flicker 0.15s infinite;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 65, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 65, 0.4);
        }
      `}</style>
    </div>
  );
};
