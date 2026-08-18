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

// Clean production initial bounties (empty state until fetched from GenLayer contract)
export const INITIAL_BOUNTIES: Bounty[] = [];

// Environment default deployed contract address
export const DEFAULT_CONTRACT_ADDRESS =
  import.meta.env.VITE_GENLAYER_CONTRACT_ADDRESS || '';
