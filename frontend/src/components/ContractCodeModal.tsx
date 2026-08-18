import React, { useState } from 'react';
import { X, Copy, Check, Code2, Sparkles } from 'lucide-react';

interface ContractCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CONTRACT_CODE = `# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
from dataclasses import dataclass
import json

@allow_storage
@dataclass
class Bounty:
    owner: Address
    whitehat: Address
    reward_amount: bigint
    code_url: str          # Link GitHub/Gist chứa code cần audit
    focus_area: str        # Ví dụ: "Focus on reentrancy and math overflows"
    report_url: str        # Link báo cáo lỗi của Hacker
    status: str            # OPEN, CLAIMED, EVALUATING, CLOSED, ESCALATED
    ai_verdict: str
    ai_reason: str
    confidence: bigint

class Contract(gl.Contract):
    bounties: TreeMap[str, Bounty]
    next_bounty_id: bigint
    platform_admin: str

    def __init__(self):
        self.next_bounty_id = bigint(1)
        self.platform_admin = str(gl.message.sender_address).lower()

    @gl.public.write.payable
    def create_bounty(self, code_url: str, focus_area: str) -> str:
        """Chủ dự án tạo Bug Bounty và khóa tiền thưởng"""
        amount = gl.message.value
        if amount <= bigint(0):
            raise UserError("Bounty reward must be greater than 0")
        if not code_url.startswith("http"):
            raise UserError("Valid code URL required")

        bounty_id = str(self.next_bounty_id)
        self.next_bounty_id += bigint(1)

        self.bounties[bounty_id] = Bounty(
            owner=gl.message.sender_address,
            whitehat=Address("0x0000000000000000000000000000000000000000"),
            reward_amount=amount,
            code_url=code_url,
            focus_area=focus_area,
            report_url="",
            status="OPEN",
            ai_verdict="",
            ai_reason="",
            confidence=bigint(0)
        )
        return bounty_id

    @gl.public.write
    def submit_report(self, bounty_id: str, report_url: str) -> None:
        """Hacker nộp báo cáo lỗi"""
        if bounty_id not in self.bounties:
            raise UserError("Bounty does not exist")
        
        bounty = self.bounties[bounty_id]
        if bounty.status != "OPEN":
            raise UserError("Bounty is not open for submissions")
        if gl.message.sender_address == bounty.owner:
            raise UserError("Owner cannot submit report to own bounty")
        if not report_url.startswith("http"):
            raise UserError("Valid report URL required")

        bounty.whitehat = gl.message.sender_address
        bounty.report_url = report_url
        bounty.status = "EVALUATING"
        self.bounties[bounty_id] = bounty

    @gl.public.write
    def adjudicate_report(self, bounty_id: str) -> None:
        """AI tự động đánh giá báo cáo bảo mật và giải ngân"""
        bounty = self.bounties[bounty_id]

        def leader_fn():
            # 1. Protection against Owner code deletion (Protect Whitehat)
            code_res = gl.nondet.web.render(bounty.code_url, mode="text")
            if any(err in str(code_res)[:400].lower() for err in ["404 not found", "error 404"]):
                return {"verdict": "ESCALATE", "confidence": 100, "reason": "Target code 404 dead link"}

            # 2. Protection against Whitehat spam report (Protect Owner)
            report_res = gl.nondet.web.render(bounty.report_url, mode="text")
            if any(err in str(report_res)[:400].lower() for err in ["404 not found", "error 404"]):
                return {"verdict": "REJECT", "confidence": 100, "reason": "Report 404 dead link"}

            prompt = f"..." # Senior Security Auditor Prompt
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def validator_fn(leader_res) -> bool:
            mine_data = leader_fn()
            return str(leader_data.get("verdict")).upper() == str(mine_data.get("verdict")).upper()

        result = gl.vm.run_nondet(leader_fn, validator_fn)
        # Disburse funds based on verdict: PAYOUT (100%), PARTIAL (25%), REJECT (Reset), ESCALATE
`;

export const ContractCodeModal: React.FC<ContractCodeModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(CONTRACT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-xl w-full max-w-3xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.15)] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Code2 className="w-5 h-5" />
            <h3 className="font-bold text-slate-100 text-sm uppercase">
              AuditorShield.py — Intelligent Contract Source
            </h3>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Highlights */}
        <div className="bg-slate-950/90 border-b border-slate-800 p-4 text-xs space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Why GenLayer Fit is 100% Exceptional for AuditorShield</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Evaluating whether a security vulnerability report matches target smart contract code is subjective and complex.
            AuditorShield leverages <code className="text-emerald-400">gl.nondet.web.render</code> to fetch live code & report links, and <code className="text-emerald-400">gl.nondet.exec_prompt</code> to adjudicate findings without centralized human intermediaries.
          </p>
        </div>

        {/* Code Content */}
        <div className="p-5 bg-slate-950 text-emerald-400 text-xs overflow-y-auto flex-1 font-mono leading-relaxed">
          <pre>{CONTRACT_CODE}</pre>
        </div>
      </div>
    </div>
  );
};
