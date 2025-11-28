"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Truck, Mail, Lock, Loader2, Shield } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { InstallPrompt } from "@/app/components/painel/InstallPrompt"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"email" | "code">("email")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Verificar se já está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/cliente/auth/me")
        if (response.ok) {
          router.push("/painel/dashboard")
        }
      } catch (err) {
        // Não autenticado, continuar com login
      }
    }
    checkAuth()
  }, [router])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/cliente/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha: password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.requiresVerification) {
          // Email não verificado, precisa verificar código
          setStep("code")
          setError(null)
        } else {
          throw new Error(data.error || "Erro ao fazer login")
        }
      } else {
        // Login bem-sucedido
        router.push(redirectTo)
      }
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  const handleCodeVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/cliente/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Código inválido")
      }

      router.push("/painel/dashboard")
    } catch (err: any) {
      setError(err.message || "Código inválido")
    } finally {
      setLoading(false)
    }
  }

  const redirectTo = searchParams.get("redirect") || "/painel/dashboard"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md border-2 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Truck className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              MudaTech
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {step === "email" 
                ? "Plataforma de leads para empresas de mudança"
                : "Verificação de segurança"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="empresa@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar no Dashboard"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCodeVerification} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-medium mb-1">Código de verificação enviado</p>
                  <p className="text-muted-foreground">
                    Enviamos um código de verificação para <strong>{email}</strong>. 
                    Digite o código abaixo para continuar.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  Código de Verificação
                </label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-12 text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar Código"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("email")
                  setCode("")
                  setError(null)
                }}
              >
                Voltar
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <InstallPrompt />
    </div>
  )
}

export default function PainelLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

