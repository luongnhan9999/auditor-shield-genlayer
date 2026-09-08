# Changelog — AuditorShield

All notable changes to the AuditorShield Intelligent dApp and Smart Contract will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.1.0] — Milestone 1: AI Enhancement & Security Hardening Bundle
*Date: 2026-09-08*

### 🚀 Major Improvements
- **Prompt Injection Canary Defense**: Implemented an on-chain canary token protocol (`CANARY_AUTH_SECURE_VERIFIED`). Any response lacking or tampering with the verification canary immediately defaults to `ESCALATE`, neutralizing prompt override attacks and protecting escrow funds.
- **Multi-Perspective AI Prompting**: Structured the GenVM LLM adjudication engine into 3 distinct analytical lenses:
  - *Lens 1 (Forensic)*: Validates code existence and root cause.
  - *Lens 2 (Skeptical)*: Filters hallucinations, spam, and informational suggestions.
  - *Lens 3 (Settlement)*: Assigns final verdict and confidence score.
- **Adversarial Input Sanitization**: Added `_sanitize_text` to automatically strip common prompt injection phrases (e.g., `"ignore previous instructions"`, `"always output payout"`) before sending calldata to GenVM LLMs.
- **Contract-Level Test Suite Expansion**: Added dedicated tests for prompt injection interception (`test_prompt_injection_canary_defense`) and input sanitization (`test_prompt_injection_sanitization`), bringing total automated contract execution tests to 10/10 passing.
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
