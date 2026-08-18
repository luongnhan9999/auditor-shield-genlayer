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

export const INITIAL_BOUNTIES: Bounty[] = [
  {
    id: "1",
    owner: "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7",
    whitehat: "0x0000000000000000000000000000000000000000",
    reward_amount: "5000000000000000000000", // 5000 GEN
    code_url: "https://gist.github.com/example/reentrancy_vault.sol",
    focus_area: "Focus on reentrancy attack vectors, vault drain, and flash loan manipulations",
    report_url: "",
    status: "OPEN",
    ai_verdict: "",
    ai_reason: "",
    confidence: "0"
  },
  {
    id: "2",
    owner: "0x3C44CdD0d6678F0877AE2285758504DBB4723930",
    whitehat: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    reward_amount: "2500000000000000000000", // 2500 GEN
    code_url: "https://github.com/defiprotocol/contracts/blob/main/AMM.sol",
    focus_area: "Slippage math, integer overflow, K invariant check",
    report_url: "https://gist.github.com/whitehat/report_amm_k_bug.md",
    status: "EVALUATING",
    ai_verdict: "",
    ai_reason: "",
    confidence: "0"
  },
  {
    id: "3",
    owner: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    whitehat: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    reward_amount: "10000000000000000000000", // 10000 GEN
    code_url: "https://gist.github.com/audit/staking_v2.sol",
    focus_area: "Reward distribution per share, precision loss",
    report_url: "https://gist.github.com/whitehat/precision_loss_proof.md",
    status: "CLOSED",
    ai_verdict: "PAYOUT",
    ai_reason: "Verified critical precision loss bug in reward calculation formula line 84. Whitehat POC correctly demonstrates vault drained by 18% over 100 epochs.",
    confidence: "98"
  },
  {
    id: "4",
    owner: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    whitehat: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    reward_amount: "1000000000000000000000", // 1000 GEN
    code_url: "https://github.com/nftvault/contracts/blob/main/NFTMarket.sol",
    focus_area: "Access control, signature replay attacks",
    report_url: "https://gist.github.com/spammer/fake_report.md",
    status: "OPEN",
    ai_verdict: "REJECT",
    ai_reason: "Report is spam / AI hallucination. The reported signature replay vulnerability references non-existent EIP-712 domain functions not present in target code.",
    confidence: "95"
  }
];
