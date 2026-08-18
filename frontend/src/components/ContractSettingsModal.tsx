import React, { useState } from 'react';
import { X, Settings, CheckCircle, Cpu } from 'lucide-react';
import type { GenLayerNetwork } from '../utils/genlayer';

interface ContractSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractAddress: string;
  network: GenLayerNetwork;
  onSaveSettings: (address: string, network: GenLayerNetwork) => void;
}

export const ContractSettingsModal: React.FC<ContractSettingsModalProps> = ({
  isOpen,
  onClose,
  contractAddress,
  network,
  onSaveSettings,
}) => {
  const [addressInput, setAddressInput] = useState(contractAddress);
  const [selectedNetwork, setSelectedNetwork] = useState<GenLayerNetwork>(network);
  const [statusMsg, setStatusMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(addressInput.trim(), selectedNetwork);
    setStatusMsg('Contract settings saved successfully!');
    setTimeout(() => {
      setStatusMsg('');
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-xl w-full max-w-lg overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Settings className="w-5 h-5" />
            <h3 className="font-bold text-slate-100 text-sm uppercase">
              GenLayer Contract & Network Config
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {statusMsg && (
            <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-lg p-3 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{statusMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-300 mb-1.5 font-semibold">
              Deployed Intelligent Contract Address *
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Enter the address generated after running <code className="text-emerald-400">genlayer deploy contracts/AuditorShield.py</code>.
            </p>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1.5 font-semibold">
              Target GenLayer Network *
            </label>
            <select
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value as GenLayerNetwork)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            >
              <option value="testnetAsimov">GenLayer Testnet (Asimov)</option>
              <option value="testnetBradbury">GenLayer Testnet (Bradbury)</option>
              <option value="studionet">GenLayer Studio Net</option>
              <option value="localnet">Localnet Simulator (http://localhost:4000)</option>
            </select>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-cyan-400 font-bold">
              <Cpu className="w-3.5 h-3.5" />
              <span>Real GenVM Contract Integration</span>
            </div>
            <p className="leading-relaxed">
              When connected to your contract address, all bounties, reports, and AI verdicts will be fetched and executed directly on the GenLayer Testnet RPC without mock data.
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 rounded border border-slate-800 hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all active:scale-95"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
