"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Clock, Zap, Target } from "lucide-react"

interface AutomationRule {
  id: string
  name: string
  description: string
  trigger: string
  actions: string[]
  isActive: boolean
  lastExecuted?: string
  executionCount: number
}

const mockRules: AutomationRule[] = [
  {
    id: "1",
    name: "Auto-End Expired Auctions",
    description: "Automatically end auctions when time expires",
    trigger: "Time-based: Auction end time reached",
    actions: ["End Auction", "Send Notifications", "Process Settlement"],
    isActive: true,
    lastExecuted: "2024-01-15 14:30:00",
    executionCount: 23,
  },
  {
    id: "2",
    name: "Outbid Notifications",
    description: "Notify bidders when they've been outbid",
    trigger: "Event-based: New bid placed",
    actions: ["Send Email", "Send Push Notification"],
    isActive: true,
    lastExecuted: "2024-01-15 15:45:00",
    executionCount: 87,
  },
  {
    id: "3",
    name: "Reserve Price Met Alert",
    description: "Alert merchant when reserve price is met",
    trigger: "Condition-based: Current bid >= Reserve price",
    actions: ["Send Email to Merchant", "Update Auction Status"],
    isActive: false,
    executionCount: 12,
  },
]

export function AutomationRules() {
  const [rules, setRules] = useState(mockRules)

  const toggleRule = (ruleId: string) => {
    setRules((prev) => prev.map((rule) => (rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule)))
  }

  const getTriggerIcon = (trigger: string) => {
    if (trigger.includes("Time-based")) return Clock
    if (trigger.includes("Event-based")) return Zap
    if (trigger.includes("Condition-based")) return Target
    return Clock
  }

  const getTriggerColor = (trigger: string) => {
    if (trigger.includes("Time-based")) return "text-blue-400"
    if (trigger.includes("Event-based")) return "text-green-400"
    if (trigger.includes("Condition-based")) return "text-purple-400"
    return "text-gray-400"
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Automation Rules</h3>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {rules.map((rule) => {
        const TriggerIcon = getTriggerIcon(rule.trigger)
        return (
          <Card key={rule.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted/50 ${getTriggerColor(rule.trigger)}`}>
                    <TriggerIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={rule.isActive ? "secondary" : "outline"}>
                    {rule.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Switch checked={rule.isActive} onCheckedChange={() => toggleRule(rule.id)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Trigger</h4>
                  <p className="text-sm text-muted-foreground">{rule.trigger}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {rule.actions.map((action, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {action}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Executed {rule.executionCount} times</span>
                    {rule.lastExecuted && <span>Last: {new Date(rule.lastExecuted).toLocaleString()}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
