import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useVocalOps } from '../context/VocalOpsContext';
import { Download, Activity, Trash2 } from 'lucide-react';
import { AgentId } from '../types';

export const Settings: React.FC = () => {
  const { 
    webhookUrl, 
    setWebhookUrl, 
    isTestMode, 
    setIsTestMode, 
    isSpeechEnabled,
    setIsSpeechEnabled,
    agentConfigs, 
    setAgentConfigs, 
    testConnection, 
    handleAddAgent, 
    handleDeleteAgent 
  } = useVocalOps();

  const [editingAgentId, setEditingAgentId] = useState<AgentId | null>(null);

  return (
    <div className="pr-4 space-y-6 md:space-y-12 pb-12">
      {/* Global Uplink Config */}
      <section className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-4 mb-4 md:mb-6">
          <div className="p-2 border border-[#00ff41] bg-[#00ff41]/5">
            <Activity className="w-5 h-5 text-[#00ff41]" />
          </div>
          <h3 className="text-base md:text-lg font-black tracking-[0.3em] uppercase text-white">System_Uplink_Config</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div className="space-y-4">
            <label className="text-[10px] text-[#00FF41] uppercase block font-black tracking-widest opacity-60">Webhook Endpoint (n8n)</label>
            <input 
              type="text" 
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-black border border-[#00FF41]/30 p-4 text-sm text-white focus:outline-none focus:border-[#00FF41] transition-colors font-mono"
            />
            <div className="flex gap-4">
              <button 
                onClick={testConnection}
                className="flex-1 border border-[#00FF41]/30 py-3 text-[10px] font-black hover:bg-[#00FF41]/10 transition-colors uppercase tracking-[0.3em]"
              >
                [TEST_CONNECTION]
              </button>
              <a
                href="/n8n_workflow.json"
                download="vocalops_workflow.json"
                className="flex-1 py-3 border border-blue-500/30 hover:bg-blue-500/10 text-[10px] font-black tracking-[0.3em] transition-colors flex items-center justify-center gap-2 text-blue-400 uppercase"
              >
                <Download className="w-3 h-3" />
                [DOWNLOAD_N8N]
              </a>
            </div>
          </div>

          <div className="p-6 border border-[#00FF41]/20 bg-[#00FF41]/5 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] text-[#00FF41] font-black uppercase tracking-widest">AI_Voice_Output</span>
              <p className="text-[10px] text-[#00FF41]/60 uppercase leading-relaxed">
                {isSpeechEnabled 
                  ? 'VOICE_SYNTHESIS_ACTIVE: SYSTEM WILL SPEAK RESPONSES.' 
                  : 'VOICE_SYNTHESIS_DISABLED: SYSTEM WILL REMAIN SILENT.'}
              </p>
            </div>
            <button 
              onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
              className={`mt-4 w-full py-3 text-[10px] font-black border-2 transition-all tracking-[0.5em] ${isSpeechEnabled ? 'bg-[#00FF41] text-black border-[#00FF41]' : 'bg-black text-[#00FF41] border-[#00FF41]/30'}`}
            >
              {isSpeechEnabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          <div className="p-6 border border-[#00FF41]/20 bg-[#00FF41]/5 flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] text-[#00FF41] font-black uppercase tracking-widest">Uplink Mode</span>
              <p className="text-[10px] text-[#00FF41]/60 uppercase leading-relaxed">
                {isTestMode 
                  ? 'TEST_WEBHOOK_ACTIVE: SYSTEM WILL ATTEMPT TO ROUTE TO /WEBHOOK-TEST/ ENDPOINTS.' 
                  : 'PRODUCTION_WEBHOOK_ACTIVE: SYSTEM IS ROUTING TO LIVE PRODUCTION ENDPOINTS.'}
              </p>
            </div>
            <button 
              onClick={() => setIsTestMode(!isTestMode)}
              className={`mt-4 w-full py-3 text-[10px] font-black border-2 transition-all tracking-[0.5em] ${isTestMode ? 'bg-[#00FF41] text-black border-[#00FF41]' : 'bg-black text-[#00FF41] border-[#00FF41]/30'}`}
            >
              {isTestMode ? 'TEST' : 'PROD'}
            </button>
          </div>
        </div>
      </section>

      {/* Agent Config Section */}
      <section className="space-y-4 md:space-y-6 pt-6 md:pt-12 border-t border-[#00ff41]/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 border border-[#00ff41] bg-[#00ff41]/5">
              <Activity className="w-5 h-5 text-[#00ff41]" />
            </div>
            <h3 className="text-base md:text-lg font-black tracking-[0.3em] uppercase text-white">Agent_Core_Config</h3>
          </div>
          <button 
            onClick={handleAddAgent}
            className="w-full sm:w-auto text-[10px] font-black text-black bg-[#00FF41] px-6 py-2 hover:bg-[#00FF41]/80 transition-colors tracking-widest"
          >
            [+ ADD_NEW_AGENT]
          </button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4 mb-4 md:mb-8">
          {agentConfigs.map(agent => (
            <button
              key={agent.id}
              onClick={() => setEditingAgentId(agent.id)}
              className={`p-4 border text-[10px] font-black uppercase transition-all tracking-widest relative ${editingAgentId === agent.id ? 'bg-[#00FF41] text-black border-[#00FF41] shadow-[0_0_15px_rgba(0,255,65,0.3)]' : 'border-[#00FF41]/30 text-[#00FF41] hover:bg-[#00FF41]/10'}`}
            >
              {agent.id}
              {editingAgentId === agent.id && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-white" />
              )}
            </button>
          ))}
        </div>

        {editingAgentId && (
          <motion.div 
            key={editingAgentId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 md:p-8 border border-[#00FF41]/30 bg-[#00FF41]/5 space-y-4 md:space-y-8 relative"
          >
            <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#00ff41]" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#00ff41]" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <div className="space-y-4">
                <label className="text-[10px] text-[#00FF41]/60 uppercase block font-black tracking-widest">Wake Word</label>
                <input 
                  type="text"
                  value={agentConfigs.find(a => a.id === editingAgentId)?.wakeWord}
                  onChange={(e) => {
                    const newConfigs = agentConfigs.map(a => a.id === editingAgentId ? { ...a, wakeWord: e.target.value } : a);
                    setAgentConfigs(newConfigs);
                  }}
                  className="w-full bg-black border border-[#00FF41]/30 p-4 text-sm text-white focus:outline-none focus:border-[#00FF41] font-mono"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] text-[#00FF41]/60 uppercase block font-black tracking-widest">Verbosity</label>
                <select 
                  value={agentConfigs.find(a => a.id === editingAgentId)?.verbosity}
                  onChange={(e) => {
                    const newConfigs = agentConfigs.map(a => a.id === editingAgentId ? { ...a, verbosity: e.target.value as any } : a);
                    setAgentConfigs(newConfigs);
                  }}
                  className="w-full bg-black border border-[#00FF41]/30 p-4 text-sm text-[#00FF41] focus:outline-none focus:border-[#00FF41] font-mono"
                >
                  <option value="concise">CONCISE</option>
                  <option value="normal">NORMAL</option>
                  <option value="detailed">DETAILED</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] text-[#00FF41]/60 uppercase block font-black tracking-widest">System Prompt</label>
              <textarea 
                value={agentConfigs.find(a => a.id === editingAgentId)?.systemPrompt}
                onChange={(e) => {
                  const newConfigs = agentConfigs.map(a => a.id === editingAgentId ? { ...a, systemPrompt: e.target.value } : a);
                  setAgentConfigs(newConfigs);
                }}
                rows={4}
                className="w-full bg-black border border-[#00FF41]/30 p-4 text-sm text-white focus:outline-none focus:border-[#00FF41] resize-none font-mono"
              />
            </div>
            
            {!['Alpha', 'Bravo', 'Charlie', 'Delta'].includes(editingAgentId) && (
              <button 
                onClick={() => {
                  handleDeleteAgent(editingAgentId);
                  setEditingAgentId(null);
                }}
                className="w-full border border-red-600 text-red-600 py-4 text-[10px] font-black hover:bg-red-600/10 transition-colors uppercase tracking-[0.5em] flex items-center justify-center gap-3"
              >
                <Trash2 className="w-4 h-4" />
                [DECOMMISSION_AGENT]
              </button>
            )}
          </motion.div>
        )}
      </section>
    </div>
  );
};
