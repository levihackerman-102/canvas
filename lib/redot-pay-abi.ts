/**
 * RedotPay Vault Contract ABI
 * Generated from Stylus Rust contract interface
 */

export const REDOT_PAY_ABI = [
  {
    inputs: [],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "condition", type: "uint256" },
      { name: "release_time", type: "uint256" },
    ],
    name: "acceptPayment",
    outputs: [{ name: "paymentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "payment_id", type: "uint256" },
      { name: "freeze_period", type: "uint256" },
    ],
    name: "freezePayment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "payment_id", type: "uint256" }],
    name: "releasePayment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "payment_id", type: "uint256" }],
    name: "refundPayment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "payment_id", type: "uint256" }],
    name: "getPayment",
    outputs: [
      { name: "token", type: "address" },
      { name: "payer", type: "address" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "condition", type: "uint256" },
      { name: "release_time", type: "uint256" },
      { name: "frozen_until", type: "uint256" },
      { name: "status", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "token", type: "address" },
    ],
    name: "getUserBalance",
    outputs: [{ name: "balance", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "token", type: "address" },
    ],
    name: "getFrozenBalance",
    outputs: [{ name: "frozenBalance", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPaymentCounter",
    outputs: [{ name: "counter", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "ownerAddress", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "addr", type: "address" }],
    name: "isAuthorizedApprover",
    outputs: [{ name: "authorized", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isPaused",
    outputs: [{ name: "paused", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "approver", type: "address" }],
    name: "addApprover",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "approver", type: "address" }],
    name: "removeApprover",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "requireOwner",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "requireOwnerOrApprover",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "requireNotPaused",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
] as const

export const REDOT_PAY_CONTRACT_ADDRESS = "0x0987654321098765432109876543210987654321" // Replace with actual deployed address
