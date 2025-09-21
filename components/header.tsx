import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Settings } from "lucide-react"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import Link from "next/link"

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">AB</span>
              </div>
              <span className="text-xl font-bold">AuctionBuilder</span>
            </Link>
            <Badge variant="secondary" className="text-xs">
              Beta
            </Badge>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Workflows
            </Link>
            <Link href="/automation" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Automation
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <WalletConnectButton />
          </div>
        </div>
      </div>
    </header>
  )
}
