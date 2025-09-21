# Workflow Engine Deep Dive - How It All Works

## 🏗️ Core Data Structures

### 1. WorkflowNode - The Basic Building Block
```typescript
interface WorkflowNode {
  id: string              // Unique identifier: "redot-accept-payment-1678901234"
  type: string            // Block type: "redot-accept-payment" 
  name: string            // Display name: "Accept Payment"
  config: Record<string, any>  // User parameters: { token: "0x...", amount: 1000 }
  connections: string[]   // Connected node IDs: ["redot-release-payment-1678901235"]
  position: { x: number; y: number }  // Canvas coordinates
}
```

### 2. WorkflowExecution - Runtime State
```typescript
interface WorkflowExecution {
  id: string              // "exec_1678901234_abc123"
  workflowId: string      // "merchant-payment-flow"
  status: "pending" | "running" | "completed" | "failed"
  currentNode: string | null  // Currently executing node ID
  startTime: number       // Timestamp
  endTime?: number        // Completion timestamp
  logs: WorkflowLog[]     // Execution logs
  context: Record<string, any>  // Shared data between nodes
}
```

### 3. ContractCall - Export Structure
```typescript
interface ContractCall {
  nodeId: string          // Links back to original node
  nodeName: string        // "Accept Payment"
  contractAddress: string // "{{REDOT_PAY_CONTRACT_ADDRESS}}"
  methodName: string      // "acceptPayment"
  abi: string            // "acceptPayment(address,uint256,address,uint256,uint256)"
  parameterTypes: string[] // ["address", "uint256", "address", "uint256", "uint256"]
  parameterNames: string[] // ["token", "amount", "recipient", "condition", "release_time"]
  parameters: Record<string, any>  // Actual values from user
  gasEstimate: number     // 150000
  requiresApproval: boolean // true (for token approvals)
}
```

## 🔄 Workflow Engine Execution Flow

```mermaid
graph TD
    A[executeWorkflow() called] --> B[Create WorkflowExecution object]
    B --> C[Find start node - no incoming connections]
    C --> D[executeNode() recursively]
    D --> E[processNode() - handle specific block type]
    E --> F[Update context with results]
    F --> G[Execute connected nodes]
    G --> H[Complete execution]
    
    subgraph "processNode() Switch"
        E --> E1[redot-accept-payment]
        E --> E2[redot-release-payment]
        E --> E3[oracle-price-check]
        E --> E4[custom-contract-method]
    end
```

### Execution Example:
```typescript
// 1. User creates workflow: Buy Request → Oracle Check → Accept Payment → Release Payment

// 2. Execution starts:
const executionId = await workflowEngine.executeWorkflow("merchant-flow", nodes, {
  customerAddress: "0x123...",
  merchantAddress: "0x456...",
  amount: 1000
})

// 3. Engine finds start node (Buy Request) and begins execution
// 4. Each node processes and updates shared context:
context = {
  "buy-request-node_result": { requestId: "req_123", amount: 1000 },
  "oracle-check-node_result": { priceValid: true, currentPrice: 950 },
  "accept-payment-node_result": { paymentId: "pay_456", txHash: "0x..." }
}
```

## 🎯 The Export System - How Workflows Become Contracts

### Step 1: Export Workflow for Contract
```typescript
exportWorkflowForContract(workflowId: string, nodes: WorkflowNode[]): WorkflowContractExport
```

**What this does:**
1. **Topological Sort**: Orders nodes by execution dependencies
2. **Filter Contract Nodes**: Only includes blockchain-relevant nodes
3. **Generate Contract Calls**: Maps each node to a `ContractCall` object
4. **Build Dependencies**: Creates execution order mapping

### Step 2: The Dependency Graph System

```typescript
interface WorkflowDependency {
  from: string      // Source node ID
  to: string        // Target node ID  
  condition: string | null  // Optional execution condition
}
```

