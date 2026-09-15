import { MailComp } from "@/components/inbox/mail"
import { StatusCount, useEntries, useEntryLabels, useFormIdentifiers, useStatuses, useBulkEntryOperations, useMarkEntryRead, useDeleteEntry, useUpdateEntry, useMailboxes } from "@/hooks";
import { Inbox, ArchiveX, Trash2, Archive } from "lucide-react";
import { apiPost } from "@/lib/api";
import { useStore } from "@nanostores/react";
import { $inboxFilters, setInboxFilters } from "./stores";
import { NavLink } from "@/components/inbox/nav";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { __ } from "@/lib/i18n";
import { toast } from "sonner"
import { useInboxFolders } from "./use-inbox-folders"

const getStatusCount = (statuses: StatusCount[], status: string = 'new') => {
  return statuses.find((s) => s.status === status)?.count || 0;
}
/** Sidebar: only show number when unread count > 0 */
const sidebarCount = (n: number) => (n > 0 ? n.toString() : undefined);

export default function MailPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = useStore($inboxFilters);
  const { entries, loading: entriesLoading, refetch: refetchEntries } = useEntries();
  const { mailboxes } = useMailboxes();

  // Sync URL ?mailbox= id with store on load and when URL changes (runs first)
  useEffect(() => {
    const mailboxParam = searchParams.get("mailbox");
    if (mailboxParam != null && mailboxParam !== "") {
      const id = parseInt(mailboxParam, 10);
      if (!Number.isNaN(id) && id > 0) {
        const current = $inboxFilters.get().mailbox_id;
        if (current !== id) {
          setInboxFilters({ mailbox_id: id });
        }
      }
    }
  }, [searchParams]);

  // Keep URL in sync when mailbox is changed in the UI (e.g. account switcher).
  // Read mailbox_id from store so we don't overwrite URL on reload (first effect
  // updates store from URL; we must use store value here, not stale filter from closure).
  useEffect(() => {
    const wanted = $inboxFilters.get().mailbox_id.toString();
    const existing = searchParams.get("mailbox");
    if (existing === wanted) return;
    const next = new URLSearchParams(searchParams);
    if (Number(wanted) > 0) {
      next.set("mailbox", wanted);
    } else {
      next.delete("mailbox");
    }
    setSearchParams(next, { replace: true });
  }, [filter.mailbox_id, searchParams]);
  const { formIdentifiers, refetch: refetchFormIdentifiers } = useFormIdentifiers();
  const {statuses, refetch: refetchStatuses} = useStatuses(); 
  const { labels, refetch: refetchLabels } = useEntryLabels();
  const { bulkDelete, bulkMove, loading: bulkLoading } = useBulkEntryOperations();
  const { markRead } = useMarkEntryRead();
  const { deleteEntry } = useDeleteEntry();
  const { updateEntry: updateEntryFn } = useUpdateEntry();
  const {
    foldersTree,
    createFolder,
    updateFolder,
    deleteFolder,
    refetch: refetchFolders,
  } = useInboxFolders();

  const AUTO_REFRESH_STORAGE_KEY = 'streamery-forms-inbox-auto-refresh';
  const [autoRefresh, setAutoRefresh] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(AUTO_REFRESH_STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  });

  const handleAutoRefreshChange = (enabled: boolean) => {
    setAutoRefresh(enabled);
    localStorage.setItem(AUTO_REFRESH_STORAGE_KEY, String(enabled));
  };

  const refetchAll = () => {
    refetchEntries();
    refetchFormIdentifiers();
    refetchStatuses();
    refetchLabels();
    refetchFolders();
  };

  // Refresh every 5 seconds when auto-refresh is enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(refetchAll, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  /* @ts-ignore */
  const makeDataToReadableString = (data) => {
    if (typeof data !== 'object') {
      return data?.toString() || __('noData');
    }
    return Object.entries(data || {}).map(([key, value]) => {
      return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`;
    }).join('\n') || __('noData');
  }

  const entriesListing = entries?.map((entry) => {
    return {
      date: entry.date_created,
      read: entry.is_read,
      labels: entry.labels || [],
      id: entry.id,
      name: entry.data?.name || '',
      email: entry.from_mail || entry.data?.email || '',
      subject: entry.subject || entry.data?.subject || '',
      status: entry.status || 'inbox',
      text: makeDataToReadableString(entry.data),
      entry: entry, // Pass full entry for body rendering
    }
  }) || [];

  const additionalNavLinks: NavLink[] = formIdentifiers?.map((formIdentifier) => {
    return {
      title: formIdentifier.form_identifier,
      label: sidebarCount(formIdentifier.count),
      variant: filter.form_identifier === formIdentifier.form_identifier ? "default" : "ghost",
      onClick: () => {
        if(filter.form_identifier === formIdentifier.form_identifier) {
          setInboxFilters({ form_identifier: '' });
        } else {
          setInboxFilters({ form_identifier: formIdentifier.form_identifier });
        }
      },
    }
  }) || [];

  const setStatus = (nextStatus: string) => {
    if(filter.status === nextStatus) {
      setInboxFilters({ status: 'inbox', folder_id: null });
    } else {
      setInboxFilters({ status: nextStatus, folder_id: null });
    }
  }

  const handleDropOnStatus = async (entryId: number, status: string) => {
    try {
      await updateEntryFn({ id: entryId, status, folder_id: null })
      toast({
        title: __('entryMoved'),
        description: __('entryMovedDescription'),
      })
      refetchAll()
    } catch (err: any) {
      toast({
        title: __('error'),
        description: err.message || __('errorOccurred'),
        variant: 'destructive',
      })
    }
  }

  const handleDropOnLabel = async (entryId: number, labelId: number) => {
    try {
      await apiPost('entry-labels/attach', { entry_id: entryId, label_id: labelId })
      toast({
        title: __('labelAdded'),
        description: __('labelAddedDescription'),
      })
      refetchAll()
    } catch (err: any) {
      toast({
        title: __('error'),
        description: err.message || __('errorOccurred'),
        variant: 'destructive',
      })
    }
  }

  const defaultNavLinks: NavLink[] = [
    {
      title: __('inbox'),
      label: sidebarCount(getStatusCount(statuses, 'inbox')),
      icon: Inbox,
      variant: filter.status === 'inbox' && filter.folder_id == null ? "default" : "ghost",
      onClick: () => {
        setInboxFilters({ labels: [], is_read: undefined, status: 'inbox', folder_id: null });
      },
      onDrop: (entryId) => handleDropOnStatus(entryId, 'inbox'),
      dropType: 'status',
      dropValue: 'inbox',
    },
    {
      title: __('junk'),
      label: sidebarCount(getStatusCount(statuses, 'junk')),
      icon: ArchiveX,
      variant: filter.status === 'junk' && filter.folder_id == null ? "default" : "ghost",
      onClick: () => {
        setStatus('junk');
      },
      onDrop: (entryId) => handleDropOnStatus(entryId, 'junk'),
      dropType: 'status',
      dropValue: 'junk',
    },
    {
      title: __('archive'),
      label: sidebarCount(getStatusCount(statuses, 'archive')),
      icon: Archive,
      variant: filter.status === 'archive' && filter.folder_id == null ? "default" : "ghost",
      onClick: () => {
        setStatus('archive');
      },
      onDrop: (entryId) => handleDropOnStatus(entryId, 'archive'),
      dropType: 'status',
      dropValue: 'archive',
    },
    {
      title: __('trash'),
      label: sidebarCount(getStatusCount(statuses, 'trash')),
      icon: Trash2,
      variant: filter.status === 'trash' && filter.folder_id == null ? "default" : "ghost",
      onClick: () => {
        setStatus('trash');
      },
      onDrop: (entryId) => handleDropOnStatus(entryId, 'trash'),
      dropType: 'status',
      dropValue: 'trash',
    },
  ]

  // @ts-expect-error - icon is a function that returns a React element
  const labelNavLinks: NavLink[] = labels.map((label) => {
    return {
      title: label.name,
      icon: () => <span style={{ backgroundColor: label.color }} className="w-2 h-2 rounded-full mr-2" />,
      variant: filter.labels.includes(label.id) ? "default" : "ghost",
      onClick: () => {
        if(filter.labels.includes(label.id)) {
          setInboxFilters({ labels: filter.labels.filter((l) => l !== label.id) });
        } else {
          setInboxFilters({ labels: [...filter.labels, label.id] });
        }
      },
      onDrop: (entryId) => handleDropOnLabel(entryId, label.id),
      dropType: 'label',
      dropValue: label.id,
    }
  })

  return (
    <>
     
      <div className="hidden dark:bg-gray-900 flex-col md:flex h-full">
        <MailComp
          defaultNavLinks={defaultNavLinks}
          additionalNavLinks={additionalNavLinks}
          labelNavLinks={labelNavLinks}
          foldersTree={foldersTree}
          activeFolderId={filter.folder_id}
          onSelectFolder={(folderId) => setInboxFilters({ folder_id: folderId })}
          onCreateFolder={async (params) => {
            try {
              const folder = await createFolder(params);
              toast({ title: __('folderCreated') });
              return folder;
            } catch (err) {
              toast({ title: __('error'), description: err?.message || __('errorOccurred'), variant: 'destructive' });
              throw err;
            }
          }}
          onUpdateFolder={async (params) => {
            try {
              const folder = await updateFolder(params);
              toast({ title: __('folderUpdated') });
              return folder;
            } catch (err) {
              toast({ title: __('error'), description: err?.message || __('errorOccurred'), variant: 'destructive' });
              throw err;
            }
          }}
          onDeleteFolder={async (id) => {
            try {
              await deleteFolder(id);
              toast({ title: __('folderDeleted') });
            } catch (err) {
              toast({ title: __('error'), description: err?.message || __('errorOccurred'), variant: 'destructive' });
              throw err;
            }
          }}
          onDropEntry={async (entryId, folderId) => {
            try {
              await updateEntryFn({ id: entryId, folder_id: folderId });
              toast({ title: __('entryMoved'), description: __('entryMovedDescription') });
              refetchAll();
            } catch (err) {
              toast({ title: __('error'), description: err?.message || __('errorOccurred'), variant: 'destructive' });
            }
          }}
          mails={entriesListing}
          loading={entriesLoading}
          autoRefresh={autoRefresh}
          onAutoRefreshChange={handleAutoRefreshChange}
          defaultLayout={[265, 440, 655]}
          defaultCollapsed={false}
          navCollapsedSize={4}
          onBulkDelete={async (ids) => {
            try {
              await bulkDelete(ids)
              toast({
                title: __('entriesDeleted'),
                description: __('entriesDeletedDescription'),
              })
              refetchAll()
            } catch (err: any) {
              toast({
                title: __('error'),
                description: err.message || __('errorOccurred'),
                variant: 'destructive',
              })
            }
          }}
          onBulkMove={async (ids, status) => {
            try {
              await bulkMove(ids, status)
              toast({
                title: __('entriesMoved'),
                description: __('entriesMovedDescription'),
              })
              refetchAll()
            } catch (err: any) {
              toast({
                title: __('error'),
                description: err.message || __('errorOccurred'),
                variant: 'destructive',
              })
            }
          }}
          onMarkRead={async (id, read) => {
            try {
              await markRead(id, read)
              toast({
                title: __('entryUpdated'),
                description: read ? __('entryMarkedAsRead') : __('entryMarkedAsUnread'),
              })
              refetchAll()
            } catch (err: any) {
              toast({
                title: __('error'),
                description: err.message || __('errorOccurred'),
                variant: 'destructive',
              })
            }
          }}
          onDelete={async (id) => {
            try {
              await deleteEntry(id)
              toast({
                title: __('entryDeleted'),
                description: __('entryDeletedDescription'),
              })
              refetchAll()
            } catch (err: any) {
              toast({
                title: __('error'),
                description: err.message || __('errorOccurred'),
                variant: 'destructive',
              })
            }
          }}
          onMoveTo={async (id, status) => {
            try {
              await updateEntryFn({ id, status, folder_id: null })
              toast({
                title: __('entryMoved'),
                description: __('entryMovedDescription'),
              })
              refetchAll()
            } catch (err: any) {
              toast({
                title: __('error'),
                description: err.message || __('errorOccurred'),
                variant: 'destructive',
              })
            }
          }}
          onMoveToFolder={async (id, folderId) => {
            try {
              await updateEntryFn({ id, folder_id: folderId })
              toast({
                title: __('entryMoved'),
                description: __('entryMovedDescription'),
              })
              refetchAll()
            } catch (err: any) {
              toast({
                title: __('error'),
                description: err.message || __('errorOccurred'),
                variant: 'destructive',
              })
            }
          }}
          onMoveToMailbox={async (id, mailboxId) => {
            try {
              await updateEntryFn({ id, mailbox_id: mailboxId, folder_id: null })
              toast({
                title: __('entryMovedToMailbox'),
                description: __('entryMovedDescription'),
              })
              refetchAll()
            } catch (err: any) {
              toast({
                title: __('error'),
                description: err.message || __('errorOccurred'),
                variant: 'destructive',
              })
            }
          }}
          mailboxes={mailboxes}
          onRefresh={refetchAll}
          onEmptyTrash={refetchAll}
        />
      </div>
    </>
  )
}