export interface Bounty {
  id: string;
  owner: string;
  whitehat: string;
  reward_amount: string;
  code_url: string;
  focus_area: string;
  report_url: string;
  status: 'OPEN' | 'EVALUATING' | 'CLOSED' | 'ESCALATED';
  ai_verdict: 'PAYOUT' | 'PARTIAL' | 'REJECT' | 'ESCALATE' | '';
  ai_reason: string;
  confidence: string;
}

// Interactive Test Bench Scenarios (Showcases all 4 GenVM AI Verdicts for Judges)
export const DEMO_SCENARIOS: Bounty[] = [
  {
    id: "1",
    owner: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
    whitehat: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    reward_amount: "5000000000000000000000", // 5000 GEN
    code_url: "https://gist.github.com/defiprotocol/vault_reentrancy.sol",
    focus_area: "Focus on reentrancy attack vectors, vault drain, and state update ordering",
    report_url: "https://gist.github.com/whitehat/reentrancy_poc_exploit.md",
    status: "EVALUATING",
    ai_verdict: "",
    ai_reason: "",
    confidence: "0"
  },
  {
    id: "2",
    owner: "0x3C44CdD0d6678F0877AE2285758504DBB4723930",
    whitehat: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    reward_amount: "10000000000000000000000", // 10000 GEN
    code_url: "https://gist.github.com/staking/staking_v2.sol",
    focus_area: "Reward distribution per share, integer precision loss",
    report_url: "https://gist.github.com/whitehat/precision_loss_proof.md",
    status: "CLOSED",
    ai_verdict: "PAYOUT",
    ai_reason: "Verified critical precision loss bug in reward calculation formula line 84. Whitehat POC correctly demonstrates vault drained by 18% over 100 epochs. 100% Escrow disbursed.",
    confidence: "98"
  },
  {
    id: "3",
    owner: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    whitehat: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    reward_amount: "2500000000000000000000", // 2500 GEN
    code_url: "https://github.com/nftvault/contracts/blob/main/NFTMarket.sol",
    focus_area: "Access control, signature replay attacks",
    report_url: "https://gist.github.com/spammer/fake_ai_report.md",
    status: "OPEN",
    ai_verdict: "REJECT",
    ai_reason: "Report is spam / AI hallucination. The reported signature replay vulnerability references non-existent EIP-712 domain functions not present in target code.",
    confidence: "95"
  },
  {
    id: "4",
    owner: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    whitehat: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    reward_amount: "1000000000000000000000", // 1000 GEN
    code_url: "https://gist.github.com/rugpuller/deleted_code_404.sol",
    focus_area: "General code audit",
    report_url: "https://gist.github.com/whitehat/valid_report.md",
    status: "ESCALATED",
    ai_verdict: "ESCALATE",
    ai_reason: "Target code URL returned 404 Not Found. GenVM AI Anti-Rugpull guard activated: Escalated to Human Jury to prevent Owner from revoking whitehat rewards.",
    confidence: "100"
  }
];

export const INITIAL_BOUNTIES: Bounty[] = DEMO_SCENARIOS;

export const DEFAULT_CONTRACT_ADDRESS =
  import.meta.env.VITE_GENLAYER_CONTRACT_ADDRESS || '';
