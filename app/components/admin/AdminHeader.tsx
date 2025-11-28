'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  nome: string
  primeiro_login: boolean
  ativo: boolean
}

export default function AdminHeader() {
  const router = useRouter()
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    const loadAdmin = async () => {
      // Bypass em desenvolvimento
      if (process.env.NODE_ENV === 'development' && 
          process.env.NEXT_PUBLIC_ADMIN_BYPASS_AUTH === 'true') {
        setAdmin({
          id: 'dev-bypass',
          email: 'dev@mudatech.com.br',
          nome: 'Dev Admin (Bypass)',
          primeiro_login: false,
          ativo: true
        })
        return
      }

      const token = localStorage.getItem('admin_session')
      if (!token) return

      try {
        const response = await fetch('/api/admin/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.admin) {
            setAdmin(data.admin)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados do admin:', error)
      }
    }

    loadAdmin()
  }, [])

  const handleLogout = async () => {
    const token = localStorage.getItem('admin_session')
    
    if (token) {
      try {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
      } catch (error) {
        console.error('Erro ao fazer logout:', error)
      }
    }

    localStorage.removeItem('admin_session')
    // Remover cookie também
    document.cookie = 'admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/admin/login')
  }

  if (!admin) return null

  return (
    <div className="fixed top-0 right-0 left-0 lg:left-64 bg-white border-b border-gray-200 z-40 h-16 flex items-center justify-end px-4">
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-gray-900">{admin.nome}</p>
            <p className="text-xs text-gray-500">{admin.email}</p>
          </div>
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{admin.nome}</p>
                <p className="text-xs text-gray-500 truncate">{admin.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

