# Contract Integration Patterns - Quick Reference

## 🎯 Core Integration Pattern (Copy-Paste Ready)

For every new contract method, follow this exact pattern:

### 1. Contract ABI Template
```typescript
// lib/{contract-name}-abi.ts
export const {CONTRACT_NAME}_ABI = [
  {
    inputs: [
      { name: "paramName", type: "paramType" },
      // Add more parameters as needed
    ],
    name: "methodName",
    outputs: [{ name: "returnName", type: "returnType" }],
    stateMutability: "nonpayable", // or "view", "pure", "payable"
    type: "function",
  }
  // Add more methods as needed
] as const

export const {CONTRACT_NAME}_ADDRESS = "0x..." // Your deployed contract address
```

### 2. Block Definition Template
```typescript
// components/block-palette.tsx - Add to blockCategories array
{
  name: "Your Category Name",
  blocks: [
    {
      id: "your-method-id",           // This becomes the block type identifier
      name: "Display Name",          // Shown in UI
      description: "What it does",   // Tooltip text
      icon: SomeIcon,               // Import icon from lucide-react
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30", // Visual styling
    }
  ]
}
```

### 3. Processing Logic Template
```typescript
// lib/automation/workflow-engine.ts

// A. Add to processNode() switch statement:
case "your-method-id":
  return this.processYourMethod(node, context)

// B. Add processing method:
private async processYourMethod(node: WorkflowNode, context: Record<string, any>) {
  const { param1, param2 } = node.config  // Extract user-configured parameters
  
  return {
    // Unique result identifier
    resultId: `your_method_${Date.now()}`,
    
    // Contract call information
    contractMethod: "methodName",
    contractAddress: "YOUR_CONTRACT_ADDRESS",
    parameters: {
      param1,
      param2,
      // Map all parameters
    },
    
    // Execution result (mock for now, real contract call in production)
    transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    status: "executed",
    timestamp: Date.now(),
  }
}
```

### 4. Contract Export Template
```typescript
// lib/automation/workflow-engine.ts

// A. Add to isContractNode() method:
private isContractNode(nodeType: string): boolean {
  return nodeType.startsWith("redot-") || 
         nodeType.includes("auction") ||
         nodeType === "data-store" ||
         nodeType === "your-method-id"  // Add your block type
}

// B. Add to nodeToContractCall() switch statement:
case "your-method-id":
  return {
    ...baseCall,
    contractAddress: "{{YOUR_CONTRACT_ADDRESS}}", // Template placeholder
    methodName: "methodName",
    abi: "methodName(type1,type2)",              // Function signature
    parameterTypes: ["type1", "type2"],          // Solidity types
    parameterNames: ["param1", "param2"],        // Parameter names
    gasEstimate: 100000,                         // Estimated gas usage
    requiresApproval: false,                     // Token approval needed?
  } as ContractCall
```

## 🔄 Integration Workflow

```
1. CREATE_ABI → 2. ADD_BLOCK → 3. ADD_PROCESSING → 4. ADD_EXPORT → 5. TEST
```

## 📋 Real Example: Adding Price Oracle

### Step 1: ABI
```typescript
// lib/price-oracle-abi.ts
export const PRICE_ORACLE_ABI = [
  {
    inputs: [{ name: "asset", type: "string" }],
    name: "getLatestPrice",
    outputs: [{ name: "price", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  }
] as const

export const PRICE_ORACLE_ADDRESS = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
```

### Step 2: Block
```typescript
// components/block-palette.tsx
{
  id: "oracle-get-price",
  name: "Get Asset Price", 
  description: "Fetch latest price from Chainlink oracle",
  icon: TrendingUp,
  color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
}
```

### Step 3: Processing
```typescript
// lib/automation/workflow-engine.ts
case "oracle-get-price":
  return this.processOracleGetPrice(node, context)

private async processOracleGetPrice(node: WorkflowNode, context: Record<string, any>) {
  const { asset } = node.config
  
  return {
    priceCheckId: `price_${Date.now()}`,
    contractMethod: "getLatestPrice", 
    contractAddress: "PRICE_ORACLE_ADDRESS",
    parameters: { asset },
    transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
    status: "executed",
    timestamp: Date.now(),
  }
}
```

### Step 4: Export
```typescript
// lib/automation/workflow-engine.ts
case "oracle-get-price":
  return {
    ...baseCall,
    contractAddress: "{{PRICE_ORACLE_ADDRESS}}",
    methodName: "getLatestPrice",
    abi: "getLatestPrice(string)",
    parameterTypes: ["string"],
    parameterNames: ["asset"],
    gasEstimate: 50000,
    requiresApproval: false,
  } as ContractCall
```

## 🎨 Generated Contract Pattern

Every workflow generates this structure:

```solidity
contract WorkflowRouter_merchantFlow {
    // Interface for your contract
    interface IYourContract {
        function methodName(type1 param1, type2 param2) external returns (returnType);
    }
    
    IYourContract public yourContract;
    
    constructor(address _yourContract) {
        yourContract = IYourContract(_yourContract);
    }
    
    function executeWorkflow(
        type1 param1,
        type2 param2
    ) external onlyOwner {
        // Your method call
        yourContract.methodName(param1, param2);
        
        // Other contract calls in sequence...
        
        emit WorkflowExecuted(executionId, msg.sender);
    }
}
```

## 🚨 Key Points to Remember

1. **Block ID = Processing Case**: The `id` in block palette must match the `case` in processNode()
2. **Parameter Mapping**: `node.config` contains user-set parameters from UI
3. **Contract Address Templating**: Use `{{CONTRACT_ADDRESS}}` for replacement during generation
4. **Gas Estimation**: Provide realistic gas estimates for user planning
5. **Return Data**: Processing methods should return structured data for logging/chaining

## 🔧 Testing Your Integration

1. Add your block to palette
2. Drag to canvas  
3. Configure parameters in UI
4. Export workflow
5. Check generated Solidity code
6. Deploy and test contract

This pattern makes every contract integration follow the same predictable structure!
