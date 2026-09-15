import { Separator } from "@/components/ui/separator"
import { SidebarNav } from "@/components/settings/sidebar-nav"
import { SupportCard } from "@/components/support/SupportCard"

const sidebarNavItems = [
  {
    title: "General",
    href: "#/settings",
  },
  {
    title: "Mailboxes",
    href: "#/settings/mailboxes",
  },
  {
    title: "Providers",
    href: "#/settings/providers",
  },
  {
    title: "Labels",
    href: "#/settings/labels",
  },
  {
    title: "SMTP",
    href: "#/settings/smtp",
  },
]

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <>
      
      <div className="hidden h-full max-h-full overflow-y-auto space-y-6 p-10 pb-16 md:block dark:bg-gray-900">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight dark:text-white">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and set e-mail preferences.
          </p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
            <SupportCard className="mx-4 mt-8 hidden lg:block" />
          </aside>
          <div className="flex-1 lg:max-w-2xl">{children}</div>
        </div>
      </div>
    </>
  )
}