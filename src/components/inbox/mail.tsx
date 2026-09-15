"use client"
import * as React from "react"
import {
  Search,
  LucideIcon,
} from "lucide-react"

import { AccountSwitcher } from "@/components/inbox/account-switcher"
import { MailDisplay } from "@/components/inbox/mail-display"
import { MailList } from "@/components/inbox/mail-list"
import { Nav } from "@/components/inbox/nav"
import { CollapsibleSection } from "@/components/inbox/collapsible-section"
import { FolderNav } from "@/components/inbox/folder-nav"
import type { InboxFolderItem } from "@/admin/pages/inbox/use-inbox-folders"
import { Mail as MailType } from "@/components/inbox/mail-display"
import { useMail } from "@/admin/pages/inbox/use-mail"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { setInboxFilters } from "@/admin/pages/inbox/stores"
import { useStore } from "@nanostores/react"
import { $inboxFilters } from "@/admin/pages/inbox/stores"
import { Loader2, Trash2 } from "lucide-react"
import { useState } from "react"
import { apiPost } from "@/lib/api"
import { __ } from "@/lib/i18n"
import { toast } from "sonner"
type NavLink = {
  title: string
  label?: string
  icon?: React.ReactNode | LucideIcon
  variant: "default" | "ghost"
  onClick: () => void
}
interface MailProps {
  mails: MailType[]
  loading?: boolean
  autoRefresh?: boolean
  onAutoRefreshChange?: (enabled: boolean) => void
  defaultNavLinks: NavLink[]
  additionalNavLinks: NavLink[]
  labelNavLinks: NavLink[]
  defaultLayout: number[] | undefined
  defaultCollapsed?: boolean
  navCollapsedSize: number
  onBulkDelete?: (ids: number[]) => void
  onBulkMove?: (ids: number[], status: string) => void
  onMarkRead?: (id: number, read: boolean) => void
  onDelete?: (id: number) => void
  onMoveTo?: (id: number, status: string) => void
  onMoveToFolder?: (id: number, folderId: number) => void
  onMoveToMailbox?: (id: number, mailboxId: number) => void
  mailboxes?: { id: number; title: string }[]
  onRefresh?: () => void
  onEmptyTrash?: () => void
  foldersTree?: InboxFolderItem[]
  activeFolderId?: number | null
  onSelectFolder?: (folderId: number | null) => void
  onCreateFolder?: (params: { name: string; parent_id?: number | null }) => Promise<InboxFolderItem>
  onUpdateFolder?: (params: { id: number; name?: string; parent_id?: number | null }) => Promise<InboxFolderItem>
  onDeleteFolder?: (id: number) => Promise<void>
  onDropEntry?: (entryId: number, folderId: number) => void
}

