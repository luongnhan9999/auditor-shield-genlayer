import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { BountyCard } from './components/BountyCard';
import { CreateBountyModal } from './components/CreateBountyModal';
import { SubmitReportModal } from './components/SubmitReportModal';
import { TerminalAdjudicationModal } from './components/TerminalAdjudicationModal';
import { ContractCodeModal } from './components/ContractCodeModal';
import { WalletModal } from './components/WalletModal';
import { ContractSettingsModal } from './components/ContractSettingsModal';
import type { Bounty } from './types';
import { DEMO_SCENARIOS, DEFAULT_CONTRACT_ADDRESS } from './types';
import { setupWalletListeners, autoCheckWalletConnection, saveWalletState } from './utils/web3';
import { readBountiesFromChain, type GenLayerNetwork } from './utils/genlayer';
import { ShieldCheck, Filter, Sparkles, Terminal as TerminalIcon, RefreshCw, Plus, Play, Info } from 'lucide-react';

export default function App() {
  // Mode: 'DEMO' for instant 1-click interactive test bench, 'RPC' for live contract connection
  const [mode, setMode] = useState<'DEMO' | 'RPC'>('DEMO');
  const [bounties, setBounties] = useState<Bounty[]>(DEMO_SCENARIOS);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'EVALUATING' | 'CLOSED' | 'ESCALATED'>('ALL');
  
  // Real Web3 Wallet State (starts clean, auto-connects to MetaMask if user authorized)
  const [account, setAccount] = useState<string>('');
  const [providerName, setProviderName] = useState<string>('');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // GenLayer Contract & Network State
  const [contractAddress, setContractAddress] = useState<string>(DEFAULT_CONTRACT_ADDRESS);
  const [network, setNetwork] = useState<GenLayerNetwork>('testnetAsimov');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFetchingContract, setIsFetchingContract] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedBountyId, setSelectedBountyId] = useState<string>('');
  const [isCodeOpen, setIsCodeOpen] = useState(false);

  // Terminal state
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalBounty, setTerminalBounty] = useState<Bounty | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Auto-connect wallet on page load if user previously authorized MetaMask
  useEffect(() => {
    autoCheckWalletConnection().then(({ address, providerName: prov }) => {
      if (address) {
        setAccount(address);
        setProviderName(prov);
      }
    });

    const cleanup = setupWalletListeners((newAccount) => {
      if (newAccount) {
        setAccount(newAccount);
        setProviderName('MetaMask');
      } else {
        setAccount('');
        setProviderName('');
      }
    });
    return cleanup;
  }, []);

  // Fetch bounties when in RPC mode
  const fetchBounties = async () => {
    if (mode !== 'RPC' || !contractAddress) return;
    setIsFetchingContract(true);
    try {
      const data = await readBountiesFromChain(contractAddress, network);
      setBounties(data);
    } catch (err: any) {
      console.warn('GenLayer Testnet RPC fetch warning:', err);
    } finally {
      setIsFetchingContract(false);
    }
  };

  useEffect(() => {
    if (mode === 'RPC') {
      fetchBounties();
    } else {
      setBounties(DEMO_SCENARIOS);
    }
  }, [mode, contractAddress, network]);

  const handleAccountConnected = (address: string, name: string) => {
    setAccount(address);
    setProviderName(name);
    saveWalletState(address, name);
  };

  const handleSaveSettings = (newAddress: string, newNetwork: GenLayerNetwork) => {
    setContractAddress(newAddress);
    setNetwork(newNetwork);
    setMode('RPC');
  };

  const handleCreateBounty = (codeUrl: string, focusArea: string, amount: string) => {
    const newBounty: Bounty = {
      id: (bounties.length + 1).toString(),
      owner: account || '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7',
      whitehat: '0x0000000000000000000000000000000000000000',
      reward_amount: (BigInt(amount) * BigInt(10 ** 18)).toString(),
      code_url: codeUrl,
      focus_area: focusArea,
      report_url: '',
      status: 'OPEN',
      ai_verdict: '',
      ai_reason: '',
      confidence: '0',
    };
    setBounties([newBounty, ...bounties]);
  };

  const handleSubmitReport = (bountyId: string, reportUrl: string) => {
    setBounties(
      bounties.map((b) => {
        if (b.id === bountyId) {
          return {
            ...b,
            whitehat: account || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            report_url: reportUrl,
            status: 'EVALUATING',
          };
        }
        return b;
      })
    );
  };

  const handleTriggerAdjudication = (bountyId: string) => {
    const target = bounties.find((b) => b.id === bountyId);
    if (!target) return;

    setTerminalBounty(target);
    setIsSimulating(true);
    setIsTerminalOpen(true);
  };

  const handleFinishedSim = () => {
    if (!terminalBounty) return;
    setBounties((prev) =>
      prev.map((b) => {
        if (b.id === terminalBounty.id) {
          return {
            ...b,
            status: 'CLOSED',
            ai_verdict: 'PAYOUT',
            ai_reason: 'GenVM Senior Security Auditor confirmed valid high-severity vulnerability in target codebase. 100% Escrow disbursed to Whitehat.',
            confidence: '96',
          };
        }
        return b;
      })
    );
  };

  const handleViewLogs = (bounty: Bounty) => {
    setTerminalBounty(bounty);
    setIsSimulating(false);
    setIsTerminalOpen(true);
  };

  const filteredBounties = bounties.filter((b) => {
    if (filter === 'ALL') return true;
    return b.status === filter;
  });

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 selection:bg-emerald-500 selection:text-slate-950 font-mono">
      {/* Header */}
      <Header
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenCode={() => setIsCodeOpen(true)}
        account={account}
        providerName={providerName}
        onOpenWalletModal={() => setIsWalletModalOpen(true)}
        contractAddress={contractAddress}
        network={network}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Cyberpunk Banner */}
        <div className="relative bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 mb-6 overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.1)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>POWERED BY GENLAYER GENVM AI CONSENSUS</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100 uppercase tracking-tight leading-tight">
              Decentralized <span className="text-emerald-400">Bug Bounty Court</span>
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 font-mono mt-3 leading-relaxed">
              Escrow Smart Contracts secured by AI non-deterministic consensus. Project owners lock reward tokens. Whitehats submit exploit reports. GenVM AI reads code & verifies findings automatically without human gatekeepers.
            </p>

            <div className="flex flex-wrap gap-4 mt-6 text-xs text-slate-400">
              <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>404 Anti-Rugpull & Anti-Spam Guard</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <TerminalIcon className="w-4 h-4 text-emerald-400" />
                <span>Strict Verdict Consensus</span>
              </div>
            </div>
          </div>
        </div>

        {/* MODE SWITCH BENCH (FOR EASY HACKATHON TESTING & LIVE RPC) */}
        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-4 mb-8 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Play className="w-5 h-5 fill-emerald-400" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100 uppercase flex items-center space-x-2">
                  <span>Test Bench Environment:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${mode === 'DEMO' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/50' : 'bg-cyan-950 text-cyan-400 border border-cyan-500/50'}`}>
                    {mode === 'DEMO' ? '🧪 Interactive Demo Mode' : '🌐 Connected Contract RPC Mode'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {mode === 'DEMO'
                    ? 'Pre-loaded with 4 realistic bug bounty scenarios (Reentrancy, Spam Report, 404 Guard, Precision Loss). Test GenVM AI adjudication with 1-click!'
                    : 'Reading contract state directly from GenLayer Testnet RPC address.'}
                </p>
              </div>
            </div>

            {/* Mode Switcher Buttons */}
            <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setMode('DEMO')}
                className={`px-3 py-1.5 rounded font-bold transition-all ${
                  mode === 'DEMO'
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🧪 Interactive Demo Mode
              </button>
              <button
                onClick={() => {
                  if (!contractAddress) setIsSettingsOpen(true);
                  setMode('RPC');
                }}
                className={`px-3 py-1.5 rounded font-bold transition-all ${
                  mode === 'RPC'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌐 Connect Contract RPC
              </button>
            </div>
          </div>

          {/* Quick Guide Step-by-Step for Judges */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <Info className="w-4 h-4" />
              <span>How to Test AuditorShield in 3 Simple Steps:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
              <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                <span className="text-emerald-400 font-bold block mb-1">1. Post a Bug Bounty</span>
                <p className="text-slate-400">Click <strong>"Post Bug Bounty"</strong> at the top right to lock GEN rewards and target code URL.</p>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                <span className="text-cyan-400 font-bold block mb-1">2. Submit Report</span>
                <p className="text-slate-400">Click <strong>"Submit Vulnerability Report"</strong> on Bounty #1 or #3 to enter whitehat exploit link.</p>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                <span className="text-emerald-400 font-bold block mb-1">3. Trigger GenVM AI</span>
                <p className="text-slate-400">Click <strong>"Trigger GenVM AI Adjudicate"</strong> to watch the live hacker terminal audit code & disburse funds!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <StatsOverview bounties={bounties} />

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span>Filter Bounties:</span>
          </div>

          <div className="flex items-center space-x-3">
            {isFetchingContract && (
              <span className="text-xs text-cyan-400 flex items-center space-x-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing RPC...</span>
              </span>
            )}

            <div className="flex flex-wrap gap-2 text-xs">
              {(['ALL', 'OPEN', 'EVALUATING', 'CLOSED', 'ESCALATED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1.5 rounded-lg font-mono transition-all border ${
                    filter === status
                      ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {status} ({bounties.filter((b) => status === 'ALL' || b.status === status).length})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bounty Cards List / Clean Empty State */}
        <div>
          {filteredBounties.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase">No Bounties Match Filter</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Click "Post Bug Bounty" to create a new bounty card or reset filter.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center space-x-2 px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Post New Bug Bounty</span>
              </button>
            </div>
          ) : (
            filteredBounties.map((bounty) => (
              <BountyCard
                key={bounty.id}
                bounty={bounty}
                onSubmitReport={(id) => {
                  setSelectedBountyId(id);
                  setIsReportOpen(true);
                }}
                onAdjudicate={handleTriggerAdjudication}
                onViewLogs={handleViewLogs}
              />
            ))
          )}
        </div>
      </main>

      {/* Modals */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        currentAccount={account}
        onAccountConnected={handleAccountConnected}
      />

      <ContractSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        contractAddress={contractAddress}
        network={network}
        onSaveSettings={handleSaveSettings}
      />

      <CreateBountyModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateBounty}
      />

      <SubmitReportModal
        isOpen={isReportOpen}
        bountyId={selectedBountyId}
        onClose={() => setIsReportOpen(false)}
        onSubmit={handleSubmitReport}
      />

      <TerminalAdjudicationModal
        isOpen={isTerminalOpen}
        bounty={terminalBounty}
        isSimulating={isSimulating}
        onClose={() => setIsTerminalOpen(false)}
        onFinishedSim={handleFinishedSim}
      />

      <ContractCodeModal
        isOpen={isCodeOpen}
        onClose={() => setIsCodeOpen(false)}
      />
    </div>
  );
}
