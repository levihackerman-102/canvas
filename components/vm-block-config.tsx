"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Calculator, Hash, CheckCircle, Zap, CornerDownLeft, Database } from "lucide-react"

interface WorkflowBlock {
  id: string
  name: string
  type: string
  config?: Record<string, any>
}

interface VMBlockConfigProps {
  block: WorkflowBlock
  onUpdateConfig: (blockId: string, config: Record<string, any>) => void
}

export function VMBlockConfig({ block, onUpdateConfig }: VMBlockConfigProps) {
  const [config, setConfig] = useState(block.config || {})

  useEffect(() => {
    setConfig(block.config || {})
  }, [block])

  const updateConfig = (newConfig: Record<string, any>) => {
    setConfig(newConfig)
    onUpdateConfig(block.id, newConfig)
  }

  const getBlockIcon = (type: string) => {
    switch (type) {
      case "vm-input": return Database
      case "vm-add": return Plus
      case "vm-mul": return Calculator
      case "vm-iseven": return CheckCircle
      case "vm-special": return Zap
      case "vm-return": return CornerDownLeft
      default: return Hash
    }
  }

  const getBlockName = (type: string) => {
    switch (type) {
      case "vm-input": return "Constant"
      case "vm-add": return "Add"
      case "vm-mul": return "Multiply"
      case "vm-iseven": return "Is Even"
      case "vm-special": return "Special"
      case "vm-return": return "Return"
      default: return type
    }
  }

  const renderVMInputConfig = () => {
    const inputValues = config.inputValues || [0]
    
    const updateInputValues = (values: number[]) => {
      updateConfig({ ...config, inputValues: values })
    }

    const addInputValue = () => {
      updateInputValues([...inputValues, 0])
    }

    const removeInputValue = (index: number) => {
      updateInputValues(inputValues.filter((_: number, i: number) => i !== index))
    }

    const updateInputValue = (index: number, value: number) => {
      const newValues = [...inputValues]
      newValues[index] = value
      updateInputValues(newValues)
    }

    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Constant Values</Label>
          <p className="text-xs text-muted-foreground mb-3">
            These constant values will be available in your workflow
          </p>
        </div>

        <div className="space-y-2">
          {inputValues.map((value: number, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <Badge variant="outline" className="w-16 justify-center">
                Slot {index}
              </Badge>
              <Input
                type="number"
                value={value}
                onChange={(e) => updateInputValue(index, Number(e.target.value) || 0)}
                placeholder="0"
                className="flex-1"
              />
              {inputValues.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeInputValue(index)}
                  className="p-2"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

          <Button
            variant="outline"
            size="sm"
            onClick={addInputValue}
            className="w-full"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Constant Value
          </Button>

        <div className="p-3 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground">
            <strong>Preview:</strong> Constants [{inputValues.join(', ')}] will be available in slots 0-{inputValues.length - 1}
          </p>
        </div>
      </div>
    )
  }

  const renderVMAddConfig = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Add Block</Label>
          <p className="text-xs text-muted-foreground mb-3">
            Adds two values together automatically
          </p>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              🔗 Connection-Based
            </p>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Connect two blocks to this Add block. It will automatically add their values together.
          </p>
        </div>

        <div className="p-3 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground">
            <strong>Operation:</strong> (first connected block) + (second connected block) → result
          </p>
        </div>
      </div>
    )
  }

  const renderVMMulConfig = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Multiply Block</Label>
          <p className="text-xs text-muted-foreground mb-3">
            Multiplies two values together automatically
          </p>
        </div>

        <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
              🔗 Connection-Based
            </p>
          </div>
          <p className="text-xs text-orange-700 dark:text-orange-300">
            Connect two blocks to this Multiply block. It will automatically multiply their values together.
          </p>
        </div>

        <div className="p-3 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground">
            <strong>Operation:</strong> (first connected block) × (second connected block) → result
          </p>
        </div>
      </div>
    )
  }

  const renderVMIsEvenConfig = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Is Even Block</Label>
          <p className="text-xs text-muted-foreground mb-3">
            Checks if a number is even automatically
          </p>
        </div>

        <div className="p-3 bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
            <p className="text-sm font-medium text-cyan-800 dark:text-cyan-200">
              🔗 Connection-Based
            </p>
          </div>
          <p className="text-xs text-cyan-700 dark:text-cyan-300">
            Connect any block to this Is Even block. It will check if the value is even and return 1 (true) or 0 (false).
          </p>
        </div>

        <div className="p-3 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground">
            <strong>Operation:</strong> isEven(connected block's value) → 1 if even, 0 if odd
          </p>
        </div>
      </div>
    )
  }

  const renderVMSpecialConfig = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Special Value</Label>
          <p className="text-xs text-muted-foreground mb-3">
            Returns the special value (69)
          </p>
        </div>

        <div className="p-3 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground">
            <strong>Operation:</strong> Returns 69 → result slot
          </p>
        </div>
      </div>
    )
  }

  const renderVMReturnConfig = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Return Block</Label>
          <p className="text-xs text-muted-foreground mb-3">
            Returns the result from the connected block
          </p>
        </div>

        <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              ✨ Fully Automatic
            </p>
          </div>
          <p className="text-xs text-green-700 dark:text-green-300">
            This block automatically returns the output from whatever is connected to it. 
            No configuration needed!
          </p>
        </div>

        <div className="p-3 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground">
            <strong>Operation:</strong> return (connected block's result)
          </p>
        </div>
      </div>
    )
  }

  const renderBlockConfig = () => {
    switch (block.type) {
      case "vm-input":
        return (
          <div className="text-sm text-muted-foreground p-4 text-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="mb-2">✨ Constant blocks are configured inline!</div>
            <div className="text-xs">Simply type the value directly on the block on the canvas.</div>
            <div className="text-xs mt-2">Current value: <strong>{block.config?.constantValue || 0}</strong></div>
          </div>
        )
      case "vm-add":
        return renderVMAddConfig()
      case "vm-mul":
        return renderVMMulConfig()
      case "vm-iseven":
        return renderVMIsEvenConfig()
      case "vm-special":
        return renderVMSpecialConfig()
      case "vm-return":
        return renderVMReturnConfig()
      default:
        return (
          <div className="text-sm text-muted-foreground">
            No configuration available for this block type.
          </div>
        )
    }
  }

  const Icon = getBlockIcon(block.type)

  return (
    <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
          <Icon className="h-4 w-4" />
          {getBlockName(block.type)} Configuration
        </CardTitle>
        <p className="text-xs text-muted-foreground">ID: {block.id}</p>
      </CardHeader>
      <CardContent>
        {renderBlockConfig()}
        
        {/* Debug info - remove later */}
        <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
          <strong>Debug:</strong> Block type: {block.type}, Config: {JSON.stringify(config)}
        </div>
      </CardContent>
    </Card>
  )
}

