// EIP-1193 Ethereum Provider Interface
export interface EthereumProvider {
  request: (args: { method: string; params?: any[] | object }) => Promise<any>;
  on: (eventName: string, handler: (...args: any[]) => void) => void;
  removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

/**
 * Connect to MetaMask / GenLayer EIP-1193 Wallet
 */
export async function connectMetaMaskWallet(): Promise<{ address: string; providerName: string }> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No Web3 wallet extension found. Please install MetaMask or GenLayer Extension.');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts authorized in MetaMask.');
    }

    const providerName = window.ethereum.isMetaMask ? 'MetaMask' : 'Web3 Wallet';
    return {
      address: accounts[0],
      providerName,
    };
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected the wallet connection request.');
    }
    throw new Error(error.message || 'Failed to connect to MetaMask.');
  }
}

/**
 * Listen for account changes from MetaMask
 */
export function setupWalletListeners(onAccountChange: (account: string) => void) {
  if (typeof window !== 'undefined' && window.ethereum) {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        onAccountChange(accounts[0]);
      } else {
        onAccountChange('');
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }
  return () => {};
}
