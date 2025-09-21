# Export System Deep Dive - From Workflow to Smart Contract

## 🔄 The Complete Export Transformation

```mermaid
graph TD
    A[Visual Workflow<br/>UI Canvas] --> B[WorkflowBlock Array<br/>Canvas State]
    B --> C[WorkflowNode Array<br/>Engine Format]
    C --> D[Topological Sort<br/>Execution Order]
    D --> E[Contract Call Extraction<br/>Filter & Map]
    E --> F[WorkflowContractExport<br/>JSON Object]
    F --> G[Solidity Generation<br/>Router Contract]
    
    subgraph "Export Object Structure"
        F --> F1[contractCalls: ContractCall[]]
        F --> F2[dependencies: WorkflowDependency[]]
        F --> F3[metadata: Object]
    end
```

## 🎯 Real Example: Merchant Payment Workflow

### Step 1: User Creates This Workflow on Canvas:
```
[Buy Request] → [Oracle Price Check] → [Accept Payment] → [Release Payment] → [Send Notification]
```

### Step 2: Canvas State (WorkflowBlock[])
```typescript
const canvasBlocks = [
  {
    id: "buy-request-123",
    name: "Buy Request", 
    type: "buy-request",
    x: 100, y: 100,
    connections: ["oracle-check-124"],
    config: { productId: "ITEM_001", quantity: 1 }
  },
  {
    id: "oracle-check-124", 
    name: "Oracle Price Check",
    type: "oracle-price-check", 
    x: 300, y: 100,
    connections: ["accept-payment-125"],
    config: { priceThreshold: 1000 }
  },
  {
    id: "accept-payment-125",
    name: "Accept Payment",
    type: "redot-accept-payment",
    x: 500, y: 100, 
    connections: ["release-payment-126"],
    config: { 
      token: "0xA0b86a33E6C0cE0E8A49c6B7a3BA2a9a35e8F4b0",
      amount: "1000000000000000000", // 1 ETH
      recipient: "0x742d35Cc6e0F4B9F2e7a5F8e0b8d5F5F5F5F5F5F",
      condition: 1,
      releaseTime: 1678987634
    }
  },
  {
    id: "release-payment-126",
    name: "Release Payment", 
    type: "redot-release-payment",
    x: 700, y: 100,
    connections: ["send-notification-127"],
    config: { paymentId: "${accept-payment-125_result.paymentId}" }
  },
  {
    id: "send-notification-127",
    name: "Send Notification",
    type: "notification", 
    x: 900, y: 100,
    connections: [],
    config: { message: "Payment completed successfully!" }
  }
]
```

### Step 3: Engine Processing - `exportWorkflowForContract()`

#### 3A. Topological Sort Results:
```typescript
// Sorted by execution dependencies:
sortedNodes = [
  "buy-request-123",      // Start node (no incoming connections)
  "oracle-check-124", 
  "accept-payment-125",
  "release-payment-126", 
  "send-notification-127"
]
```

#### 3B. Contract Node Filtering:
```typescript
// isContractNode() filters for blockchain-relevant nodes:
contractNodes = [
  "accept-payment-125",    // RedotPay contract call
  "release-payment-126"    // RedotPay contract call
]
// buy-request, oracle-check, notification are filtered out (non-contract nodes)
```

#### 3C. Contract Call Mapping:
```typescript
const contractCalls = [
  // From accept-payment-125 node:
  {
    nodeId: "accept-payment-125",
    nodeName: "Accept Payment",
    contractAddress: "{{REDOT_PAY_CONTRACT_ADDRESS}}", 
    methodName: "acceptPayment",
    abi: "acceptPayment(address,uint256,address,uint256,uint256)",
    parameterTypes: ["address", "uint256", "address", "uint256", "uint256"],
    parameterNames: ["token", "amount", "recipient", "condition", "release_time"],
    parameters: {
      token: "0xA0b86a33E6C0cE0E8A49c6B7a3BA2a9a35e8F4b0",
      amount: "1000000000000000000",
      recipient: "0x742d35Cc6e0F4B9F2e7a5F8e0b8d5F5F5F5F5F5F",
      condition: 1,
      releaseTime: 1678987634
    },
    gasEstimate: 150000,
    requiresApproval: true
  },
  // From release-payment-126 node:
  {
    nodeId: "release-payment-126",
    nodeName: "Release Payment",
    contractAddress: "{{REDOT_PAY_CONTRACT_ADDRESS}}",
    methodName: "releasePayment", 
    abi: "releasePayment(uint256)",
    parameterTypes: ["uint256"],
    parameterNames: ["payment_id"],
    parameters: {
      payment_id: "${accept-payment-125_result.paymentId}" // Reference to previous result
    },
    gasEstimate: 80000,
    requiresApproval: false
  }
]
```

#### 3D. Dependency Graph Generation:
```typescript
const dependencies = [
  {
    from: "accept-payment-125",
    to: "release-payment-126", 
    condition: null  // Unconditional execution
  }
  // Only contract-to-contract dependencies are tracked
]
```

### Step 4: Final Export Object - `WorkflowContractExport`

