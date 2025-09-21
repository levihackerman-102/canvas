"use client"

import { Card } from "@/components/ui/card"
import { Package, Play, DollarSign, Clock, CheckCircle, RefreshCw, Mail, Gavel, Shield, Zap, CreditCard, Lock, Unlock, TrendingUp, Database, ShoppingCart, Plus, X, CornerDownLeft } from "lucide-react"

const blockCategories = [
  {
    name: "VM Input Blocks",
    blocks: [
      {
        id: "vm-number-constant",
        name: "Number Constant",
        description: "Define a constant uint256 value",
        icon: Database,
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30", // Blue for uint256
        dataType: "uint256",
      },
      {
        id: "vm-bool-constant",
        name: "Boolean Constant", 
        description: "Define a constant boolean value",
        icon: Database,
        color: "bg-green-500/20 text-green-400 border-green-500/30", // Green for bool
        dataType: "bool",
      },
    ],
  },
  {
    name: "VM Math Operations",
    blocks: [
      {
        id: "vm-add",
        name: "Add",
        description: "Add two numbers (uint256 + uint256 → uint256)",
        icon: Plus,
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30", // Blue for uint256 output
        dataType: "uint256",
      },
      {
        id: "vm-mul",
        name: "Multiply",
        description: "Multiply two numbers (uint256 × uint256 → uint256)",
        icon: X,
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30", // Blue for uint256 output
        dataType: "uint256",
      },
      {
        id: "vm-special",
        name: "Special",
        description: "Returns the special value 69 (→ uint256)",
        icon: Zap,
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30", // Blue for uint256 output
        dataType: "uint256",
      },
    ],
  },
  {
    name: "VM Comparison Operations", 
    blocks: [
      {
        id: "vm-iseven",
        name: "Is Even",
        description: "Check if number is even (uint256 → bool)",
        icon: CheckCircle,
        color: "bg-green-500/20 text-green-400 border-green-500/30", // Green for bool output
        dataType: "bool",
      },
      {
        id: "vm-equal",
        name: "Equal",
        description: "Check if two numbers are equal (uint256 = uint256 → bool)",
        icon: CheckCircle,
        color: "bg-green-500/20 text-green-400 border-green-500/30", // Green for bool output
        dataType: "bool",
      },
      {
        id: "vm-greater",
        name: "Greater Than", 
        description: "Check if first > second (uint256 > uint256 → bool)",
        icon: TrendingUp,
        color: "bg-green-500/20 text-green-400 border-green-500/30", // Green for bool output
        dataType: "bool",
      },
      {
        id: "vm-less",
        name: "Less Than",
        description: "Check if first < second (uint256 < uint256 → bool)",
        icon: TrendingUp,
        color: "bg-green-500/20 text-green-400 border-green-500/30", // Green for bool output 
        dataType: "bool",
      },
    ],
  },
  {
    name: "VM Output Blocks",
    blocks: [
      {
        id: "vm-return-number",
        name: "Return Number",
        description: "Return a uint256 value from VM execution",
        icon: CornerDownLeft,
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30", // Blue for uint256
        dataType: "uint256",
      },
      {
        id: "vm-return-bool",
        name: "Return Boolean",
        description: "Return a boolean value from VM execution (as 0/1)",
        icon: CornerDownLeft, 
        color: "bg-green-500/20 text-green-400 border-green-500/30", // Green for bool
        dataType: "bool",
      },
    ],
  },
  {
    name: "Workflow Triggers",
    blocks: [
      {
        id: "buy-request",
        name: "Buy Request",
        description: "Customer initiates purchase from merchant website",
        icon: ShoppingCart,
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      },
      {
        id: "oracle-price-check",
        name: "Oracle Price Check",
        description: "Verify product pricing from external oracle",
        icon: TrendingUp,
        color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      },
    ],
  },
  {
    name: "RedotPay Blocks",
    blocks: [
      {
        id: "redot-accept-payment",
        name: "Accept Payment",
        description: "Receive payment into RedotPay vault",
        icon: CreditCard,
        color: "bg-green-500/20 text-green-400 border-green-500/30",
      },
      {
        id: "redot-freeze-payment",
        name: "Freeze Payment",
        description: "Freeze payment for dispute resolution",
        icon: Lock,
        color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      },
      {
        id: "redot-release-payment",
        name: "Release Payment",
        description: "Release payment to merchant",
        icon: Unlock,
        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      },
      {
        id: "redot-refund-payment",
        name: "Refund Payment",
        description: "Refund payment to customer",
        icon: RefreshCw,
        color: "bg-red-500/20 text-red-400 border-red-500/30",
      },
    ],
  },
  {
    name: "Auction Blocks",
    blocks: [
      {
        id: "list-item",
        name: "List Item",
        description: "Define auction item details",
        icon: Package,
        color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      },
      {
        id: "start-auction",
        name: "Start Auction",
        description: "Launch auction instance",
        icon: Play,
        color: "bg-green-500/20 text-green-400 border-green-500/30",
      },
      {
        id: "accept-bid",
        name: "Accept Bid",
        description: "Process incoming bids",
        icon: Gavel,
        color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      },
      {
        id: "end-auction",
        name: "End Auction",
        description: "Close auction manually or automatically",
        icon: Clock,
        color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      },
    ],
  },
  {
    name: "Legacy Payment Blocks",
    blocks: [
      {
        id: "escrow-payment",
        name: "Escrow Payment",
        description: "Secure bid funds (legacy)",
        icon: Shield,
        color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      },
      {
        id: "release-payment",
        name: "Release Payment",
        description: "Transfer winning funds (legacy)",
        icon: DollarSign,
        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      },
      {
        id: "refund-payment",
        name: "Refund Payment",
        description: "Return funds to bidders (legacy)",
        icon: RefreshCw,
        color: "bg-red-500/20 text-red-400 border-red-500/30",
      },
    ],
  },
  {
    name: "Automation Blocks",
    blocks: [
      {
        id: "settlement",
        name: "Auto Settlement",
        description: "Automated winner selection and payment",
        icon: Zap,
        color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      },
      {
        id: "notification",
        name: "Notification",
        description: "Send email/SMS updates",
        icon: Mail,
        color: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      },
      {
        id: "validation",
        name: "Validation",
        description: "Verify conditions and data",
        icon: CheckCircle,
        color: "bg-teal-500/20 text-teal-400 border-teal-500/30",
      },
      {
        id: "data-store",
        name: "Store Data",
        description: "Save workflow data on-chain",
        icon: Database,
        color: "bg-slate-500/20 text-slate-400 border-slate-500/30",
      },
    ],
  },
]

export function BlockPalette() {
  return (
    <div className="space-y-6 p-4">
      {blockCategories.map((category) => (
        <div key={category.name}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">{category.name}</h3>
          <div className="space-y-2">
            {category.blocks.map((block) => (
              <Card
                key={block.id}
                className={`p-3 cursor-pointer hover:bg-accent/50 transition-colors border ${block.color}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/json", JSON.stringify(block))
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <block.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{block.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{block.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
