import React, { useState } from 'react';
import { X, Wallet, CheckCircle, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { connectMetaMaskWallet } from '../utils/web3';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAccount: string;
  onAccountConnected: (address: string, providerName: string) => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  currentAccount,
  onAccountConnected,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasMetaMask] = useState<boolean>(typeof window !== 'undefined' && Boolean(window.ethereum));

  if (!isOpen) return null;

  const handleConnectMetaMask = async () => {
    setLoading(true);
    setError('');
    try {
      const { address, providerName } = await connectMetaMaskWallet();
      onAccountConnected(address, providerName);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to connect to MetaMask');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDevAccount = () => {
    // Generate a random local developer test account
    const randHex = Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    const devAddress = `0x${randHex}`;
    onAccountConnected(devAddress, 'GenLayer Dev Key');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-xl w-full max-w-md overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Wallet className="w-5 h-5" />
            <h3 className="font-bold text-slate-100 text-sm uppercase">
              Connect Web3 Wallet
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-rose-950/60 border border-rose-500/50 rounded-lg p-3 text-xs text-rose-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Wallet Connection Error</p>
                <p className="text-[11px] mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {currentAccount ? (
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-lg p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Connected Wallet:</span>
                <span className="text-emerald-400 font-bold flex items-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Active</span>
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200 break-all font-mono">
                {currentAccount}
              </div>
              <button
                onClick={() => onAccountConnected('', '')}
                className="w-full mt-2 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded text-xs transition-all"
              >
                Disconnect Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Option 1: MetaMask / Extension */}
              <button
                onClick={handleConnectMetaMask}
                disabled={loading}
                className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500 rounded-xl transition-all group text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition-all">
                      MetaMask / Extension Wallet
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {hasMetaMask ? 'Detected in Browser (EIP-1193)' : 'Not detected in browser'}
                    </p>
                  </div>
                </div>
                {loading && <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />}
              </button>

              {/* Option 2: GenLayer Testnet Dev Key */}
              <button
                onClick={handleUseDevAccount}
                className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 rounded-xl transition-all group text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-400 transition-all">
                      Generate Local Dev Key
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Instant testing address for GenLayer Localnet
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
