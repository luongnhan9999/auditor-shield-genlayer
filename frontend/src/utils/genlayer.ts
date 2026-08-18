import { createClient } from 'genlayer-js';
import { testnetAsimov, testnetBradbury, studionet, localnet } from 'genlayer-js/chains';
import type { Bounty } from '../types';

export type GenLayerNetwork = 'testnetAsimov' | 'testnetBradbury' | 'studionet' | 'localnet';

export function getGenLayerChain(network: GenLayerNetwork) {
  switch (network) {
    case 'testnetAsimov':
      return testnetAsimov;
    case 'testnetBradbury':
      return testnetBradbury;
    case 'studionet':
      return studionet;
    case 'localnet':
    default:
      return localnet;
  }
}

export function getGenLayerClient(network: GenLayerNetwork = 'testnetAsimov', rpcUrl?: string) {
  const chain = getGenLayerChain(network);
  return createClient({
    chain,
    endpoint: rpcUrl || undefined,
  });
}

/**
 * Read all bounties from GenLayer Intelligent Contract (`get_all_bounties`)
 */
export async function readBountiesFromChain(
  contractAddress: string,
  network: GenLayerNetwork = 'testnetAsimov',
  rpcUrl?: string
): Promise<Bounty[]> {
  if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
    return [];
  }

  try {
    const client = getGenLayerClient(network, rpcUrl);
    const rawResult = await client.readContract({
      address: contractAddress as `0x${string}`,
      functionName: 'get_all_bounties',
      args: [],
    });

    if (!rawResult) return [];

    const jsonStr = typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult);
    const parsed = JSON.parse(jsonStr);

    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        id: String(item.id),
        owner: String(item.owner),
        whitehat: String(item.whitehat),
        reward_amount: String(item.reward_amount),
        code_url: String(item.code_url || ''),
        focus_area: String(item.focus_area || ''),
        report_url: String(item.report_url || ''),
        status: item.status || 'OPEN',
        ai_verdict: item.ai_verdict || '',
        ai_reason: item.ai_reason || '',
        confidence: String(item.confidence || '0'),
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to read bounties from GenLayer contract:', error);
    throw error;
  }
}
