"use client"

import { AUCTION_CONTRACT_ABI, AUCTION_CONTRACT_ADDRESS } from "../contracts/auction-contract"
import { RedotPayService } from "../contracts/redot-pay-integration"
import { REDOT_PAY_ABI, REDOT_PAY_CONTRACT_ADDRESS } from "../redot-pay-abi"

export interface AuctionData {
  id: string
  seller: string
  title: string
  description: string
  reservePrice: number
  currentBid: number
  highestBidder: string
  endTime: number
  isActive: boolean
  bids: BidData[]
}

export interface BidData {
  bidder: string
  amount: number
  timestamp: number
  txHash: string
}

export class AuctionService {
  private web3: any
  private contract: any
  private redotPayService: RedotPayService

  constructor(web3: any) {
    this.web3 = web3
    this.contract = new web3.eth.Contract(AUCTION_CONTRACT_ABI, AUCTION_CONTRACT_ADDRESS)

    // Initialize RedotPay service
    const redotPayContract = new web3.eth.Contract(REDOT_PAY_ABI, REDOT_PAY_CONTRACT_ADDRESS)
    this.redotPayService = new RedotPayService(redotPayContract)
  }

  async createAuction(
    title: string,
    description: string,
    reservePrice: number,
    duration: number,
    acceptedToken: string,
    fromAddress: string,
  ): Promise<string> {
    try {
      const tx = await this.contract.methods
        .createAuction(
          title,
          description,
          this.web3.utils.toWei(reservePrice.toString(), "ether"),
          duration,
          acceptedToken,
        )
        .send({ from: fromAddress })

      return tx.transactionHash
    } catch (error) {
      console.error("Error creating auction:", error)
      throw error
    }
  }

  async placeBid(auctionId: string, bidAmount: number, fromAddress: string, tokenAddress: string): Promise<string> {
    try {
      // First, escrow the bid amount via RedotPay
      const escrowTx = await this.redotPayService.acceptPayment(
        tokenAddress,
        bidAmount,
        AUCTION_CONTRACT_ADDRESS, // Recipient is the auction contract
        Number.parseInt(auctionId), // Condition is the auction ID
        Math.floor(Date.now() / 1000) + 86400, // Release time: 24 hours from now
      )

      // Then place the bid on the auction contract
      const bidTx = await this.contract.methods
        .placeBid(auctionId, this.web3.utils.toWei(bidAmount.toString(), "ether"))
        .send({ from: fromAddress })

      return bidTx.transactionHash
    } catch (error) {
      console.error("Error placing bid:", error)
      throw error
    }
  }

  async endAuction(auctionId: string, fromAddress: string): Promise<string> {
    try {
      const tx = await this.contract.methods.endAuction(auctionId).send({ from: fromAddress })
      return tx.transactionHash
    } catch (error) {
      console.error("Error ending auction:", error)
      throw error
    }
  }

  async getAuction(auctionId: string): Promise<AuctionData | null> {
    try {
      const result = await this.contract.methods.getAuction(auctionId).call()
      const bidHistory = await this.contract.methods.getBidHistory(auctionId).call()

      const bids: BidData[] = bidHistory.bidders.map((bidder: string, index: number) => ({
        bidder,
        amount: Number.parseFloat(this.web3.utils.fromWei(bidHistory.amounts[index], "ether")),
        timestamp: Number.parseInt(bidHistory.timestamps[index]),
        txHash: "", // Would need to get from events
      }))

      return {
        id: auctionId,
        seller: result.seller,
        title: result.title,
        description: result.description,
        reservePrice: Number.parseFloat(this.web3.utils.fromWei(result.reservePrice, "ether")),
        currentBid: Number.parseFloat(this.web3.utils.fromWei(result.currentBid, "ether")),
        highestBidder: result.highestBidder,
        endTime: Number.parseInt(result.endTime),
        isActive: result.isActive,
        bids,
      }
    } catch (error) {
      console.error("Error getting auction:", error)
      return null
    }
  }

  async getActiveAuctions(): Promise<AuctionData[]> {
    try {
      // This would typically involve querying events or a subgraph
      // For now, return mock data
      return []
    } catch (error) {
      console.error("Error getting active auctions:", error)
      return []
    }
  }

  // Event listeners
  onAuctionCreated(callback: (auctionId: string, seller: string, reservePrice: number) => void) {
    this.contract.events.AuctionCreated().on("data", (event: any) => {
      callback(
        event.returnValues.auctionId,
        event.returnValues.seller,
        Number.parseFloat(this.web3.utils.fromWei(event.returnValues.reservePrice, "ether")),
      )
    })
  }

  onBidPlaced(callback: (auctionId: string, bidder: string, amount: number) => void) {
    this.contract.events.BidPlaced().on("data", (event: any) => {
      callback(
        event.returnValues.auctionId,
        event.returnValues.bidder,
        Number.parseFloat(this.web3.utils.fromWei(event.returnValues.amount, "ether")),
      )
    })
  }

  onAuctionEnded(callback: (auctionId: string, winner: string, winningBid: number) => void) {
    this.contract.events.AuctionEnded().on("data", (event: any) => {
      callback(
        event.returnValues.auctionId,
        event.returnValues.winner,
        Number.parseFloat(this.web3.utils.fromWei(event.returnValues.winningBid, "ether")),
      )
    })
  }
}
