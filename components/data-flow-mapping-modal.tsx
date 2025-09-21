"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Link2, CheckCircle } from "lucide-react"

interface OutputDefinition {
  index: number
  name: string
  type: string
  description?: string
}

interface InputParameter {
  name: string
  type: string
  index: number
}

interface DataFlowMapping {
  fromOutput: string
  fromOutputIndex: number
  toInput: string
  toInputIndex: number
}

interface WorkflowBlock {
  id: string
  name: string
  type: string
  config: Record<string, any>
}

interface DataFlowMappingModalProps {
  isOpen: boolean
  onClose: () => void
  fromBlock: WorkflowBlock | null
  toBlock: WorkflowBlock | null
  onSaveMapping: (mappings: DataFlowMapping[]) => void
}

// Mock output definitions for different block types
const getOutputDefinitions = (blockType: string): OutputDefinition[] => {
  switch (blockType) {
    case "redot-accept-payment":
      return [
        {
          index: 0,
          name: "paymentId",
          type: "uint256",
          description: "Unique payment identifier for tracking and releasing funds"
        }
      ]
    case "redot-release-payment":
      return [
        {
          index: 0,
          name: "releasedAmount",
          type: "uint256",
          description: "Amount released to recipient"
        }
      ]
    case "redot-refund-payment":
      return [
        {
          index: 0,
          name: "refundedAmount",
          type: "uint256",
          description: "Amount refunded to payer"
        }
      ]
    case "oracle-price-check":
      return [
        {
          index: 0,
          name: "currentPrice",
          type: "uint256",
          description: "Current market price from oracle"
        },
        {
          index: 1,
          name: "isValidPrice",
          type: "bool",
          description: "Whether the price meets validation criteria"
        }
      ]
    default:
      return []
  }
}

// Mock input parameters for different block types
const getInputParameters = (blockType: string): InputParameter[] => {
  switch (blockType) {
    case "redot-accept-payment":
      return [
        { name: "token", type: "address", index: 0 },
        { name: "amount", type: "uint256", index: 1 },
        { name: "recipient", type: "address", index: 2 },
        { name: "condition", type: "uint256", index: 3 },
        { name: "release_time", type: "uint256", index: 4 }
      ]
    case "redot-release-payment":
      return [
        { name: "payment_id", type: "uint256", index: 0 }
      ]
    case "redot-freeze-payment":
      return [
        { name: "payment_id", type: "uint256", index: 0 },
        { name: "freeze_period", type: "uint256", index: 1 }
      ]
    case "redot-refund-payment":
      return [
        { name: "payment_id", type: "uint256", index: 0 }
      ]
    default:
      return []
  }
}

export function DataFlowMappingModal({
  isOpen,
  onClose,
  fromBlock,
  toBlock,
  onSaveMapping
}: DataFlowMappingModalProps) {
  const [mappings, setMappings] = useState<DataFlowMapping[]>([])
  const [fromOutputs, setFromOutputs] = useState<OutputDefinition[]>([])
  const [toInputs, setToInputs] = useState<InputParameter[]>([])

  useEffect(() => {
    if (fromBlock && toBlock) {
      const outputs = getOutputDefinitions(fromBlock.type)
      const inputs = getInputParameters(toBlock.type)
      
      setFromOutputs(outputs)
      setToInputs(inputs)
      
      // Initialize with empty mappings
      setMappings([])
    }
  }, [fromBlock, toBlock])

  const addMapping = () => {
    if (fromOutputs.length > 0 && toInputs.length > 0) {
      const newMapping: DataFlowMapping = {
        fromOutput: fromOutputs[0].name,
        fromOutputIndex: fromOutputs[0].index,
        toInput: toInputs[0].name,
        toInputIndex: toInputs[0].index
      }
      setMappings([...mappings, newMapping])
    }
  }

  const removeMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index))
  }

  const updateMapping = (index: number, field: keyof DataFlowMapping, value: string | number) => {
    const updatedMappings = [...mappings]
    
    if (field === 'fromOutput') {
      const output = fromOutputs.find(o => o.name === value)
      if (output) {
        updatedMappings[index].fromOutput = output.name
        updatedMappings[index].fromOutputIndex = output.index
      }
    } else if (field === 'toInput') {
      const input = toInputs.find(i => i.name === value)
      if (input) {
        updatedMappings[index].toInput = input.name
        updatedMappings[index].toInputIndex = input.index
      }
    } else {
      updatedMappings[index][field] = value as never
    }
    
    setMappings(updatedMappings)
  }

  const handleSave = () => {
    onSaveMapping(mappings)
    onClose()
  }

  if (!fromBlock || !toBlock) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Map Data Flow Between Blocks
          </DialogTitle>
          <DialogDescription>
            Configure how output data from "{fromBlock.name}" flows into input parameters of "{toBlock.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 mt-6">
          {/* Source Block (Outputs) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline">{fromBlock.type}</Badge>
                {fromBlock.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">Available Outputs</p>
            </CardHeader>
            <CardContent>
              {fromOutputs.length === 0 ? (
                <p className="text-sm text-muted-foreground">This block has no outputs to map</p>
              ) : (
                <div className="space-y-2">
                  {fromOutputs.map((output) => (
                    <div key={output.name} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {output.type}
                        </Badge>
                        <span className="font-medium text-sm">{output.name}</span>
                      </div>
                      {output.description && (
                        <p className="text-xs text-muted-foreground">{output.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Target Block (Inputs) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline">{toBlock.type}</Badge>
                {toBlock.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">Available Inputs</p>
            </CardHeader>
            <CardContent>
              {toInputs.length === 0 ? (
                <p className="text-sm text-muted-foreground">This block has no inputs to map</p>
              ) : (
                <div className="space-y-2">
                  {toInputs.map((input) => (
                    <div key={input.name} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {input.type}
                        </Badge>
                        <span className="font-medium text-sm">{input.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Data Flow Mappings */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Data Flow Mappings</h3>
            <Button onClick={addMapping} size="sm">
              Add Mapping
            </Button>
          </div>

          {mappings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No data mappings configured</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add mappings to connect outputs from the source block to inputs of the target block
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {mappings.map((mapping, index) => (
                <Card key={index}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium mb-1 block">From Output</label>
                        <Select
                          value={mapping.fromOutput}
                          onValueChange={(value) => updateMapping(index, 'fromOutput', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fromOutputs.map((output) => (
                              <SelectItem key={output.name} value={output.name}>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {output.type}
                                  </Badge>
                                  {output.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-6" />

                      <div className="flex-1">
                        <label className="text-sm font-medium mb-1 block">To Input</label>
                        <Select
                          value={mapping.toInput}
                          onValueChange={(value) => updateMapping(index, 'toInput', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {toInputs.map((input) => (
                              <SelectItem key={input.name} value={input.name}>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {input.type}
                                  </Badge>
                                  {input.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMapping(index)}
                        className="mt-6"
                      >
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4" />
            <span>{mappings.length} mapping{mappings.length !== 1 ? 's' : ''} configured</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Mappings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
