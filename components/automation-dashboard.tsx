"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AutomationRules } from "@/components/automation-rules"
import { WorkflowExecutions } from "@/components/workflow-executions"
import { AutomationStats } from "@/components/automation-stats"
import { Play, Pause, Settings } from "lucide-react"

export function AutomationDashboard() {
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(true)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automation Engine</h2>
          <p className="text-muted-foreground">Manage automated workflows and auction settlement processes</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isAutomationEnabled ? "secondary" : "destructive"}>
            {isAutomationEnabled ? "Active" : "Paused"}
          </Badge>
          <Button variant="outline" onClick={() => setIsAutomationEnabled(!isAutomationEnabled)}>
            {isAutomationEnabled ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isAutomationEnabled ? "Pause" : "Resume"}
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <AutomationStats />

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
          <TabsTrigger value="executions">Workflow Executions</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="mt-6">
          <AutomationRules />
        </TabsContent>

        <TabsContent value="executions" className="mt-6">
          <WorkflowExecutions />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    INFO
                  </Badge>
                  <span className="text-muted-foreground">2024-01-15 14:30:25</span>
                  <span>Automation engine started successfully</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    INFO
                  </Badge>
                  <span className="text-muted-foreground">2024-01-15 14:32:10</span>
                  <span>Workflow execution completed: auction_workflow_001</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">SUCCESS</Badge>
                  <span className="text-muted-foreground">2024-01-15 14:35:45</span>
                  <span>Payment settlement completed for auction #1234</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
