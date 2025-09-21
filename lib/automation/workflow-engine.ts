"use client"

export interface WorkflowNode {
  id: string
  type: string
  name: string
  config: Record<string, any>
  connections: string[]
  position: { x: number; y: number }
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: "pending" | "running" | "completed" | "failed"
  currentNode: string | null
  startTime: number
  endTime?: number
  logs: WorkflowLog[]
  context: Record<string, any>
}

export interface WorkflowLog {
  timestamp: number
  nodeId: string
  level: "info" | "warning" | "error"
  message: string
  data?: any
}

export interface OutputDefinition {
  index: number         // Position in return tuple (0-based)
  name: string         // "paymentId", "fee", "transactionHash"
  type: string         // "uint256", "bytes32", "address"
  description?: string // Optional description for UI
}

export interface InputMapping {
  parameterName: string  // This node's input parameter name
  sourceNodeId: string  // Node ID that provides the value
  sourceOutput: string  // Output name from source node
  sourceOutputIndex: number // Output index from source node
}

export interface OutputToInputMap {
  fromOutput: string     // Source output name
  fromOutputIndex: number // Source output index  
  toInput: string        // Target input parameter name
  toInputIndex: number   // Target input parameter index
}

export interface ContractCall {
  nodeId: string
  nodeName: string
  contractAddress: string
  methodName: string
  abi: string
  parameterTypes: string[]
  parameterNames: string[]
  parameters: Record<string, any>
  gasEstimate: number
  requiresApproval: boolean
  outputs?: OutputDefinition[]  // What this method returns
  inputMappings?: InputMapping[] // Where this node's inputs come from
}

export interface WorkflowDependency {
  from: string
  to: string
  condition: string | null
  dataMapping?: OutputToInputMap[]  // Output-to-input parameter mappings
}

export interface WorkflowContractExport {
  workflowId: string
  version: string
  contractCalls: ContractCall[]
  dependencies: WorkflowDependency[]
  metadata: {
    createdAt: number
    nodeCount: number
    contractCallCount: number
  }
}

export interface VMInstruction {
  opcode: number           // 0=add, 1=mul, 2=isEven, 3=special, 4=return
  nodeId: string          // Source workflow node ID  
  nodeName: string        // Human readable name
  args: number[]          // Buffer slot arguments (e.g., [0, 1] for add)
  result?: number         // Buffer slot for result (if applicable)
}

export interface VMSlotAllocation {
  slotIndex: number       // Buffer slot index (0-255)
  nodeId: string         // Node that writes to this slot
  outputName: string     // Semantic name like "sum", "product"
  dataType: "uint256" | "bool"    // Data type determines which buffer array
  isInput: boolean       // True if this is an initial input value
  value?: number | boolean         // For input slots, the initial value
}

export interface WorkflowVMExport {
  workflowId: string
  version: string
  vmInstructions: VMInstruction[]
  slotAllocations: VMSlotAllocation[]
  initialUint256Values: number[]     // Values for uint256 input slots
  initialBoolValues: boolean[]       // Values for bool input slots
  bytecode: string           // Generated hex bytecode
  metadata: {
    createdAt: number
    nodeCount: number
    vmInstructionCount: number
    uint256SlotsUsed: number
    boolSlotsUsed: number
  }
}

export class WorkflowEngine {
  private executions: Map<string, WorkflowExecution> = new Map()
  private eventListeners: Map<string, Function[]> = new Map()
  private allNodes: WorkflowNode[] = [] // Temporary storage for input mapping generation