**Example Dependency Graph:**
```typescript
// Workflow: Accept Payment → Release Payment → Send Notification
dependencies: [
  {
    from: "accept-payment-123",
    to: "release-payment-124", 
    condition: null  // Always execute
  },
  {
    from: "release-payment-124",
    to: "send-notification-125",
    condition: null
  }
]
```

### Step 3: The Complete Export Object

```typescript
interface WorkflowContractExport {
  workflowId: string           // "merchant-payment-workflow"
  version: string              // "1.0.0"
  contractCalls: ContractCall[] // Array of contract method calls
  dependencies: WorkflowDependency[] // Execution order
  metadata: {
    createdAt: number          // 1678901234567
    nodeCount: number          // 4 (total nodes in workflow)
    contractCallCount: number  // 2 (only contract-relevant nodes)
  }
}
```

**Real Export Example:**
```json
{
  "workflowId": "merchant-payment-flow",
  "version": "1.0.0",
  "contractCalls": [
    {
      "nodeId": "redot-accept-payment-1678901234",
      "nodeName": "Accept Payment",
      "contractAddress": "{{REDOT_PAY_CONTRACT_ADDRESS}}",
      "methodName": "acceptPayment",
      "abi": "acceptPayment(address,uint256,address,uint256,uint256)",
      "parameterTypes": ["address", "uint256", "address", "uint256", "uint256"],
      "parameterNames": ["token", "amount", "recipient", "condition", "release_time"],
      "parameters": {
        "token": "0xA0b86a33E6C0cE0E8A49c6B7a3BA2a9a35e8F4b0",
        "amount": 1000000000000000000,
        "recipient": "0x742d35Cc6e0F4B9F2e7a5F8e0b8d5F5F5F5F5F5F",
        "condition": 1,
        "release_time": 1678987634
      },
      "gasEstimate": 150000,
      "requiresApproval": true
    },
    {
      "nodeId": "redot-release-payment-1678901235",
      "nodeName": "Release Payment", 
      "contractAddress": "{{REDOT_PAY_CONTRACT_ADDRESS}}",
      "methodName": "releasePayment",
      "abi": "releasePayment(uint256)",
      "parameterTypes": ["uint256"],
      "parameterNames": ["payment_id"],
      "parameters": {
        "payment_id": "${previous_payment_id}"
      },
      "gasEstimate": 80000,
      "requiresApproval": false
    }
  ],
  "dependencies": [
    {
      "from": "redot-accept-payment-1678901234",
      "to": "redot-release-payment-1678901235",
      "condition": null
    }
  ],
  "metadata": {
    "createdAt": 1678901234567,
    "nodeCount": 4,
    "contractCallCount": 2
  }
}
```

## 🔄 Node Processing Deep Dive

### How `processNode()` Works:

```typescript
private async processNode(node: WorkflowNode, context: Record<string, any>): Promise<any>
```

**The Big Switch Statement:**
```typescript
switch (node.type) {
  case "redot-accept-payment":
    return this.processRedotAcceptPayment(node, context)
  case "oracle-price-check":
    return this.processOraclePriceCheck(node, context)  
  // ... more cases
}
```

