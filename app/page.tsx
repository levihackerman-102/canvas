import { WorkflowBuilder } from "@/components/workflow-builder"
import { Header } from "@/components/header"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-balance mb-4">Auction Workflow Builder</h1>
          <p className="text-xl text-muted-foreground text-pretty max-w-3xl">
            Create and automate your auction workflows with our visual builder. Design custom auction flows, configure
            payment processing, and set up automated settlement - all without code.
          </p>
        </div>
        <WorkflowBuilder />
      </main>
    </div>
  )
}
