export const AUCTION_CONTRACT_ABI = [
  {
    inputs: [
      { name: "itemTitle", type: "string" },
      { name: "itemDescription", type: "string" },
      { name: "reservePrice", type: "uint256" },
      { name: "duration", type: "uint256" },
      { name: "acceptedToken", type: "address" },
    ],
    name: "createAuction",
    outputs: [{ name: "auctionId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "auctionId", type: "uint256" },
      { name: "bidAmount", type: "uint256" },
    ],
    name: "placeBid",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "auctionId", type: "uint256" }],
    name: "endAuction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "auctionId", type: "uint256" }],
    name: "getAuction",
    outputs: [
      { name: "seller", type: "address" },
      { name: "title", type: "string" },
      { name: "description", type: "string" },
      { name: "reservePrice", type: "uint256" },
      { name: "currentBid", type: "uint256" },
      { name: "highestBidder", type: "address" },
      { name: "endTime", type: "uint256" },
      { name: "isActive", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "auctionId", type: "uint256" }],
    name: "getBidHistory",
    outputs: [
      { name: "bidders", type: "address[]" },
      { name: "amounts", type: "uint256[]" },
      { name: "timestamps", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "auctionId", type: "uint256" },
      { indexed: true, name: "seller", type: "address" },
      { indexed: false, name: "reservePrice", type: "uint256" },
    ],
    name: "AuctionCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "auctionId", type: "uint256" },
      { indexed: true, name: "bidder", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "BidPlaced",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "auctionId", type: "uint256" },
      { indexed: true, name: "winner", type: "address" },
      { indexed: false, name: "winningBid", type: "uint256" },
    ],
    name: "AuctionEnded",
    type: "event",
  },
] as const

export const AUCTION_CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890" // Replace with actual deployed address
