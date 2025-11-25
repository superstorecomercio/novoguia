"use client"

import { Truck, LogOut, Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface DashboardHeaderProps {
  userEmail: string
}

export default function DashboardHeader({ userEmail }: DashboardHeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Truck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">MudaTech</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Dashboard de Leads</p>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Menu className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Minha Conta</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Perfil da Empresa
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
