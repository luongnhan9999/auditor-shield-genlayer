import React from 'react';
import { ExternalLink, Cpu, CheckCircle2, XCircle, AlertCircle, HelpCircle, Terminal, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { Bounty } from '../types';
import { safeFormatGen } from '../utils/format';

interface BountyCardProps {
  bounty: Bounty;
  onSubmitReport: (bountyId: string) => void;
  onAdjudicate: (bountyId: string) => void;
  onViewLogs: (bounty: Bounty) => void;
}

export const BountyCard: React.FC<BountyCardProps> = ({
  bounty,
  onSubmitReport,
  onAdjudicate,
  onViewLogs,
}) => {
  const genAmount = safeFormatGen(bounty.reward_amount);

  const getStatusBadge = () => {
    switch (bounty.status) {
      case 'OPEN':
        return (
          <span className="px-2.5 py-1 text-xs font-mono rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-semibold flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1"></span>
            OPEN FOR WHITEHATS
          </span>
        );
      case 'EVALUATING':
        return (
          <span className="px-2.5 py-1 text-xs font-mono rounded-full bg-cyan-950 border border-cyan-500/50 text-cyan-400 font-semibold flex items-center space-x-1">
            <Cpu className="w-3.5 h-3.5 animate-spin mr-1 text-cyan-400" />
            AI EVALUATING
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2.5 py-1 text-xs font-mono rounded-full bg-slate-900 border border-slate-700 text-slate-400 font-semibold">
            CLOSED / SETTLED
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="px-2.5 py-1 text-xs font-mono rounded-full bg-amber-950 border border-amber-500/50 text-amber-400 font-semibold flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            ESCALATED TO COURT
          </span>
        );
      default:
        return null;
    }
  };

  const getVerdictBadge = () => {
    if (!bounty.ai_verdict) return null;

    switch (bounty.ai_verdict) {
      case 'PAYOUT':
        return (
          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-lg p-3 mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-400 font-mono font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>GENVM VERDICT: PAYOUT (100% REWARD DISBURSED)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-200">
                Confidence: {bounty.confidence}%
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-2 leading-relaxed">
              {bounty.ai_reason}
            </p>
          </div>
        );
      case 'PARTIAL':
        return (
          <div className="bg-amber-950/60 border border-amber-500/40 rounded-lg p-3 mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-400 font-mono font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>GENVM VERDICT: PARTIAL (25% CONSOLATION / 75% REFUND)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900/80 text-amber-200">
                Confidence: {bounty.confidence}%
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-2 leading-relaxed">
              {bounty.ai_reason}
            </p>
          </div>
        );
      case 'REJECT':
        return (
          <div className="bg-rose-950/60 border border-rose-500/40 rounded-lg p-3 mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-rose-400 font-mono font-bold text-xs">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>GENVM VERDICT: REJECTED (SPAM / HALLUCINATION DETECTED)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/80 text-rose-200">
                Confidence: {bounty.confidence}%
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-2 leading-relaxed">
              {bounty.ai_reason}
            </p>
          </div>
        );
      case 'ESCALATE':
        return (
          <div className="bg-purple-950/60 border border-purple-500/40 rounded-lg p-3 mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-purple-400 font-mono font-bold text-xs">
                <HelpCircle className="w-4 h-4 text-purple-400" />
                <span>GENVM VERDICT: ESCALATED TO HUMAN COURT</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/80 text-purple-200">
                Confidence: {bounty.confidence}%
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-2 leading-relaxed">
              {bounty.ai_reason}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 transition-all shadow-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] mb-4">
      {/* Header info */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <span className="font-mono font-extrabold text-slate-400 text-sm">
              BOUNTY #{bounty.id}
            </span>
            {getStatusBadge()}
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Project Owner:{' '}
            <span className="text-slate-200">
              {bounty.owner.substring(0, 8)}...{bounty.owner.substring(bounty.owner.length - 6)}
            </span>
          </p>
        </div>

        {/* Reward */}
        <div className="text-right">
          <span className="text-xl font-bold font-mono text-emerald-400">{genAmount} GEN</span>
          <p className="text-[10px] text-slate-500 font-mono">Escrow Vault Reward</p>
        </div>
      </div>

      {/* Target Code & Focus Area */}
      <div className="mt-4 bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Target Code Base:</span>
          <a
            href={bounty.code_url}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 hover:underline flex items-center space-x-1 truncate max-w-md"
          >
            <span className="truncate">{bounty.code_url}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        </div>
        <div className="text-xs font-mono">
          <span className="text-slate-400 block mb-1">Focus Area & Vulnerability Scope:</span>
          <span className="text-slate-200 font-sans italic bg-slate-900/90 px-2.5 py-1 rounded block border border-slate-800">
            "{bounty.focus_area}"
          </span>
        </div>
      </div>

      {/* Report Info if available */}
      {bounty.report_url && (
        <div className="mt-3 bg-slate-950/40 border border-slate-800/60 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-cyan-400 font-semibold flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Whitehat Report:</span>
            </span>
            <a
              href={bounty.report_url}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center space-x-1 truncate max-w-sm"
            >
              <span className="truncate">{bounty.report_url}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Submitted by:{' '}
            <span className="text-slate-300">
              {bounty.whitehat.substring(0, 8)}...{bounty.whitehat.substring(bounty.whitehat.length - 6)}
            </span>
          </p>
        </div>
      )}

      {/* AI Verdict section */}
      {getVerdictBadge()}

      {/* Action Footer */}
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800">
        <button
          onClick={() => onViewLogs(bounty)}
          className="flex items-center space-x-1.5 text-xs font-mono text-slate-400 hover:text-emerald-400 transition-all"
        >
          <Terminal className="w-4 h-4 text-emerald-500" />
          <span>GenVM Execution Log</span>
        </button>

        <div className="flex items-center space-x-2">
          {bounty.status === 'OPEN' && (
            <button
              onClick={() => onSubmitReport(bounty.id)}
              className="px-3.5 py-1.5 text-xs font-mono font-bold rounded bg-cyan-950 border border-cyan-500/50 hover:bg-cyan-900 text-cyan-300 transition-all active:scale-95 flex items-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Submit Vulnerability Report</span>
            </button>
          )}

          {bounty.status === 'EVALUATING' && (
            <button
              onClick={() => onAdjudicate(bounty.id)}
              className="px-3.5 py-1.5 text-xs font-mono font-bold rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-all active:scale-95 flex items-center space-x-1.5"
            >
              <Cpu className="w-4 h-4 animate-spin" />
              <span>Trigger GenVM AI Adjudicate</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
