import { REDOT_PAY_ABI, REDOT_PAY_CONTRACT_ADDRESS } from "../redot-pay-abi"

export interface PaymentEscrow {
  paymentId: string
  token: string
  payer: string
  recipient: string
  amount: number
  condition: number
  releaseTime: number
  frozenUntil: number
  status: "pending" | "frozen" | "released" | "refunded"
}

export class RedotPayService {
  private contract: any // Web3 contract instance

  constructor(contract: any) {
    this.contract = contract
  }

  async acceptPayment(
    token: string,
    amount: number,
    recipient: string,
    condition: number,
    releaseTime: number,
  ): Promise<string> {
    try {
      const tx = await this.contract.acceptPayment(token, amount, recipient, condition, releaseTime)
      const receipt = await tx.wait()
      return receipt.transactionHash
    } catch (error) {
      console.error("Error accepting payment:", error)
      throw error
    }
  }

  async freezePayment(paymentId: string, freezePeriod: number): Promise<string> {
    try {
      const tx = await this.contract.freezePayment(paymentId, freezePeriod)
      const receipt = await tx.wait()
      return receipt.transactionHash
    } catch (error) {
      console.error("Error freezing payment:", error)
      throw error
    }
  }

  async releasePayment(paymentId: string): Promise<string> {
    try {
      const tx = await this.contract.releasePayment(paymentId)
      const receipt = await tx.wait()
      return receipt.transactionHash
    } catch (error) {
      console.error("Error releasing payment:", error)
      throw error
    }
  }

  async refundPayment(paymentId: string): Promise<string> {
    try {
      const tx = await this.contract.refundPayment(paymentId)
      const receipt = await tx.wait()
      return receipt.transactionHash
    } catch (error) {
      console.error("Error refunding payment:", error)
      throw error
    }
  }

  async getPayment(paymentId: string): Promise<PaymentEscrow | null> {
    try {
      const result = await this.contract.getPayment(paymentId)
      return {
        paymentId,
        token: result[0],
        payer: result[1], 
        recipient: result[2],
        amount: Number(result[3]),
        condition: Number(result[4]),
        releaseTime: Number(result[5]),
        frozenUntil: Number(result[6]),
        status: this.getPaymentStatus(result[7]),
      }
    } catch (error) {
      console.error("Error getting payment:", error)
      return null
    }
  }

  private getPaymentStatus(statusCode: number): "pending" | "frozen" | "released" | "refunded" {
    // Convert status code to readable status
    // 0: pending, 1: frozen, 2: released, 3: refunded (example mapping)
    switch (statusCode) {
      case 0:
        return "pending"
      case 1:
        return "frozen"
      case 2:
        return "released"
      case 3:
        return "refunded"
      default:
        return "pending"
    }
  }

  async getUserBalance(userAddress: string, tokenAddress: string): Promise<number> {
    try {
      const balance = await this.contract.getUserBalance(userAddress, tokenAddress)
      return Number(balance)
    } catch (error) {
      console.error("Error getting user balance:", error)
      return 0
    }
  }

  async getFrozenBalance(userAddress: string, tokenAddress: string): Promise<number> {
    try {
      const frozenBalance = await this.contract.getFrozenBalance(userAddress, tokenAddress)
      return Number(frozenBalance)
    } catch (error) {
      console.error("Error getting frozen balance:", error)
      return 0
    }
  }
}
