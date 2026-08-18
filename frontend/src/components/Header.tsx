import React from 'react';
import { ShieldAlert, Plus, Wallet, Code2 } from 'lucide-react';

interface HeaderProps {
  onOpenCreate: () => void;
  onOpenCode: () => void;
  account: string;
  providerName: string;
  onOpenWalletModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreate,
  onOpenCode,
  account,
  providerName,
  onOpenWalletModal,
}) => {
  return (
    <header className="border-b border-emerald-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-wider text-slate-100 uppercase">
                Auditor<span className="text-emerald-400">Shield</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-950/60 text-emerald-400">
                GenVM v0.2.16
              </span>
            </div>
            <p className="text-xs text-slate-400">Decentralized Bug Bounty Court</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenCode}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs rounded bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 transition-all"
          >
            <Code2 className="w-4 h-4" />
            <span>Contract Source</span>
          </button>

          <button
            onClick={onOpenCreate}
            className="flex items-center space-x-2 px-4 py-1.5 text-xs font-bold rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Post Bug Bounty</span>
          </button>

          <button
            onClick={onOpenWalletModal}
            className={`flex items-center space-x-2 px-3 py-1.5 text-xs rounded border transition-all ${
              account
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                : 'bg-slate-900 border-slate-700 hover:border-emerald-500 text-slate-300'
            }`}
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>
              {account
                ? `${account.substring(0, 6)}...${account.substring(account.length - 4)} ${providerName ? `(${providerName})` : ''}`
                : 'Connect Wallet'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
