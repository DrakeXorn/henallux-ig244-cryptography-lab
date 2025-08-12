"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Download } from "lucide-react"

export default function RSAEncryptionPage() {
  const [publicKey, setPublicKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setDownloadSuccess(false)

    try {
      const response = await fetch("/api/encrypt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicKey }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to encrypt message")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "message.enc"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setDownloadSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-12">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-900">RSA Message Encryption</CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Paste your armored RSA public key to encrypt and download a secret message
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="publicKey" className="block text-sm font-medium text-gray-700 mb-2">
                  RSA Public Key (PEM Format)
                </label>
                <Textarea
                  id="publicKey"
                  placeholder={`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`}
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !publicKey.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Encrypting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Encrypt & Download Message
                  </>
                )}
              </Button>
            </form>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {downloadSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <Download className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Encrypted message downloaded successfully as "encrypted-message.bin". This file can only be decrypted
                  with the corresponding private key.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
