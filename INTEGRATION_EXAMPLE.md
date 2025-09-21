# Adding New Contract Integration - Example

This document demonstrates how easy it is to add new contract methods to the workflow builder system.

## Example: Adding a Price Oracle Contract

### Step 1: Add Contract ABI
```typescript
// lib/price-oracle-abi.ts
export const PRICE_ORACLE_ABI = [
  {
    inputs: [{ name: "asset", type: "string" }],
    name: "getPrice",
    outputs: [{ name: "price", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  }
] as const

export const PRICE_ORACLE_CONTRACT_ADDRESS = "0x..."
```

### Step 2: Add Blocks to Block Palette
```typescript
// components/block-palette.tsx - Add to blockCategories array
{
  name: "Oracle Blocks",
  blocks: [
    {
      id: "oracle-get-price",
      name: "Get Asset Price",
      description: "Fetch current price from oracle",
      icon: TrendingUp,
      color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    }
  ]
}
```

### Step 3: Add Processing Logic to Workflow Engine
```typescript
// lib/automation/workflow-engine.ts - Add to processNode switch statement
case "oracle-get-price":
  return this.processOracleGetPrice(node, context)

// Add the processing method
private async processOracleGetPrice(node: WorkflowNode, context: Record<string, any>) {
  const { asset } = node.config
  
  return {
    priceId: `price_${Date.now()}`,
    contractMethod: "getPrice",
    contractAddress: "{{PRICE_ORACLE_CONTRACT_ADDRESS}}",
    parameters: { asset },
    // ... implementation
  }
}
```

### Step 4: Add to Contract Export Mapping
```typescript
// lib/automation/workflow-engine.ts - Add to nodeToContractCall switch statement
case "oracle-get-price":
  return {
    ...baseCall,
    contractAddress: "{{PRICE_ORACLE_CONTRACT_ADDRESS}}",
    methodName: "getPrice",
    abi: "getPrice(string)",
    parameterTypes: ["string"],
    parameterNames: ["asset"],
    gasEstimate: 30000,
    requiresApproval: false,
  } as ContractCall
```

## That's it! 

The new oracle block will now:
- ✅ Appear in the block palette
- ✅ Be draggable to the workflow canvas  
- ✅ Execute properly in workflows
- ✅ Export to router contracts
- ✅ Generate proper Solidity code

The architecture is designed to make adding new contracts as simple as possible!