export function MailComp({
  mails,
  loading = false,
  autoRefresh = true,
  onAutoRefreshChange,
  defaultNavLinks = [],  
  additionalNavLinks = [],
  labelNavLinks = [],
  defaultLayout = [265, 440, 655],
  defaultCollapsed = false,
  navCollapsedSize,
  onBulkDelete,
  onBulkMove,
  onMarkRead,
  onDelete,
  onMoveTo,
  onMoveToFolder,
  onMoveToMailbox,
  mailboxes = [],
  onRefresh,
  onEmptyTrash,
  foldersTree = [],
  activeFolderId = null,
  onSelectFolder,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onDropEntry,
}: MailProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
  const [mail] = useMail()
  const filter = useStore($inboxFilters)
  const [showEmptyTrashDialog, setShowEmptyTrashDialog] = useState(false)
  const [emptying, setEmptying] = useState(false)

  const foldersFlat = React.useMemo(() => {
    const out: { id: number; name: string }[] = []
    const walk = (list: InboxFolderItem[]) => {
      list.forEach((f) => {
        out.push({ id: f.id, name: f.name })
        if (f.children?.length) walk(f.children)
      })
    }
    walk(foldersTree)
    return out
  }, [foldersTree])

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout=${JSON.stringify(
            sizes
          )}`
        }}
        className="h-full items-stretch"
      >
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={15}
          maxSize={20}
          onCollapse={(collapsed: boolean) => {
            setIsCollapsed(collapsed)
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
              collapsed
            )}`
          }}
          className={cn('h-full overflow-y-auto', isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out")}
        >
          <div className={cn("flex h-[52px] items-center justify-center", isCollapsed ? 'h-[52px]': 'px-2')}>
            <AccountSwitcher isCollapsed={isCollapsed} />
          </div>
          <Separator />
          <Nav
            isCollapsed={isCollapsed}
            links={defaultNavLinks}
          />
          {onSelectFolder && onCreateFolder && onUpdateFolder && onDeleteFolder && (
            <>
              <Separator />
              <FolderNav
                foldersTree={foldersTree}
                activeFolderId={activeFolderId ?? null}
                isCollapsed={isCollapsed}
                onSelectFolder={onSelectFolder}
                onCreateFolder={onCreateFolder}
                onUpdateFolder={onUpdateFolder}
                onDeleteFolder={onDeleteFolder}
                onDropEntry={onDropEntry}
              />
            </>
          )}
          <Separator />
          <CollapsibleSection
            title={__("forms")}
            storageKey="streamery-forms-inbox-forms-collapsed"
            defaultOpen={false}
            isCollapsed={isCollapsed}
          >
            <Nav
              isCollapsed={isCollapsed}
              links={additionalNavLinks}
            />
          </CollapsibleSection>
          <Separator />
          <CollapsibleSection
            title={__("labels")}
            storageKey="streamery-forms-inbox-labels-collapsed"
            defaultOpen={false}
            isCollapsed={isCollapsed}
          >
            <Nav
              isCollapsed={isCollapsed}
              links={labelNavLinks}
            />
          </CollapsibleSection>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30} className="h-full overflow-y-auto"
        >
          <Tabs defaultValue="all">
            <div className="flex flex-col gap-2 px-4 py-1.5">
              <div className="flex items-center">
                <h1 className="text-xl dark:text-white font-bold flex items-center gap-2">
                  Inbox
                  {loading && (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  )}
                </h1>
                <div className="ml-auto flex items-center gap-2">
                  {onAutoRefreshChange && (
                    <div className="flex items-center gap-2 px-3 py-1.5 border rounded-md">
                      <Switch
                        id="auto-refresh"
                        checked={autoRefresh}
                        onCheckedChange={onAutoRefreshChange}
                      />
                      <Label htmlFor="auto-refresh" className="text-sm cursor-pointer whitespace-nowrap">
                        {__('autoRefresh')}
                      </Label>
                    </div>
                  )}
                  <TabsList>
                    <TabsTrigger onClick={() => setInboxFilters({ is_read: undefined })} value="all" className="text-zinc-600 dark:text-zinc-200">All mail</TabsTrigger>
                    <TabsTrigger onClick={() => setInboxFilters({ is_read: 0 })} value="unread" className="text-zinc-600 dark:text-zinc-200">Unread</TabsTrigger>
                  </TabsList>
                </div>
              </div>
              {filter.status === 'trash' && (
                <div className="flex items-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowEmptyTrashDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {__('emptyTrash')}
                  </Button>
                </div>
              )}
            </div>
            <Separator />
            <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <form>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search" className="pl-8" />
                </div>
              </form>
            </div>
            <MailList 
              items={mails}
              loading={loading}
              onBulkDelete={onBulkDelete}
              onBulkMove={onBulkMove}
              onMarkRead={onMarkRead}
              onDelete={onDelete}
              onMoveTo={onMoveTo}
              onMoveToFolder={onMoveToFolder}
              onMoveToMailbox={onMoveToMailbox}
              mailboxes={mailboxes}
              folders={foldersFlat}
            />
          </Tabs>
          
          <Dialog open={showEmptyTrashDialog} onOpenChange={setShowEmptyTrashDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{__('emptyTrash')}</DialogTitle>
                <DialogDescription>
                  {__('emptyTrashConfirmation')}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowEmptyTrashDialog(false)}
                  disabled={emptying}
                >
                  {__('cancel')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    try {
                      setEmptying(true)
                      await apiPost('/entries/empty-trash', {})
                      toast({
                        title: __('trashEmptied'),
                        description: __('trashEmptiedDescription'),
                      })
                      setShowEmptyTrashDialog(false)
                      if (onEmptyTrash) {
                        onEmptyTrash()
                      }
                    } catch (err: any) {
                      toast({
                        title: __('error'),
                        description: err.message || __('errorOccurred'),
                        variant: 'destructive',
                      })
                    } finally {
                      setEmptying(false)
                    }
                  }}
                  disabled={emptying}
                >
                  {emptying ? __('emptying') : __('emptyTrash')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ResizablePanel>
        <ResizableHandle className={""} withHandle />
        <ResizablePanel defaultSize={defaultLayout[2]}>
          <MailDisplay
            mail={mails.find((item) => item.id === mail.selected) || null}
            onRefresh={onRefresh}
            folders={foldersFlat}
            mailboxes={mailboxes}
            onMoveToMailbox={onMoveToMailbox}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  )
}