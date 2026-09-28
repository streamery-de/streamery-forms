"use client"

import { __ } from "@/lib/i18n";
import { useEffect, useState } from "react"
import { ExternalLink, ShieldCheck } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { apiGet, apiPost } from "@/lib/api"

type CaptchaProvider = "recaptcha" | "friendlycaptcha"

interface ProviderKeys {
  enabled: boolean
  site_key: string
  // Comes back masked ("••••••••") when a secret is stored. Sending the mask
  // back unchanged tells the server to keep the saved secret.
  secret_key: string
}

type CaptchaSettings = Record<CaptchaProvider, ProviderKeys>

const EMPTY: CaptchaSettings = {
  recaptcha: { enabled: false, site_key: "", secret_key: "" },
  friendlycaptcha: { enabled: false, site_key: "", secret_key: "" },
}

const KEYS_URL: Record<CaptchaProvider, string> = {
  recaptcha: "https://www.google.com/recaptcha/admin",
  friendlycaptcha: "https://friendlycaptcha.com/",
}

export default function CaptchaPage() {
  const [settings, setSettings] = useState<CaptchaSettings>(EMPTY)
  const [active, setActive] = useState<CaptchaProvider | "none">("none")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  const applyResponse = (data: CaptchaSettings) => {
    const next = { ...EMPTY, ...data }
    setSettings(next)
    // The server verifies against reCAPTCHA first when both are enabled, so
    // mirror that order if an older save left both switched on.
    setActive(next.recaptcha.enabled ? "recaptcha" : next.friendlycaptcha.enabled ? "friendlycaptcha" : "none")
  }

  const load = async () => {
    try {
      setLoading(true)
      const response = await apiGet<{ data: CaptchaSettings }>("/settings/captcha")
      if (response.data) {
        applyResponse(response.data)
      }
    } catch (err: any) {
      console.error("Failed to load CAPTCHA settings:", err)
    } finally {
      setLoading(false)
    }
  }

  const updateKey = (provider: CaptchaProvider, key: "site_key" | "secret_key", value: string) => {
    setSettings((prev) => ({ ...prev, [provider]: { ...prev[provider], [key]: value } }))
  }

  const handleSave = async () => {
    if (active !== "none" && (!settings[active].site_key.trim() || !settings[active].secret_key.trim())) {
      toast({ title: __("error"), description: __("captchaKeysRequired"), variant: "destructive" })
      return
    }

    try {
      setSaving(true)
      const payload: CaptchaSettings = {
        recaptcha: { ...settings.recaptcha, enabled: active === "recaptcha" },
        friendlycaptcha: { ...settings.friendlycaptcha, enabled: active === "friendlycaptcha" },
      }
      const response = await apiPost<{ message: string; data: { data: CaptchaSettings } }>("/settings/captcha", payload)
      if (response.data?.data) {
        applyResponse(response.data.data)
      }
      toast({ title: __("settingsSaved"), description: response.message })
    } catch (err: any) {
      toast({
        title: __("error"),
        description: err.message || __("errorOccurred"),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{__("captchaSettings")}</h3>
        <p className="text-sm text-muted-foreground">{__("captchaSettingsDescription")}</p>
      </div>
      <Separator />

      <div className="space-y-2">
        <Label htmlFor="captcha-provider">{__("captchaProvider")}</Label>
        <Select
          value={active}
          onValueChange={(value) => setActive(value as CaptchaProvider | "none")}
          disabled={loading || saving}
        >
          <SelectTrigger id="captcha-provider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{__("captchaProviderNone")}</SelectItem>
            <SelectItem value="friendlycaptcha">{__("captchaProviderFriendly")}</SelectItem>
            <SelectItem value="recaptcha">{__("captchaProviderRecaptcha")}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[0.8rem] text-muted-foreground">{__("captchaProviderHelp")}</p>
      </div>

      {active !== "none" && (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="space-y-2">
            <Label htmlFor="captcha-site-key">{__("captchaSiteKey")}</Label>
            <Input
              id="captcha-site-key"
              value={settings[active].site_key}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateKey(active, "site_key", e.target.value)}
              autoComplete="off"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="captcha-secret-key">{__("captchaSecretKey")}</Label>
            <Input
              id="captcha-secret-key"
              type="password"
              // wp-admin's input[type=password] rule outranks the Input
              // component's classes; force the same look as the site key field.
              className="!rounded-md !border-input !px-3 !py-2 !shadow-none"
              value={settings[active].secret_key}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateKey(active, "secret_key", e.target.value)}
              autoComplete="new-password"
              disabled={saving}
            />
            <p className="text-[0.8rem] text-muted-foreground">{__("captchaSecretKeyHelp")}</p>
          </div>
          <a
            href={KEYS_URL[active]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            {__("captchaGetKeys")}
            <ExternalLink className="h-3 w-3" />
          </a>
          <p className="text-[0.8rem] text-muted-foreground">
            {active === "recaptcha" ? __("captchaRecaptchaPrivacy") : __("captchaFriendlyPrivacy")}
          </p>
        </div>
      )}

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertDescription>{__("captchaBlockHint")}</AlertDescription>
      </Alert>

      <Button onClick={handleSave} disabled={loading || saving}>
        {__("save")}
      </Button>
    </div>
  )
}
