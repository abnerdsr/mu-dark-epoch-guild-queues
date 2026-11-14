"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_VERSION } from "@/lib/version"

const CHECK_INTERVAL_MS = 60_000

/**
 * Mostra um aviso quando um deploy novo foi publicado enquanto a página estava
 * aberta, pedindo para recarregar (o código antigo pode não funcionar mais).
 */
export function UpdateNotice() {
  const [hasUpdate, setHasUpdate] = useState(false)

  useEffect(() => {
    if (hasUpdate) return

    const check = async () => {
      try {
        const response = await fetch("/api/version", { cache: "no-store" })
        if (!response.ok) return
        const { version } = (await response.json()) as { version?: string }
        if (version && version !== APP_VERSION) setHasUpdate(true)
      } catch {
        // offline ou deploy em andamento: tenta de novo depois
      }
    }

    const interval = setInterval(check, CHECK_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === "visible") check()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [hasUpdate])

  if (!hasUpdate) return null

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-lg border border-mu-gold bg-card px-4 py-3 shadow-lg mu-card-glow"
    >
      <p className="flex-1 text-sm">Uma nova versão do sistema está disponível.</p>
      <Button size="sm" onClick={() => window.location.reload()} className="mu-button-glow">
        <RefreshCw className="mr-2 h-4 w-4" />
        Recarregar
      </Button>
    </div>
  )
}
