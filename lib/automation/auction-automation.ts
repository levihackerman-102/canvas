"use client"

import { workflowEngine } from "./workflow-engine"
import type { AuctionService } from "../web3/auction-service"

export interface AutomationRule {
  id: string
  name: string
  trigger: AutomationTrigger
  actions: AutomationAction[]
  isActive: boolean
  createdAt: number
}

export interface AutomationTrigger {
  type: "time_based" | "event_based" | "condition_based"
  config: Record<string, any>
}

export interface AutomationAction {
  type: "end_auction" | "send_notification" | "release_payment" | "refund_payment"
  config: Record<string, any>
}

export class AuctionAutomation {
  private rules: Map<string, AutomationRule> = new Map()
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private auctionService?: AuctionService

  constructor(auctionService?: AuctionService) {
    this.auctionService = auctionService
    this.setupEventListeners()
  }

  private setupEventListeners() {
    // Listen to workflow engine events
    workflowEngine.on("execution:completed", (execution) => {
      this.handleWorkflowCompleted(execution)
    })

    // Listen to auction events if service is available
    if (this.auctionService) {
      this.auctionService.onAuctionCreated((auctionId, seller, reservePrice) => {
        this.handleAuctionCreated(auctionId, seller, reservePrice)
      })

      this.auctionService.onBidPlaced((auctionId, bidder, amount) => {
        this.handleBidPlaced(auctionId, bidder, amount)
      })

      this.auctionService.onAuctionEnded((auctionId, winner, winningBid) => {
        this.handleAuctionEnded(auctionId, winner, winningBid)
      })
    }
  }

  createRule(rule: Omit<AutomationRule, "id" | "createdAt">): string {
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const newRule: AutomationRule = {
      ...rule,
      id: ruleId,
      createdAt: Date.now(),
    }

    this.rules.set(ruleId, newRule)

    if (newRule.isActive) {
      this.activateRule(newRule)
    }

    return ruleId
  }

  updateRule(ruleId: string, updates: Partial<AutomationRule>): boolean {
    const rule = this.rules.get(ruleId)
    if (!rule) return false

    const updatedRule = { ...rule, ...updates }
    this.rules.set(ruleId, updatedRule)

    // Reactivate rule if it was active
    if (rule.isActive) {
      this.deactivateRule(ruleId)
    }
    if (updatedRule.isActive) {
      this.activateRule(updatedRule)
    }

    return true
  }

  deleteRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId)
    if (!rule) return false

    this.deactivateRule(ruleId)
    this.rules.delete(ruleId)
    return true
  }

  private activateRule(rule: AutomationRule) {
    switch (rule.trigger.type) {
      case "time_based":
        this.setupTimeBasedTrigger(rule)
        break
      case "event_based":
        this.setupEventBasedTrigger(rule)
        break
      case "condition_based":
        this.setupConditionBasedTrigger(rule)
        break
    }
  }

  private deactivateRule(ruleId: string) {
    const timer = this.timers.get(ruleId)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(ruleId)
    }
  }

  private setupTimeBasedTrigger(rule: AutomationRule) {
    const { delay, recurring } = rule.trigger.config

    const executeActions = () => {
      this.executeActions(rule.actions, { ruleId: rule.id, trigger: "time_based" })

      if (recurring) {
        const timer = setTimeout(executeActions, delay)
        this.timers.set(rule.id, timer)
      }
    }

    const timer = setTimeout(executeActions, delay)
    this.timers.set(rule.id, timer)
  }

  private setupEventBasedTrigger(rule: AutomationRule) {
    // Event-based triggers are handled in event listeners
    // Rules are checked when events occur
  }

  private setupConditionBasedTrigger(rule: AutomationRule) {
    // Condition-based triggers are checked periodically
    const checkCondition = () => {
      if (this.evaluateCondition(rule.trigger.config)) {
        this.executeActions(rule.actions, { ruleId: rule.id, trigger: "condition_based" })
      }
    }

    // Check every minute
    const timer = setInterval(checkCondition, 60000)
    this.timers.set(rule.id, timer as any)
  }

  private async executeActions(actions: AutomationAction[], context: Record<string, any>) {
    for (const action of actions) {
      try {
        await this.executeAction(action, context)
      } catch (error) {
        console.error(`Failed to execute action ${action.type}:`, error)
      }
    }
  }

  private async executeAction(action: AutomationAction, context: Record<string, any>) {
    switch (action.type) {
      case "end_auction":
        await this.endAuction(action.config, context)
        break
      case "send_notification":
        await this.sendNotification(action.config, context)
        break
      case "release_payment":
        await this.releasePayment(action.config, context)
        break
      case "refund_payment":
        await this.refundPayment(action.config, context)
        break
    }
  }

  private async endAuction(config: Record<string, any>, context: Record<string, any>) {
    const { auctionId } = config

    if (this.auctionService) {
      // End auction via smart contract
      await this.auctionService.endAuction(auctionId, config.fromAddress)
    }

    console.log(`Auction ${auctionId} ended automatically`)
  }

  private async sendNotification(config: Record<string, any>, context: Record<string, any>) {
    const { recipients, message, type } = config

    // Simulate notification sending
    console.log(`Sending ${type} notification to ${recipients.length} recipients: ${message}`)
  }

  private async releasePayment(config: Record<string, any>, context: Record<string, any>) {
    const { paymentId } = config

    // Release payment via RedotPay
    console.log(`Releasing payment ${paymentId}`)
  }

  private async refundPayment(config: Record<string, any>, context: Record<string, any>) {
    const { paymentId } = config

    // Refund payment via RedotPay
    console.log(`Refunding payment ${paymentId}`)
  }

  private evaluateCondition(config: Record<string, any>): boolean {
    // Simple condition evaluation
    const { field, operator, value } = config

    switch (operator) {
      case "equals":
        return field === value
      case "greater_than":
        return Number(field) > Number(value)
      case "less_than":
        return Number(field) < Number(value)
      default:
        return false
    }
  }

  private handleWorkflowCompleted(execution: any) {
    // Check for rules triggered by workflow completion
    this.checkEventBasedRules("workflow_completed", { execution })
  }

  private handleAuctionCreated(auctionId: string, seller: string, reservePrice: number) {
    this.checkEventBasedRules("auction_created", { auctionId, seller, reservePrice })
  }

  private handleBidPlaced(auctionId: string, bidder: string, amount: number) {
    this.checkEventBasedRules("bid_placed", { auctionId, bidder, amount })
  }

  private handleAuctionEnded(auctionId: string, winner: string, winningBid: number) {
    this.checkEventBasedRules("auction_ended", { auctionId, winner, winningBid })
  }

  private checkEventBasedRules(eventType: string, eventData: Record<string, any>) {
    for (const rule of this.rules.values()) {
      if (rule.isActive && rule.trigger.type === "event_based" && rule.trigger.config.eventType === eventType) {
        this.executeActions(rule.actions, { ...eventData, ruleId: rule.id })
      }
    }
  }

  getRules(): AutomationRule[] {
    return Array.from(this.rules.values())
  }

  getRule(ruleId: string): AutomationRule | undefined {
    return this.rules.get(ruleId)
  }
}

// Global automation instance
export const auctionAutomation = new AuctionAutomation()