  async executeWorkflow(workflowId: string, nodes: WorkflowNode[], context: Record<string, any> = {}): Promise<string> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: "pending",
      currentNode: null,
      startTime: Date.now(),
      logs: [],
      context,
    }

    this.executions.set(executionId, execution)
    this.emit("execution:started", execution)

    try {
      await this.runWorkflow(execution, nodes)
    } catch (error) {
      execution.status = "failed"
      execution.endTime = Date.now()
      this.addLog(execution, "error", "workflow", `Workflow execution failed: ${error}`)
      this.emit("execution:failed", execution)
    }

    return executionId
  }

  private async runWorkflow(execution: WorkflowExecution, nodes: WorkflowNode[]) {
    execution.status = "running"
    this.emit("execution:running", execution)

    // Find start node (node with no incoming connections)
    const startNode = nodes.find((node) => !nodes.some((n) => n.connections.includes(node.id)))

    if (!startNode) {
      throw new Error("No start node found in workflow")
    }

    await this.executeNode(execution, startNode, nodes)

    execution.status = "completed"
    execution.endTime = Date.now()
    this.emit("execution:completed", execution)
  }

  private async executeNode(execution: WorkflowExecution, node: WorkflowNode, allNodes: WorkflowNode[]) {
    execution.currentNode = node.id
    this.addLog(execution, "info", node.id, `Executing node: ${node.name}`)

    try {
      const result = await this.processNode(node, execution.context)

      // Update context with node result
      execution.context[`${node.id}_result`] = result

      this.addLog(execution, "info", node.id, `Node completed successfully`)

      // Execute connected nodes
      for (const connectionId of node.connections) {
        const nextNode = allNodes.find((n) => n.id === connectionId)
        if (nextNode) {
          await this.executeNode(execution, nextNode, allNodes)
        }
      }
    } catch (error) {
      this.addLog(execution, "error", node.id, `Node execution failed: ${error}`)
      throw error
    }
  }

  private async processNode(node: WorkflowNode, context: Record<string, any>): Promise<any> {
    switch (node.type) {
      // VM blocks
      case "vm-number-constant":
        return this.processVMNumberConstant(node, context)
      case "vm-bool-constant":
        return this.processVMBoolConstant(node, context)
      case "vm-add":
        return this.processVMAdd(node, context)
      case "vm-mul":
        return this.processVMMul(node, context)
      case "vm-iseven":
        return this.processVMIsEven(node, context)
      case "vm-equal":
        return this.processVMEqual(node, context)
      case "vm-greater":
        return this.processVMGreater(node, context)
      case "vm-less":
        return this.processVMLess(node, context)
      case "vm-special":
        return this.processVMSpecial(node, context)
      case "vm-return-number":
        return this.processVMReturnNumber(node, context)
      case "vm-return-bool":
        return this.processVMReturnBool(node, context)
        
      // Workflow trigger blocks
      case "buy-request":
        return this.processBuyRequest(node, context)
      case "oracle-price-check":
        return this.processOraclePriceCheck(node, context)
        
      // RedotPay contract blocks
      case "redot-accept-payment":
        return this.processRedotAcceptPayment(node, context)
      case "redot-freeze-payment":
        return this.processRedotFreezePayment(node, context)
      case "redot-release-payment":
        return this.processRedotReleasePayment(node, context)
      case "redot-refund-payment":
        return this.processRedotRefundPayment(node, context)
        
      // Auction blocks
      case "list-item":
        return this.processListItem(node, context)
      case "start-auction":
        return this.processStartAuction(node, context)
      case "accept-bid":
        return this.processAcceptBid(node, context)
      case "end-auction":
        return this.processEndAuction(node, context)
        
      // Legacy payment blocks (keep for backward compatibility)
      case "escrow-payment":
        return this.processEscrowPayment(node, context)
      case "release-payment":
        return this.processReleasePayment(node, context)
      case "refund-payment":
        return this.processRefundPayment(node, context)
        
      // Automation blocks
      case "settlement":
        return this.processSettlement(node, context)
      case "notification":
        return this.processNotification(node, context)
      case "validation":
        return this.processValidation(node, context)
      case "data-store":
        return this.processDataStore(node, context)
        
      default:
        throw new Error(`Unknown node type: ${node.type}`)
    }
  }

  private async processListItem(node: WorkflowNode, context: Record<string, any>) {
    const { title, description, reservePrice, duration, currency } = node.config

    return {
      itemId: `item_${Date.now()}`,
      title,
      description,
      reservePrice,
      duration,
      currency,
      status: "listed",
    }
  }

  private async processStartAuction(node: WorkflowNode, context: Record<string, any>) {
    const itemData = context[`${node.config.itemNodeId}_result`]

    if (!itemData) {
      throw new Error("No item data found for auction start")
    }

    // Simulate auction creation
    const auctionId = `auction_${Date.now()}`

    return {
      auctionId,
      startTime: Date.now(),
      endTime: Date.now() + itemData.duration * 1000,
      status: "active",
      currentBid: 0,
      bidCount: 0,
    }
  }

  private async processAcceptBid(node: WorkflowNode, context: Record<string, any>) {
    const { bidAmount, bidder } = node.config

    return {
      bidId: `bid_${Date.now()}`,
      bidder,
      amount: bidAmount,
      timestamp: Date.now(),
      status: "accepted",
    }
  }

  private async processEndAuction(node: WorkflowNode, context: Record<string, any>) {
    const auctionData = context[`${node.config.auctionNodeId}_result`]

    return {
      ...auctionData,
      status: "ended",
      endTime: Date.now(),
    }
  }

  private async processEscrowPayment(node: WorkflowNode, context: Record<string, any>) {
    const { amount, token, recipient } = node.config

    return {
      escrowId: `escrow_${Date.now()}`,
      amount,
      token,
      recipient,
      status: "escrowed",
      timestamp: Date.now(),
    }
  }

  private async processReleasePayment(node: WorkflowNode, context: Record<string, any>) {
    const escrowData = context[`${node.config.escrowNodeId}_result`]

    return {
      ...escrowData,
      status: "released",
      releaseTime: Date.now(),
    }
  }

  private async processRefundPayment(node: WorkflowNode, context: Record<string, any>) {
    const escrowData = context[`${node.config.escrowNodeId}_result`]

    return {
      ...escrowData,
      status: "refunded",
      refundTime: Date.now(),
    }
  }

  private async processSettlement(node: WorkflowNode, context: Record<string, any>) {
    const auctionData = context[`${node.config.auctionNodeId}_result`]

    // Simulate automated settlement
    return {
      settlementId: `settlement_${Date.now()}`,
      auctionId: auctionData.auctionId,
      winnerPaid: true,
      loserRefunded: true,
      timestamp: Date.now(),
    }
  }

  private async processNotification(node: WorkflowNode, context: Record<string, any>) {
    const { type, recipients, message } = node.config

    // Simulate notification sending
    return {
      notificationId: `notif_${Date.now()}`,
      type,
      recipients,
      message,
      sent: true,
      timestamp: Date.now(),
    }
  }

  private async processValidation(node: WorkflowNode, context: Record<string, any>) {
    const { condition, value } = node.config

    // Simulate validation logic
    const isValid = this.evaluateCondition(condition, value, context)

    return {
      validationId: `validation_${Date.now()}`,
      condition,
      value,
      isValid,
      timestamp: Date.now(),
    }
  }

  // New workflow trigger blocks
  private async processBuyRequest(node: WorkflowNode, context: Record<string, any>) {
    const { productId, quantity, customerAddress, totalAmount, token } = node.config

    return {
      requestId: `buy_req_${Date.now()}`,
      productId,
      quantity: Number(quantity) || 1,
      customerAddress,
      totalAmount: Number(totalAmount),
      token,
      timestamp: Date.now(),
      status: "initiated",
    }
  }

  private async processOraclePriceCheck(node: WorkflowNode, context: Record<string, any>) {
    const { oracleAddress, productId, priceThreshold } = node.config

    // In a real implementation, this would call an oracle contract
    // For now, simulate price validation
    const currentPrice = Math.random() * 1000 // Mock price
    const isValidPrice = currentPrice <= Number(priceThreshold)

    return {
      priceCheckId: `price_check_${Date.now()}`,
      oracleAddress,
      productId,
      currentPrice,
      priceThreshold: Number(priceThreshold),
      isValidPrice,
      timestamp: Date.now(),
    }
  }

  // RedotPay contract blocks
  private async processRedotAcceptPayment(node: WorkflowNode, context: Record<string, any>) {
    const { token, amount, recipient, condition, releaseTime } = node.config

    // This would make an actual contract call in production
    // For now, simulate the contract call
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      paymentId,
      contractMethod: "acceptPayment",
      contractAddress: "REDOT_PAY_CONTRACT_ADDRESS",
      parameters: {
        token,
        amount: Number(amount),
        recipient,
        condition: Number(condition),
        releaseTime: Number(releaseTime),
      },
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`, // Mock tx hash
      status: "confirmed",
      timestamp: Date.now(),
    }
  }

  private async processRedotFreezePayment(node: WorkflowNode, context: Record<string, any>) {
    const { paymentId, freezePeriod } = node.config

    return {
      freezeId: `freeze_${Date.now()}`,
      contractMethod: "freezePayment",
      contractAddress: "REDOT_PAY_CONTRACT_ADDRESS",
      parameters: {
        paymentId,
        freezePeriod: Number(freezePeriod),
      },
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      status: "frozen",
      timestamp: Date.now(),
    }
  }

  private async processRedotReleasePayment(node: WorkflowNode, context: Record<string, any>) {
    const { paymentId } = node.config

    return {
      releaseId: `release_${Date.now()}`,
      contractMethod: "releasePayment", 
      contractAddress: "REDOT_PAY_CONTRACT_ADDRESS",
      parameters: {
        paymentId,
      },
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      status: "released",
      timestamp: Date.now(),
    }
  }

  private async processRedotRefundPayment(node: WorkflowNode, context: Record<string, any>) {
    const { paymentId } = node.config

    return {
      refundId: `refund_${Date.now()}`,
      contractMethod: "refundPayment",
      contractAddress: "REDOT_PAY_CONTRACT_ADDRESS", 
      parameters: {
        paymentId,
      },
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      status: "refunded",
      timestamp: Date.now(),
    }
  }

  private async processDataStore(node: WorkflowNode, context: Record<string, any>) {
    const { dataKey, dataValue, storageType } = node.config

    return {
      storeId: `store_${Date.now()}`,
      dataKey,
      dataValue,
      storageType: storageType || "on-chain",
      transactionHash: storageType === "on-chain" ? `0x${Math.random().toString(16).substr(2, 64)}` : null,
      timestamp: Date.now(),
    }
  }

  // VM Block Processing Methods
  private async processVMNumberConstant(node: WorkflowNode, context: Record<string, any>) {
    const { constantValue } = node.config || { constantValue: 0 }
    
    return {
      inputId: `vm_number_constant_${Date.now()}`,
      nodeType: "vm-number-constant",
      constantValue: Number(constantValue) || 0,
      dataType: "uint256",
      timestamp: Date.now(),
    }
  }

  private async processVMBoolConstant(node: WorkflowNode, context: Record<string, any>) {
    const { constantValue } = node.config || { constantValue: false }
    
    return {
      inputId: `vm_bool_constant_${Date.now()}`,
      nodeType: "vm-bool-constant", 
      constantValue: Boolean(constantValue),
      dataType: "bool",
      timestamp: Date.now(),
    }
  }

  private async processVMAdd(node: WorkflowNode, context: Record<string, any>) {
    const { valueA, valueB } = node.config
    
    return {
      operationId: `vm_add_${Date.now()}`,
      nodeType: "vm-add", 
      opcode: 0,
      operation: "add",
      inputs: { valueA, valueB },
      timestamp: Date.now(),
    }
  }

  private async processVMMul(node: WorkflowNode, context: Record<string, any>) {
    const { valueA, valueB } = node.config
    
    return {
      operationId: `vm_mul_${Date.now()}`,
      nodeType: "vm-mul",
      opcode: 1, 
      operation: "multiply",
      inputs: { valueA, valueB },
      timestamp: Date.now(),
    }
  }

  private async processVMIsEven(node: WorkflowNode, context: Record<string, any>) {
    const { value } = node.config
    
    return {
      operationId: `vm_iseven_${Date.now()}`,
      nodeType: "vm-iseven",
      opcode: 2,
      operation: "isEven",
      inputs: { value },
      timestamp: Date.now(),
    }
  }

  private async processVMSpecial(node: WorkflowNode, context: Record<string, any>) {
    return {
      operationId: `vm_special_${Date.now()}`,
      nodeType: "vm-special",
      opcode: 3,
      operation: "special",
      inputs: {},
      result: 69,
      timestamp: Date.now(),
    }
  }

  private async processVMReturnNumber(node: WorkflowNode, context: Record<string, any>) {
    return {
      returnId: `vm_return_number_${Date.now()}`,
      nodeType: "vm-return-number",
      dataType: "uint256",
      opcode: 4,
      timestamp: Date.now(),
    }
  }

  private async processVMReturnBool(node: WorkflowNode, context: Record<string, any>) {
    return {
      returnId: `vm_return_bool_${Date.now()}`,
      nodeType: "vm-return-bool",
      dataType: "bool",
      opcode: 8,
      timestamp: Date.now(),
    }
  }

  // New comparison VM operations
  private async processVMEqual(node: WorkflowNode, context: Record<string, any>) {
    return {
      operationId: `vm_equal_${Date.now()}`,
      nodeType: "vm-equal",
      operation: "equal",
      opcode: 5,
      dataType: "bool",
      timestamp: Date.now(),
    }
  }

  private async processVMGreater(node: WorkflowNode, context: Record<string, any>) {
    return {
      operationId: `vm_greater_${Date.now()}`,
      nodeType: "vm-greater",
      operation: "greater",
      opcode: 6,
      dataType: "bool",
      timestamp: Date.now(),
    }
  }

  private async processVMLess(node: WorkflowNode, context: Record<string, any>) {
    return {
      operationId: `vm_less_${Date.now()}`,
      nodeType: "vm-less",
      operation: "less",
      opcode: 7,
      dataType: "bool", 
      timestamp: Date.now(),
    }
  }

  private evaluateCondition(condition: string, value: any, context: Record<string, any>): boolean {
    // Simple condition evaluation - in real implementation, use a proper expression evaluator
    switch (condition) {
      case "greater_than":
        return Number(value) > 0
      case "not_empty":
        return value != null && value !== ""
      default:
        return true
    }
  }

  private addLog(
    execution: WorkflowExecution,
    level: "info" | "warning" | "error",
    nodeId: string,
    message: string,
    data?: any,
  ) {
    execution.logs.push({
      timestamp: Date.now(),
      nodeId,
      level,
      message,
      data,
    })
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event) || []
    listeners.forEach((listener) => listener(data))
  }

  on(event: string, listener: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId)
  }

  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values())
  }

  // VM Export Functionality for VM Bytecode Generation
  exportWorkflowForVM(workflowId: string, nodes: WorkflowNode[]): WorkflowVMExport {
    // Store all nodes for connection resolution
    this.allNodes = nodes
    
    const sortedNodes = this.topologicalSort(nodes)
    const vmNodes = sortedNodes.filter(node => this.isVMNode(node.type))
    
    // Allocate buffer slots
    const slotAllocations = this.allocateVMSlots(vmNodes)
    console.log('[VM] Final slot allocations after allocation:', slotAllocations)
    
    // Generate VM instructions
    const vmInstructions = this.generateVMInstructions(vmNodes, slotAllocations)
    console.log('[VM] Generated VM instructions:', vmInstructions)
    
    // Extract initial values from input nodes
    const initialValues = this.extractInitialValues(vmNodes)
    
    // Generate bytecode
    const bytecode = this.generateVMBytecode(initialValues, vmInstructions)
    
    const uint256SlotsUsed = slotAllocations.filter(s => s.dataType === 'uint256').length
    const boolSlotsUsed = slotAllocations.filter(s => s.dataType === 'bool').length
    
    return {
      workflowId,
      version: "1.0.0",
      vmInstructions,
      slotAllocations,
      initialUint256Values: initialValues.uint256Values,
      initialBoolValues: initialValues.boolValues,
      bytecode,
      metadata: {
        createdAt: Date.now(),
        nodeCount: nodes.length,
        vmInstructionCount: vmInstructions.length,
        uint256SlotsUsed,
        boolSlotsUsed
      }
    }
  }

  // Contract Export Functionality for Router Contract Generation
  exportWorkflowForContract(workflowId: string, nodes: WorkflowNode[]): WorkflowContractExport {
    const contractCalls: ContractCall[] = []
    const dependencies: WorkflowDependency[] = []
    
    // Sort nodes by execution order (topological sort based on connections)
    const sortedNodes = this.topologicalSort(nodes)
    
    // Store reference to all nodes for input mapping generation
    this.allNodes = nodes
    
    for (const node of sortedNodes) {
      if (this.isContractNode(node.type)) {
        const contractCall = this.nodeToContractCallWithNodes(node, nodes)
        contractCalls.push(contractCall)
        
        // Add dependencies with data mapping
        for (const connectionId of node.connections) {
          const targetNode = nodes.find(n => n.id === connectionId)
          if (targetNode && this.isContractNode(targetNode.type)) {
            const dataMapping = this.generateDataMapping(node, targetNode, nodes)
            
            dependencies.push({
              from: node.id,
              to: targetNode.id,
              condition: null, // Can be extended for conditional execution
              dataMapping: dataMapping
            })
          }
        }
      }
    }
    
    return {
      workflowId,
      version: "1.0.0",
      contractCalls,
      dependencies,
      metadata: {
        createdAt: Date.now(),
        nodeCount: nodes.length,
        contractCallCount: contractCalls.length
      }
    }
  }

  private isContractNode(nodeType: string): boolean {
    return nodeType.startsWith("redot-") || 
           nodeType.includes("auction") ||
           nodeType === "data-store"
  }

  private isVMNode(nodeType: string): boolean {
    return nodeType.startsWith("vm-")
  }

  private hasVMNodes(nodes: WorkflowNode[]): boolean {
    return nodes.some(node => this.isVMNode(node.type))
  }

  private getVMNodeDataType(nodeType: string): "uint256" | "bool" {
    switch (nodeType) {
      case "vm-number-constant":
      case "vm-add":
      case "vm-mul":
      case "vm-special":
      case "vm-return-number":
        return "uint256"
      case "vm-bool-constant":
      case "vm-iseven":
      case "vm-equal":
      case "vm-greater":
      case "vm-less":
      case "vm-return-bool":
        return "bool"
      default:
        return "uint256" // Default fallback
    }
  }

  private nodeToContractCallWithNodes(node: WorkflowNode, allNodes: WorkflowNode[]): ContractCall {
    // Temporarily store all nodes for input mapping generation
    const previousNodes = this.allNodes
    this.allNodes = allNodes
    
    const result = this.nodeToContractCall(node)
    
    // Restore previous state
    this.allNodes = previousNodes
    
    return result
  }

  private nodeToContractCall(node: WorkflowNode): ContractCall {
    const baseCall: Partial<ContractCall> = {
      nodeId: node.id,
      nodeName: node.name,
      parameters: node.config,
    }

    switch (node.type) {
      case "redot-accept-payment":
        return {
          ...baseCall,
          contractAddress: "{{REDOT_PAY_CONTRACT_ADDRESS}}",
          methodName: "acceptPayment",
          abi: "acceptPayment(address,uint256,address,uint256,uint256)",
          parameterTypes: ["address", "uint256", "address", "uint256", "uint256"],
          parameterNames: ["token", "amount", "recipient", "condition", "release_time"],
          gasEstimate: 150000,
          requiresApproval: true,
          outputs: [
            {
              index: 0,
              name: "paymentId",
              type: "uint256",
              description: "Unique payment identifier for tracking and releasing funds"
            }
          ],
          inputMappings: this.generateInputMappings(node, "redot-accept-payment"),
        } as ContractCall

      case "redot-freeze-payment":
        return {
          ...baseCall,
          contractAddress: "{{REDOT_PAY_CONTRACT_ADDRESS}}",
          methodName: "freezePayment", 
          abi: "freezePayment(uint256,uint256)",
          parameterTypes: ["uint256", "uint256"],
          parameterNames: ["payment_id", "freeze_period"],
          gasEstimate: 100000,
          requiresApproval: false,
          outputs: [], // No return values for freeze
          inputMappings: this.generateInputMappings(node, "redot-freeze-payment"),
        } as ContractCall

      case "redot-release-payment":
        return {
          ...baseCall,
          contractAddress: "{{REDOT_PAY_CONTRACT_ADDRESS}}",
          methodName: "releasePayment",
          abi: "releasePayment(uint256)",
          parameterTypes: ["uint256"],
          parameterNames: ["payment_id"],
          gasEstimate: 80000,
          requiresApproval: false,
          outputs: [
            {
              index: 0,
              name: "releasedAmount",
              type: "uint256",
              description: "Amount released to recipient"
            }
          ],
          inputMappings: this.generateInputMappings(node, "redot-release-payment"),
        } as ContractCall

      case "redot-refund-payment":
        return {
          ...baseCall,
          contractAddress: "{{REDOT_PAY_CONTRACT_ADDRESS}}", 
          methodName: "refundPayment",
          abi: "refundPayment(uint256)",
          parameterTypes: ["uint256"],
          parameterNames: ["payment_id"],
          gasEstimate: 80000,
          requiresApproval: false,
          outputs: [
            {
              index: 0,
              name: "refundedAmount", 
              type: "uint256",
              description: "Amount refunded to payer"
            }
          ],
          inputMappings: this.generateInputMappings(node, "redot-refund-payment"),
        } as ContractCall

      default:
        return {
          ...baseCall,
          contractAddress: "{{CUSTOM_CONTRACT_ADDRESS}}",
          methodName: node.type,
          abi: `${node.type}()`,
          parameterTypes: [],
          parameterNames: [],
          gasEstimate: 50000,
          requiresApproval: false,
        } as ContractCall
    }
  }

  private topologicalSort(nodes: WorkflowNode[]): WorkflowNode[] {
    const visited = new Set<string>()
    const temp = new Set<string>()
    const result: WorkflowNode[] = []
    
    const visit = (nodeId: string) => {
      if (temp.has(nodeId)) {
        throw new Error("Circular dependency detected in workflow")
      }
      if (visited.has(nodeId)) return
      
      temp.add(nodeId)
      const node = nodes.find(n => n.id === nodeId)
      if (node) {
        for (const connectionId of node.connections) {
          visit(connectionId)
        }
        temp.delete(nodeId)
        visited.add(nodeId)
        result.unshift(node)
      }
    }
    
    // Find start nodes (nodes with no incoming connections)
    const hasIncoming = new Set<string>()
    for (const node of nodes) {
      for (const connectionId of node.connections) {
        hasIncoming.add(connectionId)
      }
    }
    
    const startNodes = nodes.filter(node => !hasIncoming.has(node.id))
    
    for (const startNode of startNodes) {
      visit(startNode.id)
    }
    
    return result
  }

  // Generate input mappings for a node based on its configuration
  private generateInputMappings(node: WorkflowNode, nodeType: string): InputMapping[] {
    const mappings: InputMapping[] = []
    
    // Look for parameters that reference other nodes' outputs
    for (const [paramName, paramValue] of Object.entries(node.config)) {
      if (typeof paramValue === 'string' && paramValue.includes('${') && paramValue.includes('_result.')) {
        // Parse expressions like "${accept-payment-123_result.paymentId}"
        const match = paramValue.match(/\$\{([^_]+)_result\.([^}]+)\}/)
        if (match) {
          const [, sourceNodeId, sourceOutput] = match
          
          // Find the source node to get output index
          const sourceNode = this.findNodeById(sourceNodeId)
          if (sourceNode) {
            const sourceOutputIndex = this.getOutputIndex(sourceNode.type, sourceOutput)
            
            mappings.push({
              parameterName: paramName,
              sourceNodeId: sourceNodeId,
              sourceOutput: sourceOutput,
              sourceOutputIndex: sourceOutputIndex
            })
          }
        }
      }
    }
    
    return mappings
  }

  // Helper to find node by ID
  private findNodeById(nodeId: string): WorkflowNode | null {
    return this.allNodes.find(node => node.id === nodeId) || null
  }

  // Generate data mapping between two connected nodes
  private generateDataMapping(fromNode: WorkflowNode, toNode: WorkflowNode, allNodes: WorkflowNode[]): OutputToInputMap[] {
    const mappings: OutputToInputMap[] = []
    const fromOutputs = this.getOutputDefinitions(fromNode.type)
    
    // Look through the target node's config for references to the source node's outputs
    for (const [paramName, paramValue] of Object.entries(toNode.config)) {
      if (typeof paramValue === 'string' && paramValue.includes(`${fromNode.id}_result.`)) {
        // Parse expressions like "${accept-payment-123_result.paymentId}"
        const match = paramValue.match(new RegExp(`\\$\\{${fromNode.id}_result\\.([^}]+)\\}`))
        if (match) {
          const [, outputName] = match
          const fromOutput = fromOutputs.find(output => output.name === outputName)
          
          if (fromOutput) {
            // Find the parameter index in the target node
            const contractCall = this.nodeToContractCall(toNode)
            const toInputIndex = contractCall.parameterNames.indexOf(paramName)
            
            mappings.push({
              fromOutput: outputName,
              fromOutputIndex: fromOutput.index,
              toInput: paramName,
              toInputIndex: toInputIndex >= 0 ? toInputIndex : 0
            })
          }
        }
      }
    }
    
    return mappings
  }

  // Get the output index for a given node type and output name
  private getOutputIndex(nodeType: string, outputName: string): number {
    const outputDefinitions = this.getOutputDefinitions(nodeType)
    const output = outputDefinitions.find(def => def.name === outputName)
    return output?.index ?? 0
  }

  // Get output definitions for a node type
  private getOutputDefinitions(nodeType: string): OutputDefinition[] {
    switch (nodeType) {
      case "redot-accept-payment":
        return [{ index: 0, name: "paymentId", type: "uint256" }]
      case "redot-release-payment":
        return [{ index: 0, name: "releasedAmount", type: "uint256" }]
      case "redot-refund-payment":
        return [{ index: 0, name: "refundedAmount", type: "uint256" }]
      case "redot-freeze-payment":
        return []
      default:
        return []
    }
  }

  // Generate Solidity router contract template
  generateRouterContractCode(workflowExport: WorkflowContractExport): string {
    const contractCalls = workflowExport.contractCalls
    
    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * Auto-generated Router Contract for Workflow: ${workflowExport.workflowId}
 * Generated on: ${new Date(workflowExport.metadata.createdAt).toISOString()}
 * 
 * This contract orchestrates the execution of your workflow on-chain.
 * Deploy this contract and call executeWorkflow() to run your automation.
 */

interface IRedotPayVault {
    function acceptPayment(address token, uint256 amount, address recipient, uint256 condition, uint256 release_time) external returns (uint256);
    function freezePayment(uint256 payment_id, uint256 freeze_period) external;
    function releasePayment(uint256 payment_id) external;
    function refundPayment(uint256 payment_id) external;
}

contract WorkflowRouter_${workflowExport.workflowId.replace(/[^a-zA-Z0-9]/g, '_')} {
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
     * This function orchestrates all the contract calls in the correct order
     */
    function executeWorkflow(${this.generateWorkflowParameters(contractCalls)}) external onlyOwner {
        uint256 executionId = ++executionCounter;
        
        ${this.generateWorkflowSteps(contractCalls, workflowExport.dependencies)}
        
        executionCompleted[executionId] = true;
        emit WorkflowExecuted(executionId, msg.sender);
    }
    
    // Individual step functions
    ${contractCalls.map(call => this.generateStepFunction(call)).join('\n    ')}
}`;
  }

  private generateWorkflowParameters(calls: ContractCall[]): string {
    const params = new Set<string>()
    
    for (const call of calls) {
      for (let i = 0; i < call.parameterTypes.length; i++) {
        const paramType = call.parameterTypes[i]
        const paramName = call.parameterNames[i]
        params.add(`${paramType} ${paramName}`)
      }
    }
    
    return Array.from(params).join(', ')
  }

  private generateWorkflowSteps(calls: ContractCall[], dependencies: WorkflowDependency[]): string {
    return calls.map((call, index) => {
      // Check if this call has input mappings from previous calls
      const dependency = dependencies.find(dep => dep.to === call.nodeId)
      let stepCode = `// Step ${index + 1}: ${call.nodeName}`
      
      if (dependency && dependency.dataMapping && dependency.dataMapping.length > 0) {
        // Add comments about data flow mappings
        stepCode += `\n        // Data flow: ${dependency.dataMapping.map(mapping => 
          `${mapping.fromOutput} -> ${mapping.toInput}`
        ).join(', ')}`
      }
      
      stepCode += `\n        ${call.methodName}(${call.parameterNames.join(', ')});`
      stepCode += `\n        emit StepCompleted(executionId, "${call.nodeName}", "");`
      
      return stepCode
    }).join('\n        ')
  }

  private generateStepFunction(call: ContractCall): string {
    const params = call.parameterTypes.map((type, i) => 
      `${type} ${call.parameterNames[i]}`
    ).join(', ')
    
    const contractCall = call.contractAddress.includes("REDOT_PAY") ?
      `redotPayVault.${call.methodName}(${call.parameterNames.join(', ')})` :
      `// Custom contract call for ${call.methodName}`
    
    return `function ${call.methodName}(${params}) internal {
        ${contractCall};
    }`
  }

  // VM Slot Allocation - Automatically assign buffer indices with separate uint256/bool buffers
  private allocateVMSlots(vmNodes: WorkflowNode[]): VMSlotAllocation[] {
    const allocations: VMSlotAllocation[] = []
    let nextUint256Slot = 0
    let nextBoolSlot = 0

    console.log('[VM] Allocating slots for nodes:', vmNodes.map(n => ({ id: n.id, type: n.type, config: n.config })))
    console.log('[VM] Total nodes received:', vmNodes.length)
    
    // First allocate slots for input constants - sort by node ID for consistent ordering
    const uint256InputNodes = vmNodes.filter(n => n.type === 'vm-number-constant').sort((a, b) => a.id.localeCompare(b.id))
    console.log('[VM] Found uint256 input nodes:', uint256InputNodes.length, uint256InputNodes.map(n => n.id))
    for (const node of uint256InputNodes) {
      const allocation = {
        slotIndex: nextUint256Slot++,
        nodeId: node.id,
        outputName: 'constant',
        dataType: 'uint256' as const,
        isInput: true,
        value: node.config?.constantValue || 0
      }
      allocations.push(allocation)
      console.log('[VM] Allocated uint256 input slot:', allocation)
    }

    const boolInputNodes = vmNodes.filter(n => n.type === 'vm-bool-constant').sort((a, b) => a.id.localeCompare(b.id))
    console.log('[VM] Found bool input nodes:', boolInputNodes.length, boolInputNodes.map(n => n.id))
    for (const node of boolInputNodes) {
      const allocation = {
        slotIndex: nextBoolSlot++,
        nodeId: node.id,
        outputName: 'constant',
        dataType: 'bool' as const,
        isInput: true,
        value: node.config?.constantValue || false
      }
      allocations.push(allocation)
      console.log('[VM] Allocated bool input slot:', allocation)
    }

    // Then allocate result slots for operations based on their output type
    const operationNodes = vmNodes.filter(n => 
      this.isVMNode(n.type) && !['vm-number-constant', 'vm-bool-constant', 'vm-return-number', 'vm-return-bool'].includes(n.type)
    ).sort((a, b) => a.id.localeCompare(b.id))
    console.log('[VM] Found operation nodes:', operationNodes.length, operationNodes.map(n => ({ id: n.id, type: n.type })))
    
    for (const node of operationNodes) {
      const outputName = this.getVMNodeOutputName(node.type)
      const dataType = this.getVMNodeDataType(node.type)
      
      if (outputName) {
        const slotIndex = dataType === 'uint256' ? nextUint256Slot++ : nextBoolSlot++
        const allocation = {
          slotIndex,
          nodeId: node.id,
          outputName,
          dataType,
          isInput: false
        }
        allocations.push(allocation)
        console.log(`[VM] Allocated ${dataType} result slot:`, allocation)
      }
    }

    console.log('[VM] Final slot allocations:', allocations)
    return allocations
  }

  private getVMNodeOutputName(nodeType: string): string | null {
    switch (nodeType) {
      case 'vm-add':
        return 'sum'
      case 'vm-mul':
        return 'product'
      case 'vm-iseven':
        return 'isEven'
      case 'vm-equal':
        return 'equal'
      case 'vm-greater':
        return 'greater'
      case 'vm-less':
        return 'less'
      case 'vm-special':
        return 'special'
      case 'vm-number-constant':
      case 'vm-bool-constant':
        return 'constant'
      default:
        return null
    }
  }

  // Generate VM Instructions with slot references
  private generateVMInstructions(vmNodes: WorkflowNode[], slotAllocations: VMSlotAllocation[]): VMInstruction[] {
    const instructions: VMInstruction[] = []
    
    for (const node of vmNodes) {
      if (node.type === "vm-input") continue // Input nodes don't generate instructions
      
      const instruction = this.nodeToVMInstruction(node, slotAllocations)
      if (instruction) {
        instructions.push(instruction)
      }
    }
    
    return instructions
  }

  private nodeToVMInstruction(node: WorkflowNode, slotAllocations: VMSlotAllocation[]): VMInstruction | null {
    const findSlot = (nodeId: string, outputName?: string) => {
      const slot = slotAllocations.find(slot => 
        slot.nodeId === nodeId && (outputName ? slot.outputName === outputName : true)
      )
      console.log(`[VM] Looking for slot: nodeId=${nodeId}, outputName=${outputName}, found:`, slot)
      return slot?.slotIndex ?? 0
    }

    const getResultSlot = () => findSlot(node.id)
    
    // Get connected input nodes automatically based on workflow connections
    const getConnectedInputSlots = (expectedInputCount: number) => {
      // Find nodes that connect TO this node (this node is in their connections array)
      const connectedNodes = this.allNodes.filter(n => 
        n.connections && n.connections.includes(node.id)
      )
      
      // Sort by slot index to ensure consistent ordering
      const sortedConnectedNodes = connectedNodes.sort((a, b) => {
        const aSlot = a.type === 'vm-number-constant' || a.type === 'vm-bool-constant' 
          ? findSlot(a.id, 'constant')
          : findSlot(a.id, this.getVMNodeOutputName(a.type) || undefined)
        const bSlot = b.type === 'vm-number-constant' || b.type === 'vm-bool-constant'
          ? findSlot(b.id, 'constant') 
          : findSlot(b.id, this.getVMNodeOutputName(b.type) || undefined)
        return aSlot - bSlot
      }).slice(0, expectedInputCount)
      
      // For each connected node, find the slot where its result is stored
      const inputSlots = sortedConnectedNodes.map(connectedNode => {
        let slot: number
        // If it's an input/constant node, use its slot directly
        if (connectedNode.type === 'vm-number-constant' || connectedNode.type === 'vm-bool-constant') {
          slot = findSlot(connectedNode.id, 'constant')
        } else {
          // Otherwise, find the result slot for this node (where it stores its output)
          const outputName = this.getVMNodeOutputName(connectedNode.type)
          slot = findSlot(connectedNode.id, outputName || undefined)
        }
        console.log(`[VM] Connected node ${connectedNode.id} (${connectedNode.type}) -> slot ${slot}`)
        return slot
      })
      console.log(`[VM] Final input slots for ${node.type}:`, inputSlots)
      return inputSlots
    }

    switch (node.type) {
      case "vm-add":
        const addInputs = getConnectedInputSlots(2)
        return {
          opcode: 0,
          nodeId: node.id,
          nodeName: node.name || "Add",
          args: addInputs.length >= 2 ? addInputs : [0, 1], // fallback to slots 0,1
          result: getResultSlot()
        }
        
      case "vm-mul":
        const mulInputs = getConnectedInputSlots(2)
        return {
          opcode: 1,
          nodeId: node.id,
          nodeName: node.name || "Multiply",
          args: mulInputs.length >= 2 ? mulInputs : [0, 1], // fallback to slots 0,1
          result: getResultSlot()
        }
        
      case "vm-iseven":
        const evenInputs = getConnectedInputSlots(1)
        return {
          opcode: 2,
          nodeId: node.id,
          nodeName: node.name || "Is Even", 
          args: evenInputs.length >= 1 ? evenInputs : [0], // fallback to slot 0
          result: getResultSlot()
        }
        
      case "vm-special":
        return {
          opcode: 3,
          nodeId: node.id,
          nodeName: node.name || "Special",
          args: [],
          result: getResultSlot()
        }
        
      case "vm-return-number":
        const returnNumberInputs = getConnectedInputSlots(1)
        return {
          opcode: 4,
          nodeId: node.id,
          nodeName: node.name || "Return Number",
          args: returnNumberInputs.length >= 1 ? returnNumberInputs : [0] // fallback to slot 0
        }
      
      case "vm-return-bool":
        const returnBoolInputs = getConnectedInputSlots(1)
        return {
          opcode: 8,
          nodeId: node.id,
          nodeName: node.name || "Return Boolean",
          args: returnBoolInputs.length >= 1 ? returnBoolInputs : [0] // fallback to slot 0
        }
      
      case "vm-equal":
        const equalInputs = getConnectedInputSlots(2)
        return {
          opcode: 5,
          nodeId: node.id,
          nodeName: node.name || "Equal",
          args: equalInputs.length >= 2 ? equalInputs : [0, 1], // fallback to slots 0,1
          result: getResultSlot()
        }
      
      case "vm-greater":
        const greaterInputs = getConnectedInputSlots(2)
        return {
          opcode: 6,
          nodeId: node.id,
          nodeName: node.name || "Greater Than",
          args: greaterInputs.length >= 2 ? greaterInputs : [0, 1], // fallback to slots 0,1
          result: getResultSlot()
        }
      
      case "vm-less":
        const lessInputs = getConnectedInputSlots(2)
        return {
          opcode: 7,
          nodeId: node.id,
          nodeName: node.name || "Less Than",
          args: lessInputs.length >= 2 ? lessInputs : [0, 1], // fallback to slots 0,1
          result: getResultSlot()
        }
        
      default:
        return null
    }
  }

  private resolveInputSlot(inputRef: any, slotAllocations: VMSlotAllocation[]): number {
    // If it's a string reference to another node's output
    if (typeof inputRef === 'string' && inputRef.includes('${') && inputRef.includes('_result.')) {
      const match = inputRef.match(/\$\{([^_]+)_result\.([^}]+)\}/)
      if (match) {
        const [, nodeId, outputName] = match
        const slot = slotAllocations.find(slot => slot.nodeId === nodeId && slot.outputName === outputName)
        return slot?.slotIndex ?? 0
      }
    }
    
    // If it's a direct node ID reference (for constants), find the slot for that constant
    if (typeof inputRef === 'string' && inputRef.startsWith('vm-input-')) {
      const slot = slotAllocations.find(slot => slot.nodeId === inputRef && slot.isInput)
      return slot?.slotIndex ?? 0
    }
    
    // For direct slot references or fallback
    return Number(inputRef) || 0
  }

  // Extract initial values for input slots
  private extractInitialValues(nodes: WorkflowNode[]): { uint256Values: number[], boolValues: boolean[] } {
    const uint256Values = nodes
      .filter(node => node.type === 'vm-number-constant')
      .map(node => Number(node.config?.constantValue) || 0)
    
    const boolValues = nodes
      .filter(node => node.type === 'vm-bool-constant')
      .map(node => Boolean(node.config?.constantValue) || false)

    return { uint256Values, boolValues }
  }

  // Generate VM Bytecode following the test format
  private generateVMBytecode(initialValues: { uint256Values: number[], boolValues: boolean[] }, instructions: VMInstruction[]): string {
    const bytes: number[] = []
    
    // 1. Count of uint256 values (1 byte)
    bytes.push(initialValues.uint256Values.length)
    
    // 2. uint256 values (32 bytes each, big-endian)
    for (const value of initialValues.uint256Values) {
      const valueBytes = this.uint256ToBytes(value)
      bytes.push(...valueBytes)
    }
    
    // 3. Count of bool values (1 byte)
    bytes.push(initialValues.boolValues.length)
    
    // 4. bool values (1 byte each)
    for (const value of initialValues.boolValues) {
      bytes.push(value ? 1 : 0)
    }
    
    // 5. Instructions  
    for (const instr of instructions) {
      bytes.push(instr.opcode)
      
      // Add arguments based on opcode
      if (instr.opcode === 0 || instr.opcode === 1) { // add, mul: 2 args + 1 result
        bytes.push(instr.args[0], instr.args[1], instr.result!)
      } else if (instr.opcode === 2) { // isEven: 1 arg + 1 result
        bytes.push(instr.args[0], instr.result!)
      } else if (instr.opcode === 3) { // special: 0 args + 1 result
        bytes.push(instr.result!)
      } else if (instr.opcode === 4) { // return uint256: 1 arg
        bytes.push(instr.args[0])
      } else if (instr.opcode === 5 || instr.opcode === 6 || instr.opcode === 7) { // equal, greater, less: 2 args + 1 result
        bytes.push(instr.args[0], instr.args[1], instr.result!)
      } else if (instr.opcode === 8) { // return bool: 1 arg
        bytes.push(instr.args[0])
      }
    }
    
    // Convert to hex string
    return "0x" + bytes.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  private uint256ToBytes(value: number): number[] {
    const bytes = new Array(32).fill(0)
    let val = Math.floor(value) // Ensure integer
    
    // Convert to big-endian bytes
    for (let i = 31; i >= 0; i--) {
      bytes[i] = val & 0xff
      val = Math.floor(val / 256)
    }
    
    return bytes
  }
}

// Global workflow engine instance
export const workflowEngine = new WorkflowEngine()
