"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useWallet } from "@/lib/web3/wallet-connection"
import { toast } from "@/hooks/use-toast"

export function WalletConnectButton() {
  const { account, isConnected, chainId, balance, connect, disconnect } = useWallet()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await connect()
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to your wallet",
      })
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    })
  }

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account)
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1:
        return "Ethereum"
      case 137:
        return "Polygon"
      case 42161:
        return "Arbitrum"
      case 10:
        return "Optimism"
      default:
        return "Unknown"
    }
  }

  if (!isConnected) {
    return (
      <Button onClick={handleConnect} disabled={isConnecting} variant="outline" size="sm">
        <Wallet className="w-4 h-4 mr-2" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="hidden sm:inline">{formatAddress(account!)}</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Connected Account</span>
            <Badge variant="secondary" className="text-xs">
              {chainId && getNetworkName(chainId)}
            </Badge>
          </div>
          <div className="font-mono text-sm">{formatAddress(account!)}</div>
          {balance && <div className="text-sm text-muted-foreground">Balance: {balance} ETH</div>}
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={copyAddress}>
          <Copy className="w-4 h-4 mr-2" />
          Copy Address
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => window.open(`https://etherscan.io/address/${account}`, "_blank")}>
          <ExternalLink className="w-4 h-4 mr-2" />
          View on Explorer
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleDisconnect} className="text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
