import { createContext, useContext, useEffect, useState } from "react";

interface WalletContextType {
  address: string | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  publicClient: any;
  walletClient: any;
}

const WalletContext = createContext<WalletContextType>({
  address: undefined,
  isConnected: false,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
  publicClient: undefined,
  walletClient: undefined,
});

// Define Aptos network configurations
const network = {
  mainnet: {
    name: 'Aptos Mainnet',
    nodeUrl: 'https://fullnode.mainnet.aptoslabs.com/v1',
    explorerUrl: 'https://explorer.aptoslabs.com',
    chainId: 1,
  },
  testnet: {
    name: 'Aptos Testnet',
    nodeUrl: 'https://fullnode.testnet.aptoslabs.com/v1',
    explorerUrl: 'https://explorer.aptoslabs.com',
    chainId: 2,
  },
  devnet: {
    name: 'Aptos Devnet',
    nodeUrl: 'https://fullnode.devnet.aptoslabs.com/v1',
    explorerUrl: 'https://explorer.aptoslabs.com',
    chainId: 41,
  }
};

// Use testnet for development, mainnet for production
const activeNetwork = import.meta.env.PROD ? network.mainnet : network.testnet;

declare global {
  interface Window {
    aptos?: any;
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [publicClient, setPublicClient] = useState<any>();
  const [walletClient, setWalletClient] = useState<any>();

  const isConnected = !!address;

  useEffect(() => {
    // Initialize public client
    const client = {
      network: activeNetwork,
      fetchData: async (endpoint: string) => {
        const res = await fetch(`${activeNetwork.nodeUrl}${endpoint}`);
        return res.json();
      }
    };
    setPublicClient(client);
  }, []);

  async function connect() {
    if (!window.aptos) {
      alert('Please install Petra Wallet or another Aptos-compatible wallet');
      return;
    }

    setIsConnecting(true);
    try {
      // Request connection to wallet
      const response = await window.aptos.connect();
      const account = response.address;

      // Create wallet client
      const client = {
        account,
        signAndSubmitTransaction: async (transaction: any) => {
          return await window.aptos.signAndSubmitTransaction(transaction);
        },
        signTransaction: async (transaction: any) => {
          return await window.aptos.signTransaction(transaction);
        },
        signMessage: async (message: string) => {
          return await window.aptos.signMessage({
            message,
            nonce: Math.random().toString(36).substring(2, 15),
          });
        }
      };

      setAddress(account);
      setWalletClient(client);
    } catch (error) {
      console.error('Error connecting to Aptos wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  }

  function disconnect() {
    if (window.aptos) {
      try {
        window.aptos.disconnect();
      } catch (error) {
        console.error('Error disconnecting from Aptos wallet:', error);
      }
    }
    setAddress(undefined);
    setWalletClient(undefined);
  }

  useEffect(() => {
    // Handle account changes
    if (window.aptos) {
      window.aptos.onAccountChange((newAccount: string | null) => {
        if (newAccount) {
          setAddress(newAccount);
        } else {
          disconnect();
        }
      });

      window.aptos.onNetworkChange((network: any) => {
        // Check if network matches our expected network
        if (network.chainId !== activeNetwork.chainId) {
          alert(`Please switch to ${activeNetwork.name} in your wallet`);
          disconnect();
        }
      });
    }

    // Check if wallet is already connected
    const checkConnection = async () => {
      if (window.aptos) {
        try {
          const response = await window.aptos.isConnected();
          if (response) {
            const account = await window.aptos.account();
            setAddress(account.address);

            // Create wallet client
            const client = {
              account: account.address,
              signAndSubmitTransaction: async (transaction: any) => {
                return await window.aptos.signAndSubmitTransaction(transaction);
              },
              signTransaction: async (transaction: any) => {
                return await window.aptos.signTransaction(transaction);
              },
              signMessage: async (message: string) => {
                return await window.aptos.signMessage({
                  message,
                  nonce: Math.random().toString(36).substring(2, 15),
                });
              }
            };
            setWalletClient(client);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();

    return () => {
      // Cleanup functions if needed
    };
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        isConnecting,
        connect,
        disconnect,
        publicClient,
        walletClient,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
