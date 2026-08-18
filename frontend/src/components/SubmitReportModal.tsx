import React, { useState } from 'react';
import { X, ShieldAlert, FileText, CheckCircle } from 'lucide-react';

interface SubmitReportModalProps {
  isOpen: boolean;
  bountyId: string;
  onClose: () => void;
  onSubmit: (bountyId: string, reportUrl: string) => void;
}

export const SubmitReportModal: React.FC<SubmitReportModalProps> = ({
  isOpen,
  bountyId,
  onClose,
  onSubmit,
}) => {
  const [reportUrl, setReportUrl] = useState('https://gist.github.com/whitehat/reentrancy_exploit_report.md');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportUrl) return;
    onSubmit(bountyId, reportUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-xl w-full max-w-lg overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-slate-100 text-sm uppercase">
              Submit Vulnerability Report (Bounty #{bountyId})
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-300 mb-1.5 font-semibold">
              Vulnerability Report URL (Gist / Markdown) *
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="url"
                required
                placeholder="https://gist.github.com/whitehat/report.md"
                value={reportUrl}
                onChange={(e) => setReportUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-lg pl-9 pr-3 py-2 text-xs text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Provide a detailed report outlining root cause, affected functions, and proof of concept (POC).
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center space-x-1 text-cyan-400 font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Anti-Spam & Anti-Rugpull Protocol Active</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>If report URL gives 404 dead link, GenVM AI automatically REJECTS.</li>
              <li>If target code is deleted by owner (404), GenVM AI ESCALATES to protect Whitehat.</li>
              <li>Spam / AI hallucinated reports will be REJECTED instantly.</li>
            </ul>
          </div>

          {/* Buttons */}
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
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all active:scale-95"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
