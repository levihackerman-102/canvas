"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, X, Settings, Play, Link } from "lucide-react"
import { DataFlowMappingModal } from "@/components/data-flow-mapping-modal"

interface WorkflowBlock {
  id: string
  name: string
  type: string
  x: number
  y: number
  connections: string[]
  config?: Record<string, any>
  dataFlowMappings?: DataFlowMapping[]
}

interface DataFlowMapping {
  fromOutput: string
  fromOutputIndex: number
  toInput: string
  toInputIndex: number
}

interface Connection {
  id: string
  from: string
  to: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  color?: string
}

interface WorkflowCanvasProps {
  onNodesChange?: (nodes: WorkflowBlock[]) => void
  onBlockSelect?: (block: WorkflowBlock | null) => void
}

// Helper function to determine how many inputs a block needs
const getInputCount = (blockType: string): number => {
  switch (blockType) {
    case 'vm-add':
    case 'vm-mul':
    case 'vm-equal':
    case 'vm-greater':
    case 'vm-less':
      return 2
    case 'vm-iseven':
    case 'vm-return-number':
    case 'vm-return-bool':
      return 1
    case 'vm-number-constant':
    case 'vm-bool-constant':
    case 'vm-special':
      return 0
    default:
      return 1
  }
}

// Helper function to get the data type of a block's output
const getBlockOutputType = (blockType: string): "uint256" | "bool" | null => {
  switch (blockType) {
    case 'vm-number-constant':
    case 'vm-add':
    case 'vm-mul':
    case 'vm-special':
      return 'uint256'
    case 'vm-bool-constant':
    case 'vm-iseven':
    case 'vm-equal':
    case 'vm-greater':
    case 'vm-less':
      return 'bool'
    default:
      return null
  }
}

// Helper function to get the expected input types for a block
const getBlockInputTypes = (blockType: string): ("uint256" | "bool")[] => {
  switch (blockType) {
    case 'vm-add':
    case 'vm-mul':
    case 'vm-equal':
    case 'vm-greater':
    case 'vm-less':
      return ['uint256', 'uint256']
    case 'vm-iseven':
      return ['uint256']
    case 'vm-return-number':
      return ['uint256']
    case 'vm-return-bool':
      return ['bool']
    default:
      return []
  }
}

// Helper function to check if connection types are compatible
const areTypesCompatible = (outputType: string | null, inputType: string): boolean => {
  return outputType === inputType
}

