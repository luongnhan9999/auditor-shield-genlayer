import { createClient } from 'genlayer-js';
import { testnetAsimov, testnetBradbury, studionet, localnet } from 'genlayer-js/chains';
import type { Bounty } from '../types';

export type GenLayerNetwork = 'studionet' | 'testnetAsimov' | 'testnetBradbury' | 'localnet';

export function getGenLayerChain(network: GenLayerNetwork) {
  switch (network) {
    case 'studionet':
      return studionet;
    case 'testnetBradbury':
      return testnetBradbury;
    case 'localnet':
      return localnet;
    case 'testnetAsimov':
    default:
      return testnetAsimov;
  }
}

export function getGenLayerClient(network: GenLayerNetwork = 'studionet', rpcUrl?: string) {
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
  network: GenLayerNetwork = 'studionet',
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

    let jsonStr = typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult);
    if (jsonStr.startsWith('"') && jsonStr.endsWith('"')) {
      jsonStr = JSON.parse(jsonStr);
    }
    const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;

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

/**
 * Execute contract transaction on GenLayer Testnet / StudioNet
 */
export async function writeContractOnChain(
  contractAddress: string,
  functionName: string,
  args: any[],
  valueWei: string = '0',
  network: GenLayerNetwork = 'studionet'
): Promise<string> {
  const client = getGenLayerClient(network);
  try {
    const txHash = await client.writeContract({
      address: contractAddress as `0x${string}`,
      functionName,
      args,
      value: BigInt(valueWei),
    });
    return String(txHash);
  } catch (error) {
    console.warn(`GenLayer writeContract (${functionName}) warning:`, error);
    throw error;
  }
}
