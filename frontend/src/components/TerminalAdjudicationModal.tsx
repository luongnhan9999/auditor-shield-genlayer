import React, { useEffect, useState } from 'react';
import { Terminal as TerminalIcon, X } from 'lucide-react';
import type { Bounty } from '../types';

interface TerminalAdjudicationModalProps {
  isOpen: boolean;
  bounty: Bounty | null;
  isSimulating: boolean;
  onClose: () => void;
  onFinishedSim?: () => void;
}

export const TerminalAdjudicationModal: React.FC<TerminalAdjudicationModalProps> = ({
  isOpen,
  bounty,
  isSimulating,
  onClose,
  onFinishedSim,
}) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen || !bounty) return;

    if (!isSimulating) {
      // Historical log view
      setLogs([
        `[SYSTEM] Historical GenVM Adjudication Log for Bounty #${bounty.id}`,
        `[CONTRACT] Address: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`,
        `[GENVM] Code Target: ${bounty.code_url}`,
        `[GENVM] Report Source: ${bounty.report_url || 'N/A'}`,
        `[404-GUARD] Code status: HTTP 200 OK | Report status: ${bounty.report_url ? 'HTTP 200 OK' : 'EMPTY'}`,
        `[CONSENSUS] Leader-Validator Verdict Agreement: TRUE`,
        `----------------------------------------------------------------------`,
        `[VERDICT] ${bounty.ai_verdict || 'PENDING'}`,
        `[CONFIDENCE] ${bounty.confidence}%`,
        `[REASON] ${bounty.ai_reason || 'No evaluation performed yet.'}`,
        `[STATUS] Contract state transitioned to: ${bounty.status}`,
      ]);
      setProgress(100);
      return;
    }

    // Live AI Simulation steps
    setLogs([]);
    setProgress(0);

    const simulationSteps = [
      `[00:01] [+] GenVM Invocation: gl.public.write.adjudicate_report(bounty_id="${bounty.id}")`,
      `[00:02] [+] Connecting to Leader Node & Validator Consensus Pool...`,
      `[00:03] [+] Fetching Target Code: gl.nondet.web.render("${bounty.code_url}", mode="text")...`,
      `[00:04] [✔] 404 Guard Check Passed: Code source online & verified.`,
      `[00:05] [+] Fetching Vulnerability Report: gl.nondet.web.render("${bounty.report_url}", mode="text")...`,
      `[00:06] [✔] 404 Guard Check Passed: Report document retrieved.`,
      `[00:07] [⚡] Constructing Prompt for Senior Security Auditor AI...`,
      `[00:08] [⚡] Executing gl.nondet.exec_prompt(response_format="json")...`,
      `[00:10] [🧠] AI Analyzing AST, reentrancy vectors, access control & mathematical invariants...`,
      `[00:12] [🧠] Cross-referencing reported exploit claim against target Solidity codebase...`,
      `[00:14] [✔] Leader Verdict Generated: PAYOUT (Confidence: 96%)`,
      `[00:16] [+] Running Validator Node Check: validator_fn(leader_res)...`,
      `[00:17] [✔] Leader-Validator Consensus Achieved! Verdict Match: True`,
      `[00:18] [💰] Executing Escrow Payout: gl.get_contract_at(whitehat).emit_transfer(value=u256(${bounty.reward_amount}))`,
      `[00:19] [STATUS] Bounty #${bounty.id} status updated to CLOSED. Escrow disbursed.`,
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < simulationSteps.length) {
        setLogs((prev) => [...prev, simulationSteps[currentStep]]);
        currentStep++;
        setProgress(Math.round((currentStep / simulationSteps.length) * 100));
      } else {
        clearInterval(interval);
        if (onFinishedSim) onFinishedSim();
      }
    }, 450);

    return () => clearInterval(interval);
  }, [isOpen, bounty, isSimulating]);

  if (!isOpen || !bounty) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 font-mono">
      <div className="bg-slate-950 border border-emerald-500/50 rounded-xl w-full max-w-3xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.2)]">
        {/* Terminal Titlebar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-emerald-900/60">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400">
              <TerminalIcon className="w-4 h-4 text-emerald-400" />
              <span>GENVM_AI_AUDITOR_TERMINAL // BOUNTY #{bounty.id}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Terminal Body */}
        <div className="p-5 bg-slate-950 font-mono text-xs text-emerald-400 min-h-[360px] max-h-[480px] overflow-y-auto space-y-2 leading-relaxed">
          {/* Progress bar */}
          {isSimulating && (
            <div className="mb-4 bg-slate-900 border border-emerald-900/50 rounded p-2">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>GENVM NON-DETERMINISTIC CONSENSUS RUNNING</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-emerald-900/50">
                <div
                  className="bg-emerald-400 h-full transition-all duration-300 shadow-[0_0_10px_#10b981]"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {logs.map((log, idx) => (
            <div
              key={idx}
              className={`leading-relaxed ${
                log.includes('PAYOUT')
                  ? 'text-emerald-300 font-bold bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/30'
                  : log.includes('REJECT')
                  ? 'text-rose-400 font-bold bg-rose-950/40 px-2 py-1 rounded border border-rose-500/30'
                  : log.includes('ESCALATE')
                  ? 'text-amber-400 font-bold bg-amber-950/40 px-2 py-1 rounded border border-amber-500/30'
                  : 'text-slate-300'
              }`}
            >
              {log}
            </div>
          ))}

          {isSimulating && progress < 100 && (
            <div className="flex items-center space-x-2 text-emerald-400 animate-pulse pt-2">
              <span className="w-2 h-4 bg-emerald-400 inline-block"></span>
              <span>Evaluating non-deterministic Web & AI prompts...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900 border-t border-emerald-900/60 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            Consensus Mechanism: Verdict Comparison Only (Ignores minor text drift)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-xs transition-all"
          >
            Close Terminal
          </button>
        </div>
      </div>
    </div>
  );
};