### Example Processing Method:
```typescript
private async processRedotAcceptPayment(node: WorkflowNode, context: Record<string, any>) {
  // 1. Extract user-configured parameters
  const { token, amount, recipient, condition, releaseTime } = node.config
  
  // 2. Generate unique IDs
  const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // 3. Return structured result
  return {
    paymentId,                    // For other nodes to reference
    contractMethod: "acceptPayment",
    contractAddress: "REDOT_PAY_CONTRACT_ADDRESS",
    parameters: {
      token,
      amount: Number(amount),
      recipient,
      condition: Number(condition), 
      releaseTime: Number(releaseTime),
    },
    transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`, // Mock tx
    status: "confirmed",
    timestamp: Date.now(),
  }
}
```

## 🏭 Contract Generation Process

### Step 1: Topological Sort
```typescript
private topologicalSort(nodes: WorkflowNode[]): WorkflowNode[]
```

**What it does:** 
- Sorts nodes by execution dependencies
- Ensures parent nodes execute before child nodes
- Detects circular dependencies

**Algorithm:**
1. Find nodes with no incoming connections (start nodes)
2. Visit each node depth-first
3. Mark visited nodes and detect cycles
4. Return nodes in execution order

### Step 2: Contract Call Mapping
```typescript
private nodeToContractCall(node: WorkflowNode): ContractCall
```

**The mapping process:**
```typescript
switch (node.type) {
  case "redot-accept-payment":
    return {
      contractAddress: "{{REDOT_PAY_CONTRACT_ADDRESS}}",  // Template
      methodName: "acceptPayment",
      abi: "acceptPayment(address,uint256,address,uint256,uint256)",
      parameterTypes: ["address", "uint256", "address", "uint256", "uint256"],
      parameterNames: ["token", "amount", "recipient", "condition", "release_time"],
      gasEstimate: 150000,
      requiresApproval: true,  // Needs token approval first
    }
}
```

### Step 3: Solidity Generation
```typescript
generateRouterContractCode(workflowExport: WorkflowContractExport): string
```

**Generated contract structure:**
```solidity
contract WorkflowRouter_merchantFlow {
    // 1. Interface definitions
    interface IRedotPayVault {
        function acceptPayment(address,uint256,address,uint256,uint256) external returns(uint256);
        function releasePayment(uint256) external;
    }
    
    // 2. State variables
    IRedotPayVault public redotPayVault;
    mapping(uint256 => bool) public executionCompleted;
    uint256 public executionCounter;
    
    // 3. Main execution function
    function executeWorkflow(
        address token,
        uint256 amount, 
        address recipient,
        uint256 condition,
        uint256 release_time,
        uint256 payment_id
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
    
    // 4. Individual step functions
    function acceptPayment(address token, uint256 amount, address recipient, uint256 condition, uint256 release_time) internal {
        redotPayVault.acceptPayment(token, amount, recipient, condition, release_time);
    }
    
    function releasePayment(uint256 payment_id) internal {
        redotPayVault.releasePayment(payment_id);
    }
}
```

## 🎛️ Key Algorithmic Insights

### 1. Context Passing Between Nodes
```typescript
// Each node result is stored in context with key: `${nodeId}_result`
execution.context[`${node.id}_result`] = result

// Later nodes can access previous results:
const previousPaymentData = context[`${node.config.paymentNodeId}_result`]
```

### 2. Parameter Deduplication
```typescript
private generateWorkflowParameters(calls: ContractCall[]): string {
  const params = new Set<string>()  // Removes duplicates
  
  for (const call of calls) {
    for (let i = 0; i < call.parameterTypes.length; i++) {
      const paramType = call.parameterTypes[i]
      const paramName = call.parameterNames[i]
      params.add(`${paramType} ${paramName}`)  // "address token", "uint256 amount"
    }
  }
  
  return Array.from(params).join(', ')  // Final function signature
}
```

### 3. Dependency Resolution
```typescript
// Dependencies track execution order:
dependencies: [
  { from: "accept-payment", to: "release-payment" },  
  { from: "release-payment", to: "send-notification" }
]

// This creates the execution chain:
// accept-payment → release-payment → send-notification
```

## 🚀 End-to-End Flow Summary

```
1. User Creates Workflow (UI) → WorkflowBlock[]
2. Canvas Converts to Engine Format → WorkflowNode[]  
3. Export Processes Nodes → WorkflowContractExport
4. Generate Solidity Code → Router Contract
5. Deploy to Arbitrum → Executable Contract
6. Merchant Calls executeWorkflow() → Automated Execution
```

The brilliance of this system is that it transforms visual workflow design into executable smart contracts, bridging the gap between business logic and blockchain execution!
