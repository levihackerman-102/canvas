"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Shield, AlertCircle, CheckCircle, ExternalLink } from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-connection"

interface ContractStatus {
  name: string
  address: string
  status: "connected" | "disconnected" | "error"
  version: string
  lastUpdated: string
}

export function ContractStatus() {
  const { isConnected, chainId } = useWallet()
  const [contracts, setContracts] = useState<ContractStatus[]>([
    {
      name: "Auction Contract",
      address: "0x1234567890123456789012345678901234567890",
      status: "connected",
      version: "v1.2.0",
      lastUpdated: "2024-01-15",
    },
    {
      name: "RedotPay Escrow",
      address: "0x0987654321098765432109876543210987654321",
      status: "connected",
      version: "v2.1.0",
      lastUpdated: "2024-01-10",
    },
  ])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Smart Contract Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-400">Connect your wallet to view contract status</p>
          </div>
        )}

        {contracts.map((contract) => (
          <div key={contract.address} className="p-3 bg-card/50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(contract.status)}
                <span className="font-medium">{contract.name}</span>
              </div>
              <Badge className={`text-xs ${getStatusColor(contract.status)}`}>{contract.status}</Badge>
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Version:</span>
                <span>{contract.version}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated:</span>
                <span>{contract.lastUpdated}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Address:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs">
                    {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={() => window.open(`https://etherscan.io/address/${contract.address}`, "_blank")}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Network:</span>
            <Badge variant="secondary">
              {chainId === 1 ? "Ethereum Mainnet" : chainId === 137 ? "Polygon" : "Unknown"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
