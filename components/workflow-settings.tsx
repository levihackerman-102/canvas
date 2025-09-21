"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ContractStatus } from "@/components/contract-status"
import { Badge } from "@/components/ui/badge"

export function WorkflowSettings() {
  const [settings, setSettings] = useState({
    name: "My Auction Workflow",
    description: "",
    currency: "USDC",
    autoStart: false,
    notifications: true,
    webhookUrl: "",
    apiKey: "",
    environment: "testnet",
  })

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="workflow-name">Workflow Name</Label>
          <Input
            id="workflow-name"
            value={settings.name}
            onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Enter workflow name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="workflow-description">Description</Label>
          <Textarea
            id="workflow-description"
            value={settings.description}
            onChange={(e) => setSettings((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your auction workflow"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Default Currency</Label>
          <Select
            value={settings.currency}
            onValueChange={(value) => setSettings((prev) => ({ ...prev, currency: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USDC">USDC</SelectItem>
              <SelectItem value="ETH">ETH</SelectItem>
              <SelectItem value="USDT">USDT</SelectItem>
              <SelectItem value="DAI">DAI</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Integration Settings</h4>
          <Badge variant="secondary" className="text-xs">
            {settings.environment}
          </Badge>
        </div>

        <div className="space-y-2">
          <Label htmlFor="environment">Environment</Label>
          <Select
            value={settings.environment}
            onValueChange={(value) => setSettings((prev) => ({ ...prev, environment: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="testnet">Testnet</SelectItem>
              <SelectItem value="mainnet">Mainnet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhook-url">Webhook URL</Label>
          <Input
            id="webhook-url"
            value={settings.webhookUrl}
            onChange={(e) => setSettings((prev) => ({ ...prev, webhookUrl: e.target.value }))}
            placeholder="https://your-app.com/webhooks/auction"
          />
          <p className="text-xs text-muted-foreground">Receive real-time auction events at this endpoint</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            value={settings.apiKey}
            onChange={(e) => setSettings((prev) => ({ ...prev, apiKey: e.target.value }))}
            placeholder="Your API key for external integrations"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h4 className="text-sm font-medium">Automation Settings</h4>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-start">Auto-start Auctions</Label>
            <p className="text-xs text-muted-foreground">Automatically start auctions when conditions are met</p>
          </div>
          <Switch
            id="auto-start"
            checked={settings.autoStart}
            onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, autoStart: checked }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications">Enable Notifications</Label>
            <p className="text-xs text-muted-foreground">Send webhook notifications for auction events</p>
          </div>
          <Switch
            id="notifications"
            checked={settings.notifications}
            onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, notifications: checked }))}
          />
        </div>
      </div>

      <Separator />

      <ContractStatus />

      <Button className="w-full" size="sm">
        Save Configuration
      </Button>
    </div>
  )
}
