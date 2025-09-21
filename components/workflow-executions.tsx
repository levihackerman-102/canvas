"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Eye, Play, Square, RefreshCw } from "lucide-react"

interface WorkflowExecution {
  id: string
  workflowName: string
  status: "running" | "completed" | "failed" | "pending"
  progress: number
  startTime: string
  endTime?: string
  duration?: string
  currentStep: string
  totalSteps: number
  completedSteps: number
}

const mockExecutions: WorkflowExecution[] = [
  {
    id: "exec_001",
    workflowName: "Collectible Auction Workflow",
    status: "completed",
    progress: 100,
    startTime: "2024-01-15 14:30:00",
    endTime: "2024-01-15 14:32:15",
    duration: "2m 15s",
    currentStep: "Settlement Complete",
    totalSteps: 6,
    completedSteps: 6,
  },
  {
    id: "exec_002",
    workflowName: "Art Auction Workflow",
    status: "running",
    progress: 67,
    startTime: "2024-01-15 15:45:00",
    currentStep: "Processing Bids",
    totalSteps: 6,
    completedSteps: 4,
  },
  {
    id: "exec_003",
    workflowName: "Vintage Items Workflow",
    status: "failed",
    progress: 33,
    startTime: "2024-01-15 13:20:00",
    endTime: "2024-01-15 13:22:30",
    duration: "2m 30s",
    currentStep: "Payment Processing Failed",
    totalSteps: 6,
    completedSteps: 2,
  },
]

export function WorkflowExecutions() {
  const [executions, setExecutions] = useState(mockExecutions)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "running":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Play className="w-4 h-4" />
      case "completed":
        return <Square className="w-4 h-4" />
      case "failed":
        return <RefreshCw className="w-4 h-4" />
      default:
        return <Play className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Workflow Executions</h3>
        <Button variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {executions.map((execution) => (
        <Card key={execution.id}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{execution.workflowName}</CardTitle>
                <p className="text-sm text-muted-foreground">ID: {execution.id}</p>
              </div>
              <Badge className={`${getStatusColor(execution.status)} flex items-center gap-1`}>
                {getStatusIcon(execution.status)}
                {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {execution.completedSteps}/{execution.totalSteps} steps
                  </span>
                </div>
                <Progress value={execution.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{execution.currentStep}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Started</p>
                  <p className="font-medium">{new Date(execution.startTime).toLocaleString()}</p>
                </div>
                {execution.endTime && (
                  <div>
                    <p className="text-muted-foreground">Ended</p>
                    <p className="font-medium">{new Date(execution.endTime).toLocaleString()}</p>
                  </div>
                )}
                {execution.duration && (
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-medium">{execution.duration}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium capitalize">{execution.status}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                {execution.status === "failed" && (
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
