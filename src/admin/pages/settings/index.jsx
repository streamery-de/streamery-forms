import { Separator } from "@/components/ui/separator"
import { GeneralForm } from "@/admin/pages/settings/general-form"
import SettingsLayout from "@/admin/pages/settings/layout"
import { Outlet, useLocation } from "react-router-dom"

export default function Settings() {
  const location = useLocation()
  
  // Check if we have nested routes (mailboxes, providers, labels, captcha, or smtp)
  const hasNestedRoute = location.pathname.includes("/mailboxes") || location.pathname.includes("/providers") || location.pathname.includes("/labels") || location.pathname.includes("/captcha") || location.pathname.includes("/smtp")
  
  return (
    <SettingsLayout>
      {hasNestedRoute ? (
        <Outlet />
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">General Settings</h3>
            <p className="text-sm text-muted-foreground">
              Manage your general plugin settings and preferences.
            </p>
          </div>
          <Separator />
          <GeneralForm />
        </div>
      )}
    </SettingsLayout>
  )
}