```json
{
  "workflowId": "merchant-payment-workflow", 
  "version": "1.0.0",
  "contractCalls": [
    {
      "nodeId": "accept-payment-125",
      "nodeName": "Accept Payment", 
      "contractAddress": "{{REDOT_PAY_CONTRACT_ADDRESS}}",
      "methodName": "acceptPayment",
      "abi": "acceptPayment(address,uint256,address,uint256,uint256)",
      "parameterTypes": ["address", "uint256", "address", "uint256", "uint256"],
      "parameterNames": ["token", "amount", "recipient", "condition", "release_time"],
      "parameters": {
        "token": "0xA0b86a33E6C0cE0E8A49c6B7a3BA2a9a35e8F4b0",
        "amount": "1000000000000000000", 
        "recipient": "0x742d35Cc6e0F4B9F2e7a5F8e0b8d5F5F5F5F5F5F",
        "condition": 1,
        "releaseTime": 1678987634
      },
      "gasEstimate": 150000,
      "requiresApproval": true
    },
    {
      "nodeId": "release-payment-126",
      "nodeName": "Release Payment",
      "contractAddress": "{{REDOT_PAY_CONTRACT_ADDRESS}}",
      "methodName": "releasePayment",
      "abi": "releasePayment(uint256)", 
      "parameterTypes": ["uint256"],
      "parameterNames": ["payment_id"],
      "parameters": {
        "payment_id": "dynamic_from_previous_call"
      },
      "gasEstimate": 80000,
      "requiresApproval": false
    }
  ],
  "dependencies": [
    {
      "from": "accept-payment-125",
      "to": "release-payment-126",
      "condition": null
    }
  ],
  "metadata": {
    "createdAt": 1678901234567,
    "nodeCount": 5,        // Total nodes in workflow
    "contractCallCount": 2  // Only contract-relevant nodes
  }
}
```

## 🏗️ Solidity Generation Process

### Input: WorkflowContractExport → Output: Router Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * Auto-generated Router Contract for Workflow: merchant-payment-workflow
 * Generated on: 2024-03-15T10:30:45.567Z
 * 
 * This contract orchestrates the execution of your workflow on-chain.
 * Deploy this contract and call executeWorkflow() to run your automation.
 */

interface IRedotPayVault {
    function acceptPayment(address token, uint256 amount, address recipient, uint256 condition, uint256 release_time) external returns (uint256);
    function releasePayment(uint256 payment_id) external;
}

contract WorkflowRouter_merchant_payment_workflow {
    address public owner;
    IRedotPayVault public redotPayVault;
    
    // Workflow execution state
    mapping(uint256 => bool) public executionCompleted;
    uint256 public executionCounter;
    
    event WorkflowExecuted(uint256 indexed executionId, address indexed initiator);
    event StepCompleted(uint256 indexed executionId, string stepName, bytes result);
    
    constructor(address _redotPayVault) {
        owner = msg.sender;
        redotPayVault = IRedotPayVault(_redotPayVault);
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can execute");
        _;
    }
    
    /**
     * Execute the complete workflow
     * Parameters derived from all contract calls in the workflow
     */
    function executeWorkflow(
        address token,           // From accept-payment step
        uint256 amount,          // From accept-payment step  
        address recipient,       // From accept-payment step
        uint256 condition,       // From accept-payment step
        uint256 release_time,    // From accept-payment step
        uint256 payment_id       // From release-payment step
    ) external onlyOwner {
        uint256 executionId = ++executionCounter;
        
        // Step 1: Accept Payment
        acceptPayment(token, amount, recipient, condition, release_time);
        emit StepCompleted(executionId, "Accept Payment", "");
        
        // Step 2: Release Payment
        releasePayment(payment_id);
        emit StepCompleted(executionId, "Release Payment", "");
        
        executionCompleted[executionId] = true;
        emit WorkflowExecuted(executionId, msg.sender);
    }
    
    // Individual step functions
    function acceptPayment(address token, uint256 amount, address recipient, uint256 condition, uint256 release_time) internal {
        redotPayVault.acceptPayment(token, amount, recipient, condition, release_time);
    }
    
    function releasePayment(uint256 payment_id) internal {
        redotPayVault.releasePayment(payment_id);
    }
}
```

## 🎯 Key Export System Features

### 1. **Smart Filtering**
- Only contract-relevant nodes are exported
- UI-only nodes (notifications, validations) are filtered out
- Reduces contract complexity and gas costs

### 2. **Parameter Deduplication**  
```typescript
// If multiple nodes use same parameter, it's only included once in executeWorkflow()
const uniqueParams = new Set([
  "address token",    // Used by accept-payment
  "uint256 amount",   // Used by accept-payment  
  "address recipient", // Used by accept-payment
  "uint256 payment_id" // Used by release-payment
])
```

### 3. **Dependency Resolution**
```typescript
// Dependencies ensure correct execution order in generated contract
dependencies: [
  { from: "accept-payment", to: "release-payment" }
]

// Translates to sequential contract calls:
// acceptPayment(...);     // Step 1
// releasePayment(...);    // Step 2
```

### 4. **Template System**
```typescript
// Contract addresses use templates for easy replacement:
contractAddress: "{{REDOT_PAY_CONTRACT_ADDRESS}}"

// During deployment, merchant replaces with actual address:
// {{REDOT_PAY_CONTRACT_ADDRESS}} → 0x742d35Cc6e0F4B9F2e7a5F8e0b8d5F5F5F5F5F5F
```

## 🚀 The Magic: From Visual to Executable

```
Visual Workflow (5 nodes)
    ↓ [Filter Contract Nodes]
Contract Export (2 nodes)  
    ↓ [Generate Solidity]
Router Contract (deployable)
    ↓ [Deploy to Arbitrum]
executeWorkflow() method
    ↓ [Merchant Integration]  
Automated Business Logic
```

This system transforms visual business logic into executable smart contracts, making web3 integration accessible to merchants who think in workflows, not code!
