"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function LoginModal() {
  const { isLoginOpen, closeLogin, login, signup } = useAuth()
  const [loginData, setLoginData] = useState({ username: "", password: "" })
  const [signupData, setSignupData] = useState({ name: "", username: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const validateUsername = (username: string) => {
    if (username.includes(" ")) {
      return "Nome de usuário não pode conter espaços"
    }
    if (username.length < 3) {
      return "Nome de usuário deve ter pelo menos 3 caracteres"
    }
    return ""
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const usernameError = validateUsername(loginData.username)
    if (usernameError) {
      setError(usernameError)
      setLoading(false)
      return
    }

    const success = await login(loginData.username, loginData.password)
    if (!success) {
      setError("Nome de usuário ou senha incorretos")
    } else {
      setLoginData({ username: "", password: "" })
    }
    setLoading(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!signupData.name || !signupData.username || !signupData.password) {
      setError("Todos os campos são obrigatórios")
      setLoading(false)
      return
    }

    const usernameError = validateUsername(signupData.username)
    if (usernameError) {
      setError(usernameError)
      setLoading(false)
      return
    }

    const success = await signup(signupData.name, signupData.username, signupData.password)
    if (!success) {
      setError("Nome de usuário já existe ou erro no cadastro")
    } else {
      setSignupData({ name: "", username: "", password: "" })
    }
    setLoading(false)
  }

  return (
    <Dialog open={isLoginOpen} onOpenChange={closeLogin}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Acesso ao Sistema</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Cadastrar</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">Nome de Usuário</Label>
                <Input
                  id="login-username"
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, username: e.target.value.toLowerCase().trim() }))}
                  placeholder="Ex: joaosilva"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Nome Completo</Label>
                <Input
                  id="signup-name"
                  value={signupData.name}
                  onChange={(e) => setSignupData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: João Silva"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-username">Nome de Usuário</Label>
                <Input
                  id="signup-username"
                  type="text"
                  value={signupData.username}
                  onChange={(e) =>
                    setSignupData((prev) => ({ ...prev, username: e.target.value.toLowerCase().trim() }))
                  }
                  placeholder="Ex: joaosilva (sem espaços)"
                  required
                />
                <p className="text-xs text-gray-500">Apenas letras, números e _ (sem espaços)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={signupData.password}
                  onChange={(e) => setSignupData((prev) => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
