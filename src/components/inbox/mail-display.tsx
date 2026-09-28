import format from "date-fns/format"
import React from "react"
import {
  Archive,
  ArchiveX,
  Folder,
  Inbox,
  MoreVertical,
  RefreshCw,
  Trash2,
} from "lucide-react"

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { EntryLabel, useEntryLabels, useUpdateEntry, Entry } from "@/hooks"
import { __ } from "@/lib/i18n"
import { formatFieldLabel, visibleEntryFields } from "@/lib/utils"
import { useProviderByType } from "@/hooks/useProviders"
import { useEffect, useMemo, ReactNode } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface Mail {
  id: number;
  name: string;
  status: string;
  email: string;
  subject: string;
  text: string;
  date: string;
  read: boolean;
  labels: EntryLabel[];
  entry?: Entry; // Full entry object for body rendering
}

export interface MoveToFolder {
  id: number
  name: string
}

interface MailDisplayProps {
  mail: Mail | null
  onRefresh?: () => void
  /** Flat list of user folders for "Move to" submenu */
  folders?: MoveToFolder[]
  /** Mailboxes for "Move to mailbox" (other than current) */
  mailboxes?: { id: number; title: string }[]
  onMoveToMailbox?: (entryId: number, mailboxId: number) => void
}

// Helper component to format all fields as a Table
function AllFieldsTable({ data }: { data: Record<string, any> }) {
  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  // Helper function to check if value is a file array
  const isFileArray = (value: any): boolean => {
    return Array.isArray(value) && 
           value.length > 0 && 
           typeof value[0] === 'object' && 
           value[0] !== null &&
           'url' in value[0] && 
           'name' in value[0];
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Field</TableHead>
          <TableHead>Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {visibleEntryFields(data).map(([key, value]) => {
          // Format value
          let formattedValue: React.ReactNode;
          
          if (isFileArray(value)) {
            // Render file list with thumbnails and download links
            formattedValue = (
              <div className="flex flex-col gap-2">
                {(value as any[]).map((file: any, index: number) => {
                  const isImage = file.type?.startsWith('image/');
                  const fileSize = file.size ? formatFileSize(file.size) : '';
                  
                  return (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded">
                      {isImage ? (
                        <img 
                          src={file.url} 
                          alt={file.original_name || file.name} 
                          className="w-15 h-15 object-cover rounded flex-shrink-0"
                        />
                      ) : (
                        <div className="w-15 h-15 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">📄</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-medium block truncate"
                        >
                          {file.original_name || file.name}
                        </a>
                        {fileSize && (
                          <span className="text-xs text-gray-500">{fileSize}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          } else if (Array.isArray(value)) {
            formattedValue = value.join(', ');
          } else if (typeof value === 'boolean') {
            formattedValue = value ? 'Yes' : 'No';
          } else {
            formattedValue = String(value || '');
          }

          return (
            <TableRow key={key}>
              <TableCell className="font-semibold align-top">
                {formatFieldLabel(key)}
              </TableCell>
              <TableCell>{formattedValue}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function MailDisplay({ mail, onRefresh, folders = [], mailboxes = [], onMoveToMailbox }: MailDisplayProps) {
  const { updateEntry } = useUpdateEntry();
  const currentMailboxId = mail?.entry?.mailbox_id
  const otherMailboxes = mailboxes.filter((mb) => mb.id !== currentMailboxId)
  const {labels, refetch: refetchLabels} = useEntryLabels();
  const { provider: databaseProvider } = useProviderByType('database');
  
  // Render body with placeholders replaced as JSX
  const renderedBody = useMemo(() => {
    if (!mail?.entry || !databaseProvider) {
      return <div className="whitespace-pre-wrap">{mail?.text || ''}</div>;
    }

    const bodyTemplate = databaseProvider.settings?.body || '{all_fields}';
    const submissionData = mail.entry.data || {};
    const formIdentifier = mail.entry.form_identifier || '';

    // Check if template contains {all_fields} - if so, we need to render JSX
    const hasAllFields = bodyTemplate.includes('{all_fields}');
    
    if (hasAllFields && bodyTemplate.trim() === '{all_fields}') {
      // If template is just {all_fields}, render only the table
      return <AllFieldsTable data={submissionData} />;
    }

    // For mixed content, we need to parse and render as JSX
    const parts: ReactNode[] = [];
    let remainingTemplate = bodyTemplate;
    let keyIndex = 0;

    // Replace {all_fields} placeholder with the table component
    if (hasAllFields) {
      const allFieldsIndex = remainingTemplate.indexOf('{all_fields}');
      if (allFieldsIndex > 0) {
        const beforeText = remainingTemplate.substring(0, allFieldsIndex);
        parts.push(
          <div key={`text-${keyIndex++}`} className="whitespace-pre-wrap mb-4">
            {replaceTextPlaceholders(beforeText, submissionData, formIdentifier, mail.entry)}
          </div>
        );
      }
      parts.push(<AllFieldsTable key={`table-${keyIndex++}`} data={submissionData} />);
      remainingTemplate = remainingTemplate.substring(allFieldsIndex + '{all_fields}'.length);
    }

    // Replace other placeholders in remaining text
    if (remainingTemplate) {
      parts.push(
        <div key={`text-${keyIndex++}`} className="whitespace-pre-wrap">
          {replaceTextPlaceholders(remainingTemplate, submissionData, formIdentifier, mail.entry)}
        </div>
      );
    }

    // If no {all_fields}, just replace text placeholders
    if (!hasAllFields) {
      return (
        <div className="whitespace-pre-wrap">
          {replaceTextPlaceholders(bodyTemplate, submissionData, formIdentifier, mail.entry)}
        </div>
      );
    }

    return <>{parts}</>;
  }, [mail?.entry, databaseProvider]);

  // Helper function to replace text placeholders
  function replaceTextPlaceholders(
    template: string,
    submissionData: Record<string, any>,
    formIdentifier: string,
    entry: Entry
  ): string {
    let rendered = template;

    // Replace field placeholders {field_name}
    Object.entries(submissionData).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      const replacement = Array.isArray(value) ? value.join(', ') : String(value || '');
      rendered = rendered.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
    });

    // Replace standard placeholders
    const replacements: Record<string, string> = {
      '{form_identifier}': formIdentifier,
      '{form_title}': formIdentifier || 'Form',
      '{site_name}': window.location.hostname,
      '{date}': new Date(entry.date_created).toLocaleDateString(),
      '{time}': new Date(entry.date_created).toLocaleTimeString(),
      '{ip_address}': entry.ip_address || '',
    };

    Object.entries(replacements).forEach(([placeholder, replacement]) => {
      rendered = rendered.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
    });

    return rendered;
  }
  //set as read when mail is rendered (small delay to avoid flickering)
  useEffect(() => {
    if (!mail || mail.read) return;
    setTimeout(() => {
      updateEntry({
        id: mail.id,
        is_read: true,
      });
    }, 100);
  }, [mail]);

  useEffect(() => {
    refetchLabels();
  }, [mail?.id]);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center p-2">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={mail?.status === 'archive' ? 'default' : 'ghost'} size="icon" disabled={!mail} onClick={async () => {
                if(!mail) return;
                await updateEntry({
                  id: mail.id,
                  status: mail?.status === 'archive' ? 'inbox' : 'archive',
                });
                onRefresh?.();
              }}>
                <Archive className="h-4 w-4" />
                <span className="sr-only">Archive</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{mail?.status === 'archive' ? __('moveToArchive') + ' → Inbox' : __('moveToArchive')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={mail?.status === 'junk' ? 'default' : 'ghost'} size="icon" disabled={!mail} onClick={async () => {
                if(!mail) return;
                await updateEntry({
                  id: mail.id,
                  status: mail?.status === 'junk' ? 'inbox' : 'junk',
                });
                onRefresh?.();
              }}>
                <ArchiveX className="h-4 w-4" />
                <span className="sr-only">Move to junk</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{mail?.status === 'junk' ? __('junk') + ' → Inbox' : __('junk')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant={mail?.status === 'trash' ? 'default' : 'ghost'} size="icon" disabled={!mail} onClick={async () => {
                if(!mail) return;
                await updateEntry({
                  id: mail.id,
                  status: mail?.status === 'trash' ? 'inbox' : 'trash',
                });
                onRefresh?.();
              }}>
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Move to trash</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{mail?.status === 'trash' ? __('moveToTrash') + ' → Inbox' : __('moveToTrash')}</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="mx-1 h-6" />
          {onRefresh && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => onRefresh()}>
                  <RefreshCw className="h-4 w-4" />
                  <span className="sr-only">{__('refresh')}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{__('refresh')}</TooltipContent>
            </Tooltip>
          )}
          <Separator orientation="vertical" className="mx-1 h-6" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          
        </div>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" disabled={!mail}>
              <span className="text-xs">Labels</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {labels.map((label) => (
              <DropdownMenuItem 
              key={label.id}
              className={mail?.labels?.some((l) => l.id === label.id) ? 'bg-accent' : ''}
              onClick={async () => {
                if(!mail) return;
                const labelIds = mail.labels.map((l) => l.id);
                if(labelIds.includes(label.id)) {
                  labelIds.splice(labelIds.indexOf(label.id), 1);
                } else {
                  labelIds.push(label.id);
                }
                await updateEntry({
                  id: mail.id,
                  labels: labelIds as number[],
                });
                onRefresh?.();
              }}
              >{label.name}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={!mail}>
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={async () => {
              if (!mail) return;
              await updateEntry({ id: mail.id, is_read: !mail.read });
              onRefresh?.();
            }}>
              {mail?.read ? __('markAsUnread') : __('markAsRead')}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span>{__('moveTo')}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={async () => {
                  if (!mail) return;
                  await updateEntry({ id: mail.id, status: 'inbox', folder_id: null });
                  onRefresh?.();
                }}>
                  <Inbox className="mr-2 h-4 w-4" />
                  {__('inbox')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  if (!mail) return;
                  await updateEntry({ id: mail.id, status: 'junk', folder_id: null });
                  onRefresh?.();
                }}>
                  <ArchiveX className="mr-2 h-4 w-4" />
                  {__('junk')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  if (!mail) return;
                  await updateEntry({ id: mail.id, status: 'archive', folder_id: null });
                  onRefresh?.();
                }}>
                  <Archive className="mr-2 h-4 w-4" />
                  {__('archive')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={async () => {
                  if (!mail) return;
                  await updateEntry({ id: mail.id, status: 'trash', folder_id: null });
                  onRefresh?.();
                }}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {__('trash')}
                </DropdownMenuItem>
                {folders.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    {folders.map((folder) => (
                      <DropdownMenuItem
                        key={folder.id}
                        onClick={async () => {
                          if (!mail) return;
                          await updateEntry({ id: mail.id, folder_id: folder.id });
                          onRefresh?.();
                        }}
                      >
                        <Folder className="mr-2 h-4 w-4" />
                        {folder.name}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {otherMailboxes.length > 0 && onMoveToMailbox && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span>{__('moveToMailbox')}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {otherMailboxes.map((mailbox) => (
                    <DropdownMenuItem
                      key={mailbox.id}
                      onClick={async () => {
                        if (!mail) return;
                        onMoveToMailbox(mail.id, mailbox.id);
                        onRefresh?.();
                      }}
                    >
                      {mailbox.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Separator />
      {mail ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-start p-4">
            <div className="flex items-start gap-4 text-sm">
              <Avatar>
                <AvatarImage alt={mail.name} />
                <AvatarFallback>
                  {mail.name
                    .split(" ")
                    .map((chunk) => chunk[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <div className="font-semibold">{mail.name}</div>
                <div className="line-clamp-1 text-xs">{mail.subject}</div>
                <div className="line-clamp-1 text-xs">
                  <span className="font-medium">Reply-To:</span> {mail.email}
                </div>
              </div>
            </div>
            {mail.date && (
              <div className="ml-auto text-xs text-muted-foreground">
                {format(new Date(mail.date), "PPpp")}
              </div>
            )}
          </div>
          <Separator />
          <div className="flex-1 text-sm overflow-y-auto">
            {renderedBody}
          </div>
          <Separator className="mt-auto" />
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No message selected
        </div>
      )}
    </div>
  )
}