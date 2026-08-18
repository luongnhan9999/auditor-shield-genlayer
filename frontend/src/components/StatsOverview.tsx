import React from 'react';
import { Lock, FileCode, Cpu, AlertTriangle } from 'lucide-react';
import type { Bounty } from '../types';

interface StatsOverviewProps {
  bounties: Bounty[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ bounties }) => {
  const totalLockedGEN = bounties
    .reduce((acc, b) => acc + BigInt(b.reward_amount || '0'), BigInt(0)) / BigInt(10 ** 18);

  const activeBounties = bounties.filter((b) => b.status === 'OPEN').length;
  const evaluatingBounties = bounties.filter((b) => b.status === 'EVALUATING').length;
  const closedBounties = bounties.filter((b) => b.status === 'CLOSED').length;
  const escalatedBounties = bounties.filter((b) => b.status === 'ESCALATED').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Total Escrow */}
      <div className="bg-slate-900/60 border border-emerald-900/40 rounded-lg p-4 relative overflow-hidden">
        <div className="absolute right-3 top-3 text-emerald-500/20">
          <Lock className="w-8 h-8" />
        </div>
        <p className="text-xs text-slate-400 font-mono">TOTAL ESCROW LOCKED</p>
        <div className="flex items-baseline space-x-2 mt-2">
          <span className="text-2xl font-bold font-mono text-emerald-400">
            {totalLockedGEN.toLocaleString()}
          </span>
          <span className="text-xs text-emerald-500 font-semibold font-mono">GEN</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 font-mono">Locked in GenVM Smart Escrow</p>
      </div>

      {/* Active Bounties */}
      <div className="bg-slate-900/60 border border-emerald-900/40 rounded-lg p-4 relative overflow-hidden">
        <div className="absolute right-3 top-3 text-cyan-500/20">
          <FileCode className="w-8 h-8" />
        </div>
        <p className="text-xs text-slate-400 font-mono">OPEN BOUNTIES</p>
        <div className="flex items-baseline space-x-2 mt-2">
          <span className="text-2xl font-bold font-mono text-slate-100">{activeBounties}</span>
          <span className="text-xs text-cyan-400 font-mono">({evaluatingBounties} evaluating)</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 font-mono">Awaiting Vulnerability Reports</p>
      </div>

      {/* AI Adjudicated */}
      <div className="bg-slate-900/60 border border-emerald-900/40 rounded-lg p-4 relative overflow-hidden">
        <div className="absolute right-3 top-3 text-emerald-500/20">
          <Cpu className="w-8 h-8" />
        </div>
        <p className="text-xs text-slate-400 font-mono">GENVM VERDICTS</p>
        <div className="flex items-baseline space-x-2 mt-2">
          <span className="text-2xl font-bold font-mono text-emerald-400">{closedBounties}</span>
          <span className="text-xs text-slate-400 font-mono">Settled automatically</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 font-mono">Strict Leader-Validator Consensus</p>
      </div>

      {/* Escalated */}
      <div className="bg-slate-900/60 border border-emerald-900/40 rounded-lg p-4 relative overflow-hidden">
        <div className="absolute right-3 top-3 text-amber-500/20">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <p className="text-xs text-slate-400 font-mono">ESCALATED COURT</p>
        <div className="flex items-baseline space-x-2 mt-2">
          <span className="text-2xl font-bold font-mono text-amber-400">{escalatedBounties}</span>
          <span className="text-xs text-amber-500/80 font-mono">Human Jury required</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 font-mono">Confidence &lt; 65% or complex audit</p>
      </div>
    </div>
  );
};
