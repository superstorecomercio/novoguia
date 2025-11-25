"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import DashboardHeader from "@/components/dashboard/header"
import { Building2, Upload, Save, X } from "lucide-react"
import { mockCompanyProfile, type CompanyProfile } from "@/lib/mock-data"

export default function ProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile>(mockCompanyProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [newService, setNewService] = useState("")

  const handleSave = () => {
    // Mock save - seria integrado com Supabase via Cursor AI
    console.log("Salvando perfil:", profile)
    setIsEditing(false)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Mock upload - seria integrado com Supabase Storage via Cursor AI
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfile({ ...profile, logo: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const addService = () => {
    if (newService.trim()) {
      setProfile({ ...profile, services: [...profile.services, newService.trim()] })
      setNewService("")
    }
  }

  const removeService = (index: number) => {
    setProfile({ ...profile, services: profile.services.filter((_, i) => i !== index) })
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userEmail="empresa@mudancas.com" />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header da Página */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Perfil da Empresa</h1>
            <p className="text-muted-foreground">Gerencie as informações da sua empresa</p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} size="lg">
              Editar Perfil
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} size="lg">
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline" size="lg">
                Cancelar
              </Button>
            </div>
          )}
        </div>

        {/* Logo e Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>Logo e dados principais da empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex flex-col items-center gap-3">
                <div className="w-32 h-32 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-border">
                  {profile.logo ? (
                    <img src={profile.logo || "/placeholder.svg"} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-16 h-16 text-primary" />
                  )}
                </div>
                {isEditing && (
                  <div>
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <Button asChild variant="outline" size="sm">
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </label>
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4 w-full">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Empresa</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={profile.cnpj}
                      onChange={(e) => setProfile({ ...profile, cnpj: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={profile.description}
                    onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                    disabled={!isEditing}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle>Informações de Contato</CardTitle>
            <CardDescription>Dados utilizados para comunicação com clientes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>

        {/* Serviços */}
        <Card>
          <CardHeader>
            <CardTitle>Serviços Oferecidos</CardTitle>
            <CardDescription>Lista de serviços que aparecem nas propostas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {profile.services.map((service, index) => (
                <Badge key={index} variant="secondary" className="text-sm py-2 px-3">
                  {service}
                  {isEditing && (
                    <button
                      onClick={() => removeService(index)}
                      className="ml-2 hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>

            {isEditing && (
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar novo serviço"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addService()}
                />
                <Button onClick={addService} variant="outline">
                  Adicionar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
