import React, { useState } from 'react';
import { X, Lock, Code, Sparkles } from 'lucide-react';

interface CreateBountyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (codeUrl: string, focusArea: string, amount: string) => void;
}

export const CreateBountyModal: React.FC<CreateBountyModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [codeUrl, setCodeUrl] = useState('https://gist.github.com/defiprotocol/vault.sol');
  const [focusArea, setFocusArea] = useState('Focus on reentrancy attacks, flashloan arbitrage, and math overflows');
  const [amount, setAmount] = useState('5000');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeUrl || !amount) return;
    onCreate(codeUrl, focusArea, amount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-xl w-full max-w-lg overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <h3 className="font-mono font-bold text-slate-100 text-sm uppercase">
              Lock GEN Escrow & Post Bounty
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 font-mono">
          <div>
            <label className="block text-xs text-slate-300 mb-1.5 font-semibold">
              Target Code Base URL (GitHub / Gist) *
            </label>
            <div className="relative">
              <Code className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="url"
                required
                placeholder="https://gist.github.com/... or https://github.com/..."
                value={codeUrl}
                onChange={(e) => setCodeUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Must be publicly accessible plain text / Solidity code.
            </p>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1.5 font-semibold">
              Focus Area & Vulnerability Scope *
            </label>
            <textarea
              rows={3}
              required
              placeholder="E.g. Focus on reentrancy, access control, integer precision loss..."
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1.5 font-semibold">
              GEN Reward Amount to Escrow *
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg pl-3 pr-16 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="absolute right-3 top-2 text-xs font-bold text-emerald-500">
                GEN
              </span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>GenVM Protection Guarantee</span>
            </div>
            <p className="leading-relaxed">
              Funds will be locked inside the GenLayer Intelligent Contract (`AuditorShield.py`). If a whitehat submits a report, GenVM AI consensus judge will independently audit it.
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
              Lock & Post Bounty
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
