# AuditorShield — Decentralized Bug Bounty Court 🛡️⚡

> **Hackathon Submission Category:** GenLayer Builder Track (Full-Stack Intelligent dApp)  
> **Smart Contract Language:** GenLayer Python (`py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`)  
> **Frontend Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, GenLayer JS SDK  

---

## 🚀 Executive Summary

Existing Web3 Bug Bounty platforms (such as Immunefi) rely on human triagers to manually verify submitted vulnerability reports against complex smart contract code bases. This manual process is slow, expensive, and centralized. However, fully decentralized bug bounty escrows risk being flooded with spam or AI-hallucinated reports.

**AuditorShield** solves this by leveraging **GenLayer GenVM AI Consensus**. It creates a decentralized Escrow & Court platform where:
1. **Project Owners** lock GEN token rewards into smart escrow and provide target source code URLs (GitHub / Gist).
2. **Whitehat Hackers** submit vulnerability report URLs detailing exploit vectors.
3. **GenVM AI (Acting as Senior Security Auditor)** autonomously renders the live code (`gl.nondet.web.render`), reads the report, and adjudicates validity (`gl.nondet.exec_prompt`).
4. **On-Chain Settlement**: Rewards are disbursed automatically based on strict Leader-Validator consensus.

---

## 🏆 Why AuditorShield Wins the Builder Track

Evaluating whether a complex security report accurately identifies a vulnerability in smart contract source code is **inherently subjective and non-deterministic**. This makes it an ideal showcase for GenLayer's core superpowers:
- 🌐 **Web Access (`gl.nondet.web.render`)**: Live fetching of GitHub code repositories and Markdown vulnerability reports directly within consensus execution.
- 🧠 **AI Reasoning (`gl.nondet.exec_prompt`)**: LLM acts as an impartial Senior Security Auditor evaluating AST structures, reentrancy vectors, access control, and mathematical invariants.
- 🔒 **404 Anti-Exploit Protection**:
  - **Anti-Rugpull (Protect Whitehat)**: If a Project Owner deletes target code during evaluation, GenVM AI automatically returns `ESCALATE` to prevent stealing whitehat research.
  - **Anti-Spam (Protect Owner)**: If a Whitehat submits a 404 dead link, GenVM AI automatically `REJECTS` and resets the bounty to `OPEN`.
- ⚡ **Strict Verdict Consensus**: Leader and Validator nodes reach consensus by strictly comparing core verdicts (`PAYOUT`, `PARTIAL`, `REJECT`, `ESCALATE`), effectively ignoring minor LLM text formulation differences.

---

## 📂 Repository Architecture

```
AuditorShield/
├── contracts/
│   └── AuditorShield.py          # GenLayer Intelligent Contract (v0.2.16)
├── scripts/
│   └── deploy.py                 # CLI & Python deployment utility
├── tests/
│   └── test_auditor_shield.py    # Unit test suite verifying contract state & 404 protection
├── frontend/                     # Full Cyberpunk Security Dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx                    # Brand Navbar & Wallet state
│   │   │   ├── StatsOverview.tsx             # Risk & Escrow metrics
│   │   │   ├── BountyCard.tsx                # Interactive Bounty item with AI Verdict
│   │   │   ├── CreateBountyModal.tsx         # Deposit GEN & lock code scope
│   │   │   ├── SubmitReportModal.tsx         # Submit Vulnerability Report URL
│   │   │   ├── TerminalAdjudicationModal.tsx # Live GenVM AI Hacker Terminal
│   │   │   └── ContractCodeModal.tsx         # In-dApp Intelligent Contract source viewer
│   │   ├── types.ts                          # TypeScript interfaces & mock data
│   │   ├── App.tsx                           # Main Dashboard App
│   │   └── main.tsx                          # Entry point
│   ├── package.json                          # Vite + React + Tailwind + GenLayer JS SDK
│   └── vite.config.ts                        # Vite configuration
└── README.md                         # Builder Track Submission Documentation
```

---

## 💻 Intelligent Contract Specification (`AuditorShield.py`)

### Core State & Types
```python
@allow_storage
@dataclass
class Bounty:
    owner: Address
    whitehat: Address
    reward_amount: bigint
    code_url: str          # Target GitHub/Gist code URL
    focus_area: str        # Security scope focus
    report_url: str        # Whitehat vulnerability report URL
    status: str            # OPEN, EVALUATING, CLOSED, ESCALATED
    ai_verdict: str        # PAYOUT, PARTIAL, REJECT, ESCALATE
    ai_reason: str         # AI technical justification
    confidence: bigint     # AI confidence score (0-100)
```

### Public Methods
- `create_bounty(code_url: str, focus_area: str) -> str`: Deposit GEN reward into escrow vault.
- `submit_report(bounty_id: str, report_url: str) -> None`: Whitehat submits vulnerability report link.
- `adjudicate_report(bounty_id: str) -> None`: GenVM AI Leader-Validator non-deterministic evaluation & automatic payout disbursement.
- `get_all_bounties() -> str`: View method for frontend rendering.

---

## ⚡ Quickstart Guide for Judges

### 1. Run Unit Tests
```bash
python tests/test_auditor_shield.py
```
*Expected Output:*
```
[OK] Test Passed: Bounty Creation Validation
[OK] Test Passed: Anti-404 Dead Link Protection
[OK] Test Passed: Verdict-Only Consensus Matching
[OK] All AuditorShield tests passed successfully!
```

### 2. Deploy via GenLayer CLI
```bash
# Start GenLayer localnet simulator
genlayer up

# Deploy Intelligent Contract
genlayer deploy contracts/AuditorShield.py
```

### 3. Launch Frontend DApp
```bash
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎨 Cyberpunk DApp Design System

- **Vibe**: Dark Mode (`#07090e`), Neon Green (`#10b981`), Cyber Cyan (`#06b6d4`), Rose Alert (`#f43f5e`).
- **Font**: Monospace `JetBrains Mono` / `Fira Code`.
- **Hacker Terminal**: Real-time simulated execution logs streaming AI reasoning steps (`Analyzing AST...`, `Rendering Target Code...`, `Emitting Consensus Verdict...`).

---

## 📄 License & Hackathon Submission

Built with ❤️ for **GenLayer Hackathon — Builder Track**.
