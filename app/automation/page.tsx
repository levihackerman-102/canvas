import { AutomationDashboard } from "@/components/automation-dashboard"
import { Header } from "@/components/header"

export default function AutomationPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <AutomationDashboard />
      </main>
    </div>
  )
}
