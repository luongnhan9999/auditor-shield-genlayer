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

const STORAGE_ACCOUNT_KEY = 'auditorshield_wallet_account';
const STORAGE_PROVIDER_KEY = 'auditorshield_wallet_provider';

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
    const address = accounts[0];

    saveWalletState(address, providerName);
    return { address, providerName };
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected the wallet connection request.');
    }
    throw new Error(error.message || 'Failed to connect to MetaMask.');
  }
}

/**
 * Check if MetaMask is already connected on page load
 */
export async function autoCheckWalletConnection(): Promise<{ address: string; providerName: string }> {
  if (typeof window === 'undefined') return { address: '', providerName: '' };

  // 1. Try checking window.ethereum authorized accounts
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        const providerName = window.ethereum.isMetaMask ? 'MetaMask' : 'Web3 Wallet';
        saveWalletState(accounts[0], providerName);
        return { address: accounts[0], providerName };
      }
    } catch (e) {
      console.warn('Auto check wallet error:', e);
    }
  }

  // 2. Check localStorage saved state
  const savedAddress = localStorage.getItem(STORAGE_ACCOUNT_KEY) || '';
  const savedProvider = localStorage.getItem(STORAGE_PROVIDER_KEY) || '';
  return { address: savedAddress, providerName: savedProvider };
}

export function saveWalletState(address: string, providerName: string) {
  if (typeof localStorage === 'undefined') return;
  if (address) {
    localStorage.setItem(STORAGE_ACCOUNT_KEY, address);
    localStorage.setItem(STORAGE_PROVIDER_KEY, providerName);
  } else {
    localStorage.removeItem(STORAGE_ACCOUNT_KEY);
    localStorage.removeItem(STORAGE_PROVIDER_KEY);
  }
}

/**
 * Listen for account changes from MetaMask
 */
export function setupWalletListeners(onAccountChange: (account: string) => void) {
  if (typeof window !== 'undefined' && window.ethereum) {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        saveWalletState(accounts[0], 'MetaMask');
        onAccountChange(accounts[0]);
      } else {
        saveWalletState('', '');
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
