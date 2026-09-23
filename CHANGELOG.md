# Changelog — AuditorShield

All notable changes to the AuditorShield Intelligent dApp and Smart Contract will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.1.1] — Milestone Remediation & Invariant Hardening
*Date: 2026-09-23* (Remediation for Steward Joaquin Review)

### 🔒 Security & Invariant Hardening
- **Fail-Closed Runtime Time**: `_get_current_timestamp` now strictly parses `gl.message_raw["datetime"]` (ISO-8601 UTC) and immediately fails closed (`raise UserError("Trusted runtime time unavailable")`) if time is absent or malformed. Simulated fallback has been completely removed.
- **Strict Administrator Timelock Invariant**: Removed administrator bypass from `finalize_settlement()`. The 24-hour cooling-off window strictly applies to **all callers, including the platform administrator** (`now < bounty.payout_ready_at` reverts unconditionally).
- **Strict Deadline Boundary**: In `recover_stuck_funds()`, boundary condition `now <= bounty.deadline` is strictly enforced. Renders early reclamation attempts invalid at both `deadline - 1` and `deadline`, succeeding only strictly after `deadline + 1`.
- **Contract Test Suite Expanded to 15/15**: Added automated tests for:
  1. Early administrator release attempt (reverts during cooling-off window).
  2. Deadline boundary enforcement (`deadline - 1`, `deadline`, and `deadline + 1`).
  3. Unavailable/malformed runtime time fail-closed behavior.
- **Milestone Comparison Documentation**: Published `docs/MILESTONE_COMPARISON.md` comparing the immutable accepted snapshot (`v1.0.0-accepted`) with this milestone update (`v1.1.1`).

---

## [v1.1.0] — Milestone 1: AI Enhancement & Security Hardening Bundle
*Date: 2026-09-08*

### 🚀 Major Improvements
- **24-Hour Dispute Cooling-Off Window (`raise_dispute` & `finalize_settlement`)**: When AI adjudicates a bounty, funds are placed into an `AWAITING_PAYOUT` state locked for 24 hours (`payout_ready_at`), granting both project owner and whitehat the right to dispute before tokens leave escrow.
- **Un-truncated Full-Scope Evaluation**: Removed all hardcoded 2500-character string slicing; the GenVM LLM now evaluates the complete code file and submission report without truncation.
- **Stuck Fund Recovery (`recover_stuck_funds`)**: Project owners can reclaim 100% of their locked escrow if a bounty remains `OPEN` past its deadline, preventing permanent fund lock.
- **Prompt Injection Canary Defense**: Implemented an on-chain canary token protocol (`CANARY_AUTH_SECURE_VERIFIED`). Any response lacking or tampering with the verification canary immediately defaults to `ESCALATE`, neutralizing prompt override attacks and protecting escrow funds.
- **Multi-Perspective AI Prompting**: Structured the GenVM LLM adjudication engine into 3 distinct analytical lenses (Forensic Code Verification -> Skeptical Validation -> Settlement Determination).
- **Adversarial Input Sanitization**: Added `_sanitize_text` to automatically strip common prompt injection phrases before sending calldata to GenVM LLMs.
- **Immutable URL Revision Detection**: Added `_extract_pinned_hash` detecting 40-char commit SHAs or IPFS hashes, providing full support for permanent code references while remaining backwards-compatible.
- **Expanded Contract-Level Test Suite (12/12 Passing)**: Added tests for 24h dispute freeze, post-deadline stuck fund recovery, prompt injection interception, and input sanitization.
- **Security & Threat Model Documentation**: Published `SECURITY.md` detailing protocol threat vectors, mitigations, and mathematical solvency invariants.

---

## [v1.0.0] — Initial Accepted Project
*Date: 2026-08-22*

### Features
- Intelligent Contract written in GenLayer Python deployed to Studionet.
- Dual-mode Frontend (Demo Mode & Live RPC Mode) with EIP-1193 MetaMask signer integration.
- Anti-Rugpull web rendering guard (`gl.nondet.web.render`) and Anti-Spam filters.
- Zero-token-leak escrow settlement matrix (`PAYOUT`, `PARTIAL`, `REJECT`, `ESCALATE`).
- Admin escalation resolution pathway (`resolve_escalation`).
- Dynamic contract-level unit tests verifying storage changes, transfers, and rollbacks.
