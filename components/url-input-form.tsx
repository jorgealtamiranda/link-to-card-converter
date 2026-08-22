"use client"

import { useState } from "react"
import { Link2, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface UrlInputFormProps {
  onSubmit: (url: string) => void
  isLoading: boolean
  loadingLabel?: string
}

export default function UrlInputForm({ onSubmit, isLoading, loadingLabel = "Cargando..." }: UrlInputFormProps) {
  const [url, setUrl] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onSubmit(url.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="url"
            placeholder="Pega el link de la propiedad aquí..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-12 h-14 text-base rounded-xl border-2 focus:border-primary bg-card"
            required
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="h-14 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {loadingLabel}
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Generar Card
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
