import { Card, CardContent } from "@/components/ui/card"
import { Zap, CheckCircle, Clock, AlertTriangle } from "lucide-react"

const stats = [
  {
    label: "Active Rules",
    value: "8",
    change: "+2 this week",
    icon: Zap,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  {
    label: "Successful Executions",
    value: "156",
    change: "98.7% success rate",
    icon: CheckCircle,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
  },
  {
    label: "Pending Actions",
    value: "3",
    change: "2 scheduled for today",
    icon: Clock,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  {
    label: "Failed Actions",
    value: "2",
    change: "Last 30 days",
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
]

export function AutomationStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
