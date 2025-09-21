"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface WalletContextType {
  account: string | null
  isConnected: boolean
  chainId: number | null
  balance: string | null
  connect: () => Promise<void>
  disconnect: () => void
  switchNetwork: (chainId: number) => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    checkConnection()

    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [])

  const checkConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          setAccount(accounts[0])
          setIsConnected(true)
          await updateChainId()
          await updateBalance(accounts[0])
        }
      } catch (error) {
        console.error("Error checking connection:", error)
      }
    }
  }

  const connect = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        setAccount(accounts[0])
        setIsConnected(true)
        await updateChainId()
        await updateBalance(accounts[0])
      } catch (error) {
        console.error("Error connecting wallet:", error)
        throw error
      }
    } else {
      throw new Error("MetaMask is not installed")
    }
  }

  const disconnect = () => {
    setAccount(null)
    setIsConnected(false)
    setChainId(null)
    setBalance(null)
  }

  const switchNetwork = async (targetChainId: number) => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        })
      } catch (error: any) {
        if (error.code === 4902) {
          // Network not added to MetaMask
          throw new Error("Please add this network to your wallet")
        }
        throw error
      }
    }
  }

  const updateChainId = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: "eth_chainId" })
        setChainId(Number.parseInt(chainId, 16))
      } catch (error) {
        console.error("Error getting chain ID:", error)
      }
    }
  }

  const updateBalance = async (address: string) => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const balance = await window.ethereum.request({
          method: "eth_getBalance",
          params: [address, "latest"],
        })
        const balanceInEth = (Number.parseInt(balance, 16) / 1e18).toFixed(4)
        setBalance(balanceInEth)
      } catch (error) {
        console.error("Error getting balance:", error)
      }
    }
  }

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect()
    } else {
      setAccount(accounts[0])
      updateBalance(accounts[0])
    }
  }

  const handleChainChanged = (chainId: string) => {
    setChainId(Number.parseInt(chainId, 16))
  }

  const value: WalletContextType = {
    account,
    isConnected,
    chainId,
    balance,
    connect,
    disconnect,
    switchNetwork,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}