export function WorkflowCanvas({ onNodesChange, onBlockSelect }: WorkflowCanvasProps) {
  const [blocks, setBlocks] = useState<WorkflowBlock[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [connectionPreview, setConnectionPreview] = useState<{ x: number; y: number } | null>(null)
  const [invalidConnection, setInvalidConnection] = useState<boolean>(false)
  const [dataFlowModalOpen, setDataFlowModalOpen] = useState(false)
  const [pendingConnection, setPendingConnection] = useState<{from: string, to: string} | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const blockData = JSON.parse(e.dataTransfer.getData("application/json"))
    const rect = canvasRef.current?.getBoundingClientRect()

    if (rect) {
      const newBlock: WorkflowBlock = {
        id: `${blockData.id}-${Date.now()}`,
        name: blockData.name,
        type: blockData.id,
        x: Math.max(0, e.clientX - rect.left - 96), // Center the block
        y: Math.max(0, e.clientY - rect.top - 40),
        connections: [],
        config: {},
      }

      setBlocks((prev) => {
        const newBlocks = [...prev, newBlock]
        onNodesChange?.(newBlocks)
        return newBlocks
      })
    }
  }, [onNodesChange])

  const handleBlockMouseDown = useCallback(
    (e: React.MouseEvent, blockId: string) => {
      e.stopPropagation()
      if (connectingFrom) return

      const rect = e.currentTarget.getBoundingClientRect()
      setDraggedBlock(blockId)
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
      setSelectedBlock(blockId)
    },
    [connectingFrom],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggedBlock && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const newX = Math.max(0, e.clientX - rect.left - dragOffset.x)
        const newY = Math.max(0, e.clientY - rect.top - dragOffset.y)

        setBlocks((prev) => {
          const updatedBlocks = prev.map((block) => (block.id === draggedBlock ? { ...block, x: newX, y: newY } : block))
          onNodesChange?.(updatedBlocks)
          return updatedBlocks
        })

        setConnections((prev) =>
          prev.map((conn) => {
            const fromBlock = blocks.find((b) => b.id === conn.from)
            const toBlock = blocks.find((b) => b.id === conn.to)

            if (fromBlock?.id === draggedBlock) {
              return { ...conn, fromX: newX + 192, fromY: newY + 40 }
            }
            if (toBlock?.id === draggedBlock) {
              return { ...conn, toX: newX, toY: newY + 40 }
            }
            return conn
          }),
        )
      }

      if (connectingFrom && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        setConnectionPreview({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    },
    [draggedBlock, dragOffset, blocks, connectingFrom],
  )

  const handleMouseUp = useCallback(() => {
    setDraggedBlock(null)
  }, [])

  const handleConnect = useCallback(
    (fromBlockId: string, toBlockId: string) => {
      const fromBlock = blocks.find((b) => b.id === fromBlockId)
      const toBlock = blocks.find((b) => b.id === toBlockId)

      if (fromBlock && toBlock && fromBlockId !== toBlockId) {
        // Check if connection already exists
        const existingConnection = connections.find((conn) => conn.from === fromBlockId && conn.to === toBlockId)

        if (!existingConnection) {
          // Show data flow mapping modal for contract blocks
          const isContractConnection = 
            (fromBlock.type.startsWith("redot-") || fromBlock.type.includes("oracle")) &&
            (toBlock.type.startsWith("redot-") || toBlock.type.includes("oracle"))
          
          if (isContractConnection) {
            setPendingConnection({ from: fromBlockId, to: toBlockId })
            setDataFlowModalOpen(true)
          } else {
            // Create connection immediately for non-contract blocks
            createConnection(fromBlockId, toBlockId, [])
          }
        }
      }
      setConnectingFrom(null)
      setConnectionPreview(null)
    },
    [blocks, connections],
  )

  const createConnection = useCallback(
    (fromBlockId: string, toBlockId: string, dataFlowMappings: DataFlowMapping[] = []) => {
      const fromBlock = blocks.find((b) => b.id === fromBlockId)
      const toBlock = blocks.find((b) => b.id === toBlockId)

      if (fromBlock && toBlock) {
        // Calculate proper connection points
        const fromBlockWidth = fromBlock.type === 'vm-number-constant' || fromBlock.type === 'vm-bool-constant' ? 208 : 192 // Constant blocks are wider
        const blockHeight = 96 // Approximate block height
        
        // Output connection point (right side, center)
        const fromX = fromBlock.x + fromBlockWidth
        const fromY = fromBlock.y + blockHeight / 2

        // Input connection point - determine which input slot based on existing connections
        const existingConnectionsToTarget = connections.filter(conn => conn.to === toBlockId).length
        const inputCount = getInputCount(toBlock.type)
        
        let toX = toBlock.x
        let toY = toBlock.y + blockHeight / 2 // Default to center
        
        if (inputCount === 2) {
          // Position based on connection order (first connection goes to top input, second to bottom)
          if (existingConnectionsToTarget === 0) {
            toY = toBlock.y + blockHeight / 3 // First input (top)
          } else {
            toY = toBlock.y + (2 * blockHeight) / 3 // Second input (bottom)
          }
        }

        // Get connection color based on data type
        const outputType = getBlockOutputType(fromBlock.type)
        const connectionColor = outputType === 'bool' ? '#22c55e' : '#3b82f6' // Green for bool, blue for uint256

        const newConnection: Connection = {
          id: `${fromBlockId}-${toBlockId}-${existingConnectionsToTarget}`,
          from: fromBlockId,
          to: toBlockId,
          fromX,
          fromY,
          toX,
          toY,
          color: connectionColor,
        }

        setConnections((prev) => [...prev, newConnection])
        setBlocks((prev) => {
          const updatedBlocks = prev.map((block) => {
            if (block.id === fromBlockId) {
              return { ...block, connections: [...block.connections, toBlockId] }
            } else if (block.id === toBlockId) {
              return { ...block, dataFlowMappings: dataFlowMappings }
            }
            return block
          })
          onNodesChange?.(updatedBlocks)
          return updatedBlocks
        })
      }
    },
    [blocks, connections, onNodesChange],
  )

  const handleDataFlowSave = useCallback(
    (mappings: DataFlowMapping[]) => {
      if (pendingConnection) {
        createConnection(pendingConnection.from, pendingConnection.to, mappings)
        setPendingConnection(null)
      }
      setDataFlowModalOpen(false)
    },
    [pendingConnection, createConnection],
  )

  const handleBlockClick = useCallback((block: WorkflowBlock) => {
    if (!connectingFrom) {
      setSelectedBlock(block.id)
      onBlockSelect?.(block)
    }
  }, [onBlockSelect, connectingFrom])

  const updateBlockConfig = useCallback(
    (blockId: string, config: Record<string, any>) => {
      setBlocks((prev) => {
        const updatedBlocks = prev.map((block) =>
          block.id === blockId ? { ...block, config } : block
        )
        onNodesChange?.(updatedBlocks)
        return updatedBlocks
      })
    },
    [onNodesChange]
  )

  const startConnection = useCallback((blockId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConnectingFrom(blockId)
    setSelectedBlock(null)
  }, [])

  const cancelConnection = useCallback(() => {
    setConnectingFrom(null)
    setConnectionPreview(null)
  }, [])

  const deleteBlock = useCallback(
    (blockId: string) => {
      setBlocks((prev) => {
        const filteredBlocks = prev.filter((block) => block.id !== blockId)
        onNodesChange?.(filteredBlocks)
        return filteredBlocks
      })
      setConnections((prev) => prev.filter((conn) => conn.from !== blockId && conn.to !== blockId))
      setSelectedBlock(null)
      if (connectingFrom === blockId) {
        cancelConnection()
      }
    },
    [connectingFrom, cancelConnection, onNodesChange],
  )

  const deleteConnection = useCallback(
    (connectionId: string) => {
      setConnections((prev) => prev.filter((conn) => conn.id !== connectionId))
      // Also remove from block connections array
      setBlocks((prev) =>
        prev.map((block) => {
          const conn = connections.find((c) => c.id === connectionId)
          if (conn && block.id === conn.from) {
            return { ...block, connections: block.connections.filter((id) => id !== conn.to) }
          }
          return block
        }),
      )
    },
    [connections],
  )

  const executeWorkflow = useCallback(() => {
    console.log("[v0] Executing workflow with blocks:", blocks)
    console.log("[v0] Workflow connections:", connections)
    connections.forEach((conn, index) => {
      console.log(`[v0] Connection ${index}:`, {
        from: conn.from,
        to: conn.to,
        fromX: conn.fromX,
        fromY: conn.fromY,
        toX: conn.toX,
        toY: conn.toY,
      })
    })
    alert("Workflow execution started! Check console for details.")
  }, [blocks, connections])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Workflow Canvas</span>
          <span className="text-xs text-muted-foreground">
            {blocks.length} blocks, {connections.length} connections
          </span>
        </div>
        <div className="flex items-center gap-2">
          {connectingFrom && (
            <Button variant="outline" size="sm" onClick={cancelConnection}>
              <X className="w-4 h-4 mr-1" />
              Cancel Connection
            </Button>
          )}
          {selectedBlock && (
            <Button variant="outline" size="sm" onClick={() => deleteBlock(selectedBlock)}>
              <X className="w-4 h-4 mr-1" />
              Delete Block
            </Button>
          )}
          <Button variant="default" size="sm" onClick={executeWorkflow} disabled={blocks.length === 0}>
            <Play className="w-4 h-4 mr-1" />
            Execute
          </Button>
        </div>
      </div>

      <div
        ref={canvasRef}
        className="relative flex-1 bg-muted/20 overflow-hidden"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={connectingFrom ? cancelConnection : undefined}
      >
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />

        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }} width="100%" height="100%">
          {/* Arrow marker definition - moved to top */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="12"
              markerHeight="10"
              refX="11"
              refY="5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon points="0 0, 12 5, 0 10" fill="currentColor" />
            </marker>
          </defs>

          {connections.map((conn) => {
            console.log("[v0] Rendering connection:", conn)
            const dx = conn.toX - conn.fromX
            const dy = conn.toY - conn.fromY
            const controlPointOffset = Math.abs(dx) * 0.5

            const path = `M ${conn.fromX} ${conn.fromY} C ${conn.fromX + controlPointOffset} ${conn.fromY}, ${conn.toX - controlPointOffset} ${conn.toY}, ${conn.toX} ${conn.toY}`

            const midX = (conn.fromX + conn.toX) / 2
            const midY = (conn.fromY + conn.toY) / 2

            return (
              <g key={conn.id}>
                <path
                  d={path}
                  stroke={conn.color || "#f97316"}
                  strokeWidth="3"
                  fill="none"
                  opacity="0.9"
                  markerEnd="url(#arrowhead)"
                  className="drop-shadow-sm"
                  style={{ color: conn.color || "#f97316" }}
                />
                {/* Connection delete button */}
                <circle
                  cx={midX}
                  cy={midY}
                  r="10"
                  fill="#ef4444"
                  className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteConnection(conn.id)
                  }}
                />
                <text
                  x={midX}
                  y={midY + 3}
                  textAnchor="middle"
                  fontSize="12"
                  fill="white"
                  className="cursor-pointer pointer-events-none font-bold"
                >
                  ×
                </text>
              </g>
            )
          })}

          {connectingFrom &&
            connectionPreview &&
            (() => {
              const fromBlock = blocks.find((b) => b.id === connectingFrom)
              if (fromBlock) {
                const dx = connectionPreview.x - (fromBlock.x + 192)
                const dy = connectionPreview.y - (fromBlock.y + 40)
                const controlPointOffset = Math.abs(dx) * 0.5

                const previewPath = `M ${fromBlock.x + 192} ${fromBlock.y + 40} C ${fromBlock.x + 192 + controlPointOffset} ${fromBlock.y + 40}, ${connectionPreview.x - controlPointOffset} ${connectionPreview.y}, ${connectionPreview.x} ${connectionPreview.y}`

                return (
                  <path
                    d={previewPath}
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray="8,4"
                    fill="none"
                    opacity="0.8"
                    className="animate-pulse"
                  />
                )
              }
              return null
            })()}
        </svg>

        {/* Empty State */}
        {blocks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Start Building Your Workflow</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Drag blocks from the palette to create your auction workflow. Connect them to define the flow of your
                auction process.
              </p>
            </div>
          </div>
        )}

        {/* Workflow Blocks */}
        {blocks.map((block) => (
            <Card
              key={block.id}
              className={`absolute ${block.type === 'vm-input' ? 'w-52 p-3' : 'w-48 p-3'} cursor-move select-none transition-all hover:shadow-lg group ${
                selectedBlock === block.id ? "ring-2 ring-primary shadow-lg" : ""
              } ${draggedBlock === block.id ? "opacity-80 scale-105" : ""} ${
                connectingFrom === block.id ? "ring-2 ring-blue-500" : ""
              } ${connectingFrom && connectingFrom !== block.id ? "ring-2 ring-green-500/50 hover:ring-green-500" : ""}`}
              style={{ left: block.x, top: block.y, zIndex: 20 }}
              onMouseDown={(e) => handleBlockMouseDown(e, block.id)}
              onClick={(e) => {
                e.stopPropagation()
                if (connectingFrom && connectingFrom !== block.id) {
                  handleConnect(connectingFrom, block.id)
                } else if (!connectingFrom) {
                  handleBlockClick(block)
                }
              }}
            >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectingFrom === block.id
                      ? "bg-blue-500"
                      : connectingFrom && connectingFrom !== block.id
                        ? "bg-green-500"
                        : "bg-primary"
                  }`}
                />
                <span className="text-sm font-medium truncate">
                  {block.type === 'vm-input' ? 'Constant' : block.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedBlock(block.id)
                }}
              >
                <Settings className="w-3 h-3" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mb-2">{block.type}</div>
            
            {/* Inline input for Constant blocks */}
            {(block.type === 'vm-number-constant' || block.type === 'vm-bool-constant') && (
              <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                <div className="relative">
                  {block.type === 'vm-bool-constant' ? (
                    <select
                      value={block.config?.constantValue ? 'true' : 'false'}
                      onChange={(e) => {
                        const updatedValue = e.target.value === 'true'
                        const updatedBlocks = blocks.map(b =>
                          b.id === block.id
                            ? { ...b, config: { ...b.config, constantValue: updatedValue } }
                            : b
                        );
                        setBlocks(updatedBlocks);
                        onNodesChange?.(updatedBlocks);
                      }}
                      className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 focus:bg-white dark:bg-gray-700 dark:border-gray-500 dark:hover:bg-gray-600 dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 text-center font-semibold transition-colors"
                    >
                      <option value="false">false</option>
                      <option value="true">true</option>
                    </select>
                  ) : (
                    <input
                      type="number"
                      value={block.config?.constantValue || 0}
                      onChange={(e) => {
                        const updatedBlocks = blocks.map(b => 
                          b.id === block.id 
                            ? { ...b, config: { ...b.config, constantValue: Number(e.target.value) || 0 } }
                            : b
                        )
                        setBlocks(updatedBlocks)
                        onNodesChange?.(updatedBlocks)
                      }}
                      className="w-full px-3 py-2.5 text-base border border-gray-300 rounded-md bg-gray-50 hover:bg-gray-100 focus:bg-white dark:bg-gray-700 dark:border-gray-500 dark:hover:bg-gray-600 dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 text-center font-semibold transition-colors"
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                    />
                  )}
                  <div className="absolute -top-2 left-2 bg-white dark:bg-gray-800 px-1 text-xs text-gray-600 dark:text-gray-400">
                    📊 {block.type === 'vm-bool-constant' ? 'Boolean' : 'Number'}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                  Click to edit
                </div>
              </div>
            )}

            {/* Output connection point */}
            <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
              <Button
                variant="ghost"
                size="sm"
                className={`w-4 h-4 p-0 border border-border rounded-full transition-all ${
                  connectingFrom === block.id
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-background hover:bg-primary hover:text-primary-foreground"
                }`}
                onClick={(e) => startConnection(block.id, e)}
                title="Start connection from this block"
              >
                <Link className="w-2 h-2" />
              </Button>
            </div>

            {/* Input connection points - multiple for blocks that need them */}
            {(() => {
              const inputCount = getInputCount(block.type)
              if (inputCount === 1) {
                return (
                  <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
                    <div
                      className={`w-3 h-3 border border-border rounded-full transition-all ${
                        connectingFrom && connectingFrom !== block.id ? "bg-green-500 border-green-500" : "bg-background"
                      }`}
                      title="Connection input"
                    />
                  </div>
                )
              } else if (inputCount === 2) {
                return (
                  <>
                    <div className="absolute -left-2 top-1/3 transform -translate-y-1/2">
                      <div
                        className={`w-3 h-3 border border-border rounded-full transition-all ${
                          connectingFrom && connectingFrom !== block.id ? "bg-green-500 border-green-500" : "bg-background"
                        }`}
                        title="First input"
                      />
                    </div>
                    <div className="absolute -left-2 top-2/3 transform -translate-y-1/2">
                      <div
                        className={`w-3 h-3 border border-border rounded-full transition-all ${
                          connectingFrom && connectingFrom !== block.id ? "bg-green-500 border-green-500" : "bg-background"
                        }`}
                        title="Second input"
                      />
                    </div>
                  </>
                )
              }
              return null
            })()}
          </Card>
        ))}

        {connectingFrom && (
          <div
            className={`absolute top-4 left-4 px-4 py-2 rounded-lg text-sm shadow-lg ${
              invalidConnection 
                ? "bg-red-500 text-white" 
                : "bg-blue-500 text-white"
            }`}
            style={{ zIndex: 30 }}
          >
            <div className="flex items-center gap-2">
              {invalidConnection ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Incompatible data types - cannot connect</span>
                </>
              ) : (
                <>
                  <Link className="w-4 h-4" />
                  <span>Click another block to connect, or click canvas to cancel</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Type Legend */}
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border" style={{ zIndex: 30 }}>
          <div className="text-xs font-semibold mb-2">Data Types</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-500"></div>
              <span className="text-xs text-blue-500">uint256 (Numbers)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-green-500"></div>
              <span className="text-xs text-green-500">bool (True/False)</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Data Flow Mapping Modal */}
      <DataFlowMappingModal
        isOpen={dataFlowModalOpen}
        onClose={() => {
          setDataFlowModalOpen(false)
          setPendingConnection(null)
          setConnectingFrom(null)
        }}
        fromBlock={pendingConnection ? blocks.find(b => b.id === pendingConnection.from) || null : null}
        toBlock={pendingConnection ? blocks.find(b => b.id === pendingConnection.to) || null : null}
        onSaveMapping={handleDataFlowSave}
      />
    </div>
  )
}
