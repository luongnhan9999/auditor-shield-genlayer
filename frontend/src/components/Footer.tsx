import React from 'react';
import { Shield, ExternalLink, Cpu, Heart, Sparkles, Terminal, Code2, Lock, GitBranch } from 'lucide-react';

interface FooterProps {
  contractAddress: string;
}

export const Footer: React.FC<FooterProps> = ({ contractAddress }) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 font-mono mt-16 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Col 1: Brand & Core Mission */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-slate-100 text-sm tracking-wider uppercase">
                Auditor<span className="text-emerald-400">Shield</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Decentralized Bug Bounty Court powered by GenLayer GenVM AI Consensus. Autonomous smart contract vulnerability triage and escrow settlement.
            </p>
            <div className="flex items-center space-x-2 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded w-fit">
              <Sparkles className="w-3 h-3" />
              <span>GenLayer Builder Track Submission</span>
            </div>
          </div>

          {/* Col 2: GenLayer Architecture */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-bold uppercase text-[11px] flex items-center space-x-1.5 text-emerald-400">
              <Cpu className="w-3.5 h-3.5" />
              <span>GenVM Superpowers</span>
            </h4>
            <ul className="space-y-2 text-[11px] text-slate-400">
              <li className="flex items-center space-x-1.5">
                <Code2 className="w-3 h-3 text-cyan-400" />
                <span><code className="text-cyan-300">gl.nondet.web.render</code> Web Fetch</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Terminal className="w-3 h-3 text-emerald-400" />
                <span><code className="text-emerald-300">gl.nondet.exec_prompt</code> Senior Auditor</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Lock className="w-3 h-3 text-rose-400" />
                <span>404 Anti-Rugpull & Anti-Spam Guard</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <Shield className="w-3 h-3 text-amber-400" />
                <span>Strict Verdict Consensus</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Deployed Contracts & Explorer */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-bold uppercase text-[11px] flex items-center space-x-1.5 text-emerald-400">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>On-Chain Resources</span>
            </h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <span className="text-slate-500 block text-[10px]">GenLayer Studionet Contract:</span>
                <a
                  href={`https://genlayer-explorer.vercel.app/address/${contractAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline break-all font-mono"
                >
                  {contractAddress.substring(0, 10)}...{contractAddress.substring(contractAddress.length - 8)}
                </a>
              </li>
              <li>
                <a
                  href="https://genlayer-explorer.vercel.app"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-300 hover:text-emerald-400 flex items-center space-x-1 transition-all"
                >
                  <span>GenLayer Block Explorer</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://genlayer.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-300 hover:text-emerald-400 flex items-center space-x-1 transition-all"
                >
                  <span>GenLayer Official Website</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Developer & Social Profile */}
          <div className="space-y-3">
            <h4 className="text-slate-200 font-bold uppercase text-[11px] flex items-center space-x-1.5 text-emerald-400">
              <GitBranch className="w-3.5 h-3.5" />
              <span>Developer & Community</span>
            </h4>
            <div className="space-y-2 text-[11px]">
              <a
                href="https://github.com/luongnhan9999/auditor-shield-genlayer"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-2 rounded text-slate-200 transition-all group"
              >
                <GitBranch className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="font-bold block">GitHub Repository</span>
                  <span className="text-[10px] text-slate-400">auditor-shield-genlayer</span>
                </div>
              </a>

              <a
                href="https://github.com/luongnhan9999"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-2 text-slate-400 hover:text-emerald-400 transition-colors pt-1"
              >
                <span>Built by <strong className="text-slate-200 font-bold">@luongnhan9999</strong></span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-4">
          <p className="flex items-center space-x-1">
            <span>AuditorShield © 2026. Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for <strong>GenLayer Hackathon</strong>.</span>
          </p>
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">GenVM v0.2.16</span>
            <span className="text-emerald-400">• All Escrows Decentralized</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
