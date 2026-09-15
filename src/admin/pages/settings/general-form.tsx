"use client"

import { __ } from "@/lib/i18n";
import { useState, useEffect } from "react"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { apiGet, apiPost } from "@/lib/api"

export function GeneralForm() {
  const [debugEnabled, setDebugEnabled] = useState(false)
  const [debugLoading, setDebugLoading] = useState(true)
  const [debugSaving, setDebugSaving] = useState(false)

  const [adminBarEnabled, setAdminBarEnabled] = useState(false)
  const [adminBarLoading, setAdminBarLoading] = useState(true)
  const [adminBarSaving, setAdminBarSaving] = useState(false)

  useEffect(() => {
    loadDebugStatus()
    loadAdminBarStatus()
  }, [])

  const loadDebugStatus = async () => {
    try {
      setDebugLoading(true)
      const response = await apiGet<{ enabled: boolean }>("/settings/debug")
      if (response.enabled !== undefined) {
        setDebugEnabled(response.enabled)
      }
    } catch (err: any) {
      console.error("Failed to load debug status:", err)
    } finally {
      setDebugLoading(false)
    }
  }

  const handleDebugToggle = async (enabled: boolean) => {
    try {
      setDebugSaving(true)
      const response = await apiPost<{ enabled: boolean; message: string }>("/settings/debug", {
        enabled,
      })
      setDebugEnabled(response.enabled)
      toast({
        title: __("settingsSaved"),
        description: response.message || (enabled ? __("debugModeEnabled") : __("debugModeDisabled")),
      })
    } catch (err: any) {
      toast({
        title: __("error"),
        description: err.message || __("errorOccurred"),
        variant: "destructive",
      })
    } finally {
      setDebugSaving(false)
    }
  }

  const loadAdminBarStatus = async () => {
    try {
      setAdminBarLoading(true)
      const response = await apiGet<{ enabled: boolean }>("/settings/admin-bar")
      if (response.enabled !== undefined) {
        setAdminBarEnabled(response.enabled)
      }
    } catch (err: any) {
      console.error("Failed to load admin bar status:", err)
    } finally {
      setAdminBarLoading(false)
    }
  }

  const handleAdminBarToggle = async (enabled: boolean) => {
    try {
      setAdminBarSaving(true)
      const response = await apiPost<{ enabled: boolean; message: string }>("/settings/admin-bar", {
        enabled,
      })
      setAdminBarEnabled(response.enabled)
      toast({
        title: __("settingsSaved"),
        description: enabled ? __("adminBarMenuEnabled") : __("adminBarMenuDisabled"),
      })
    } catch (err: any) {
      toast({
        title: __("error"),
        description: err.message || __("errorOccurred"),
        variant: "destructive",
      })
    } finally {
      setAdminBarSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label className="text-base">{__('debugMode')}</Label>
          <p className="text-[0.8rem] text-muted-foreground">
            {__('debugModeDescription')}
          </p>
        </div>
        <Switch
          checked={debugEnabled}
          onCheckedChange={handleDebugToggle}
          disabled={debugLoading || debugSaving}
        />
      </div>

      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label className="text-base">{__('adminBarMenu')}</Label>
          <p className="text-[0.8rem] text-muted-foreground">
            {__('adminBarMenuDescription')}
          </p>
        </div>
        <Switch
          checked={adminBarEnabled}
          onCheckedChange={handleAdminBarToggle}
          disabled={adminBarLoading || adminBarSaving}
        />
      </div>
    </div>
  )
}
