import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import type { PolkadotSigner } from "polkadot-api";
import { connectInjectedExtension } from "polkadot-api/pjs-signer";
import { contractInstance } from "contract-instance";

// Storage keys
const CONNECTION_STATE_KEY = "wallet_connected";
const SELECTED_ACCOUNT_KEY = "selected_account";

interface ContractContextType {
  contract: typeof contractInstance;
  isReady: boolean;
  accounts: InjectedAccountWithMeta[];
  selectedAccount: InjectedAccountWithMeta | null;
  setSelectedAccount: (account: InjectedAccountWithMeta | null) => void;
  connectWallet: () => Promise<InjectedAccountWithMeta[]>;
  disconnectWallet: () => void;
  isConnecting: boolean;
  getSigner: () => Promise<PolkadotSigner>;
}

const ContractContext = createContext<ContractContextType>({
  contract: contractInstance,
  isReady: false,
  accounts: [],
  selectedAccount: null,
  setSelectedAccount: () => {},
  connectWallet: async () => [],
  disconnectWallet: () => {},
  isConnecting: false,
  getSigner: () => Promise.resolve({} as PolkadotSigner),
});

export function ContractProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isAutoConnecting, setIsAutoConnecting] = useState(true);
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<InjectedAccountWithMeta | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Helper to save selected account to localStorage
  const saveSelectedAccount = (account: InjectedAccountWithMeta | null) => {
    if (account) {
      localStorage.setItem(
        SELECTED_ACCOUNT_KEY,
        JSON.stringify({
          address: account.address,
          meta: account.meta,
        }),
      );
    } else {
      localStorage.removeItem(SELECTED_ACCOUNT_KEY);
    }
  };

  // Update selected account and persist to localStorage
  const handleSetSelectedAccount = (
    account: InjectedAccountWithMeta | null,
  ) => {
    setSelectedAccount(account);
    saveSelectedAccount(account);

    // Update connection state
    if (account) {
      localStorage.setItem(CONNECTION_STATE_KEY, "true");
    } else {
      localStorage.removeItem(CONNECTION_STATE_KEY);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    handleSetSelectedAccount(null);
    localStorage.removeItem(CONNECTION_STATE_KEY);
    setAccounts([]);
  };

  useEffect(() => {
    const initContract = async () => {
      try {
        // Check if contract is compatible
        const isCompatible = await contractInstance.isCompatible();
        if (!isCompatible) {
          console.warn("Contract may not be compatible with the current chain");
        }
        setIsReady(true);
        console.log("Contract is ready");

        // Check if previously connected
        const wasConnected =
          localStorage.getItem(CONNECTION_STATE_KEY) === "true";
        if (wasConnected) {
          console.log("Attempting to reconnect wallet...");
          connectWallet();
        }
        setIsAutoConnecting(false);
      } catch (error) {
        console.error("Failed to initialize contract:", error);
      }
    };

    initContract();
  });

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const extensions = await web3Enable("Eduverse");
      if (extensions.length === 0) {
        throw new Error("No extension found");
      }

      const allAccounts = await web3Accounts();
      setAccounts(allAccounts);

      const savedAccountJson = localStorage.getItem(SELECTED_ACCOUNT_KEY);

      if (savedAccountJson && allAccounts.length > 0) {
        try {
          const savedAccount = JSON.parse(savedAccountJson);
          // Find matching account in the current accounts list
          const matchedAccount = allAccounts.find(
            (acc) => acc.address === savedAccount.address,
          );

          if (matchedAccount) {
            handleSetSelectedAccount(matchedAccount);
          } else if (allAccounts.length > 0) {
            // If previously selected account isn't available, use the first one
            handleSetSelectedAccount(allAccounts[0]);
          }
        } catch (e) {
          console.error("Error parsing saved account:", e);
          if (allAccounts.length > 0) {
            handleSetSelectedAccount(allAccounts[0]);
          }
        }
      } else if (allAccounts.length > 0 && !selectedAccount) {
        handleSetSelectedAccount(allAccounts[0]);
      }

      // Mark as connected
      localStorage.setItem(CONNECTION_STATE_KEY, "true");

      return allAccounts;
    } catch (error) {
      console.error("Error connecting wallet:", error);
      localStorage.removeItem(CONNECTION_STATE_KEY);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const getSigner = async (): Promise<PolkadotSigner> => {
    if (!selectedAccount) {
      throw new Error("No account selected");
    }
    const extension = await connectInjectedExtension(
      selectedAccount.meta.source,
    );
    const accounts = extension.getAccounts();

    const account = accounts.find(
      (acc) => acc.address === selectedAccount.address,
    );

    if (!account) {
      throw new Error("Selected account not found in extension");
    }
    return account.polkadotSigner;
  };

  return (
    <ContractContext.Provider
      value={{
        contract: contractInstance,
        isReady,
        accounts,
        selectedAccount,
        setSelectedAccount: handleSetSelectedAccount,
        connectWallet,
        disconnectWallet,
        isConnecting: isConnecting || isAutoConnecting,
        getSigner,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
}

export function useContract() {
  return useContext(ContractContext);
}
