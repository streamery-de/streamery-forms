"use client"

import { __ } from "@/lib/i18n";
import React, { useState, useEffect } from "react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "@/components/ui/use-toast"
import { 
  useProviders, 
  useCreateProvider, 
  useUpdateProvider, 
  useDeleteProvider, 
  useProviderTypes,
  type Provider,
  type ProviderTypeField 
} from "@/hooks/useProviders"
import { Plus, Trash2, Edit2, Settings } from "lucide-react"
import { EmailPreview } from "@/components/ui/email-preview"
import { ProviderTypeGrid } from "@/components/providers/ProviderTypeGrid"

// The "Coming Soon" provider tiles (Google Sheets, Salesforce, onOffice,
// Supabase, Brevo) are gone: WordPress.org guideline 5 forbids advertising
// features the shipped build cannot deliver, and the tiles carried third-party
// trademarks and logos besides. Those providers live in the Pro add-on, which
// registers itself through the streamery-forms/available_providers filter -- so this
// grid simply shows whatever providers are actually installed.
import { PlaceholderInput } from "@/components/ui/placeholder-input"
import { EmailField } from "@/components/ui/email-field"
import { FullscreenTemplateEditor } from "@/components/email-template-editor/FullscreenTemplateEditor"
import { apiGet, type ApiResponse } from "@/lib/api"

// Dynamic schema - will be extended based on provider type
const baseProviderFormSchema = z.object({
  name: z.string().min(1, __("nameRequired")),
  provider_type: z.string().min(1, __("providerTypeRequired")),
  form_identifier: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
})

type ProviderFormValues = z.infer<typeof baseProviderFormSchema> & {
  settings: Record<string, any>
}

// Component for rendering dynamic fields based on field definition
function DynamicField({ 
  field, 
  value, 
  onChange,
  formFieldName,
  settings,
  onSettingsChange,
  onOpenTemplateEditor
}: { 
  field: ProviderTypeField
  value: any
  onChange: (value: any) => void
  formFieldName: string
  settings?: Record<string, any>
  onSettingsChange?: (key: string, value: any) => void
  onOpenTemplateEditor?: (fieldName: string) => void
}) {
  switch (field.type) {
    case 'text':
    case 'url':
    case 'password':
      // Special handling for from_email field (even though it's type 'text')
      if (field.name === 'from_email') {
        return (
          <FormItem>
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            <FormControl>
              <EmailField
                value={value ?? field.default ?? ''}
                onChange={onChange}
                placeholder={field.placeholder}
                required={field.required}
              />
            </FormControl>
            {field.description && (
              <FormDescription>{field.description}</FormDescription>
            )}
          </FormItem>
        )
      }
      
      return (
        <FormItem>
          <FormLabel>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <PlaceholderInput
              value={value ?? field.default ?? ''}
              onValueChange={onChange}
              showPlaceholderSelect={field.name === 'subject' || field.name === 'from_name'}
            >
              <Input
                type={field.type}
                placeholder={field.placeholder}
                required={field.required}
              />
            </PlaceholderInput>
          </FormControl>
          {field.description && (
            <FormDescription>{field.description}</FormDescription>
          )}
        </FormItem>
      )
    
    case 'email':
      // Special handling for email fields - use EmailField component
      return (
        <FormItem>
          <FormLabel>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            {field.name === 'to_email' || field.name === 'from_email' ? (
              <EmailField
                value={value ?? field.default ?? ''}
                onChange={onChange}
                placeholder={field.placeholder}
                required={field.required}
              />
            ) : (
              <PlaceholderInput
                value={value ?? field.default ?? ''}
                onValueChange={onChange}
                showPlaceholderSelect={true}
              >
                <Input
                  type={field.type}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              </PlaceholderInput>
            )}
          </FormControl>
          {field.description && (
            <FormDescription>{field.description}</FormDescription>
          )}
        </FormItem>
      )
    
    case 'textarea':
      // Special handling for body field - show preview + edit button
      if (field.name === 'body') {
        return (
          <FormItem>
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 border rounded-lg overflow-hidden">
                  <EmailPreview
                    body={value ?? field.default ?? ''}
                    subject={undefined}
                    fromEmail={undefined}
                    fromName={undefined}
                    sideBySide={true}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenTemplateEditor?.(field.name)}
                  className="shrink-0"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  {__("edit") || "Edit"}
                </Button>
              </div>
              {field.description && (
                <FormDescription>{field.description}</FormDescription>
              )}
            </div>
          </FormItem>
        )
      }
      
      // Regular textarea for other fields
      return (
        <FormItem>
          <FormLabel>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <PlaceholderInput
              value={value ?? field.default ?? ''}
              onValueChange={onChange}
              showPlaceholderSelect={true}
            >
              <Textarea
                placeholder={field.placeholder}
                rows={field.rows || 4}
                required={field.required}
              />
            </PlaceholderInput>
          </FormControl>
          {field.description && (
            <FormDescription>{field.description}</FormDescription>
          )}
        </FormItem>
      )
    
    case 'select':
      return (
        <FormItem>
          <FormLabel>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <Select
            // Option values are strings, but settings come back from PHP as
            // JSON -- mailbox_id is an int. Radix matches the selected item by
            // strict equality, so an unconverted 1 never matched "1" and the
            // trigger rendered blank even though a value was stored.
            value={value != null && value !== '' ? String(value) : (field.default != null ? String(field.default) : '')}
            onValueChange={onChange}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={__('select') + ' ' + field.label} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.description && (
            <FormDescription>{field.description}</FormDescription>
          )}
        </FormItem>
      )
    
    case 'number':
      return (
        <FormItem>
          <FormLabel>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              type="number"
              value={value ?? field.default ?? ''}
              onChange={(e) => onChange(Number(e.target.value))}
              min={field.min}
              max={field.max}
              required={field.required}
            />
          </FormControl>
          {field.description && (
            <FormDescription>{field.description}</FormDescription>
          )}
        </FormItem>
      )
    
    case 'checkbox':
      return (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel>{field.label}</FormLabel>
            {field.description && (
              <FormDescription>{field.description}</FormDescription>
            )}
          </div>
          <FormControl>
            <Switch
              checked={value ?? field.default ?? false}
              onCheckedChange={onChange}
            />
          </FormControl>
        </FormItem>
      )
    
    default:
      return null
  }
}


export default function ProvidersPage() {
  const { providers, loading, error, refetch } = useProviders()
  const { types: providerTypes, loading: typesLoading } = useProviderTypes()
  const { createProvider, loading: creating } = useCreateProvider()
  const { updateProvider, loading: updating } = useUpdateProvider()
  const { deleteProvider, loading: deleting } = useDeleteProvider()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [selectedProviderType, setSelectedProviderType] = useState<string>('')
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false)
  const [editingBodyField, setEditingBodyField] = useState<string | null>(null)

  const form = useForm<ProviderFormValues>({
    resolver: zodResolver(baseProviderFormSchema),
    defaultValues: {
      name: "",
      provider_type: "",
      form_identifier: null,
      is_active: true,
      settings: {},
    },
  })

  const handleOpenTemplateEditor = (fieldName: string) => {
    setEditingBodyField(fieldName)
    setIsTemplateEditorOpen(true)
  }

  const handleTemplateEditorSave = (html: string) => {
    if (editingBodyField) {
      handleSettingChange(editingBodyField, html)
    }
    setIsTemplateEditorOpen(false)
    setEditingBodyField(null)
  }

  // When provider type is selected, initialize settings with default values (only for new providers)
  useEffect(() => {
    // Only set defaults when creating a new provider, not when editing
    if (selectedProviderType && !editingProvider) {
      const selectedType = providerTypes.find(t => t.slug === selectedProviderType)
      if (selectedType) {
        const defaultSettings: Record<string, any> = {}
        selectedType.fields.forEach(field => {
          if (field.default !== undefined) {
            defaultSettings[field.name] = field.default
          }
        })
        setSettings(defaultSettings)
      } else {
        setSettings({})
      }
    } else if (!selectedProviderType) {
      setSettings({})
    }
  }, [selectedProviderType, providerTypes, editingProvider])

  const handleOpenDialog = (provider?: Provider | null, preselectedType?: string) => {
    if (provider) {
      setEditingProvider(provider)
      setSelectedProviderType(provider.provider_type)
      // Merge provider settings with defaults for any missing fields
      const selectedType = providerTypes.find(t => t.slug === provider.provider_type)
      const mergedSettings: Record<string, any> = { ...(provider.settings || {}) }
      if (selectedType) {
        selectedType.fields.forEach(field => {
          if (mergedSettings[field.name] === undefined && field.default !== undefined) {
            mergedSettings[field.name] = field.default
          }
        })
      }
      setSettings(mergedSettings)
      form.reset({
        name: provider.name,
        provider_type: provider.provider_type,
        form_identifier: provider.form_identifier || null,
        is_active: provider.is_active,
        settings: mergedSettings,
      })
    } else {
      setEditingProvider(null)
      const typeToSelect = preselectedType ?? ""
      setSelectedProviderType(typeToSelect)
      if (typeToSelect) {
        const selectedType = providerTypes.find(t => t.slug === typeToSelect)
        const defaultSettings: Record<string, any> = {}
        if (selectedType) {
          selectedType.fields.forEach(field => {
            if (field.default !== undefined) {
              defaultSettings[field.name] = field.default
            }
          })
        }
        setSettings(defaultSettings)
        form.reset({
          name: "",
          provider_type: typeToSelect,
          form_identifier: null,
          is_active: true,
          settings: defaultSettings,
        })
      } else {
        setSettings({})
        form.reset({
          name: "",
          provider_type: "",
          form_identifier: null,
          is_active: true,
          settings: {},
        })
      }
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProvider(null)
    setSelectedProviderType('')
    setSettings({})
    form.reset()
  }


  const handleSettingChange = (fieldName: string, value: any) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [fieldName]: value
      }
      return newSettings
    })
  }

  const onSubmit = async (data: ProviderFormValues) => {
    try {
      if (editingProvider) {
        await updateProvider({
          id: editingProvider.id,
          name: data.name,
          provider_type: data.provider_type,
          form_identifier: data.form_identifier || null,
          is_active: data.is_active,
          settings,
        })
        toast({
          title: __("providerUpdated"),
          description: __("providerUpdatedDesc"),
        })
      } else {
        await createProvider({
          name: data.name,
          provider_type: data.provider_type,
          form_identifier: data.form_identifier || null,
          is_active: data.is_active,
          settings,
        })
        toast({
          title: __("providerCreated"),
          description: __("providerCreatedDesc"),
        })
      }
      refetch()
      handleCloseDialog()
    } catch (err) {
      toast({
        title: __("error"),
        description: err instanceof Error ? err.message : __("errorOccurred"),
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(__("confirmDeleteProvider"))) {
      return
    }

    try {
      await deleteProvider(id)
      toast({
        title: __("providerDeleted"),
        description: __("providerDeletedDesc"),
      })
      refetch()
    } catch (err) {
      toast({
        title: __("error"),
        description: err instanceof Error ? err.message : __("errorOccurred"),
        variant: "destructive",
      })
    }
  }

  const selectedType = providerTypes.find(t => t.slug === selectedProviderType)

  if (loading || typesLoading) {
    return <div>{__('loadingProviders')}</div>
  }

  if (error) {
    return <div className="text-destructive">{__('errorProviders')} {error.message}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{__('providers')}</h3>
          <p className="text-sm text-muted-foreground">
            {__('manageProvidersDescription')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            handleCloseDialog()
          }
        }}>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            {__('addProvider')}
          </Button>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProvider ? __("editProvider") : __("createProvider")}
              </DialogTitle>
              <DialogDescription>
                {editingProvider
                  ? __("updateProviderDetails")
                  : __("configureNewProvider")}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{__('name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={__("myEmailProvider")} {...field} />
                      </FormControl>
                      <FormDescription>
                        {__('providerNameDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="provider_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{__('providerType')}</FormLabel>
                      <Select 
                        value={field.value || undefined}
                        onValueChange={(value) => {
                          field.onChange(value)
                          setSelectedProviderType(value)
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={__("selectProviderType")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {providerTypes.map((type) => (
                            <SelectItem key={type.slug} value={type.slug}>
                              {type.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {__('selectProviderTypeDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Dynamic fields based on selected provider type */}
                {selectedType && selectedType.fields.map((field) => (
                  <React.Fragment key={field.name}>
                    <DynamicField
                      field={field}
                      value={settings[field.name]}
                      onChange={(value) => handleSettingChange(field.name, value)}
                      formFieldName={`settings.${field.name}`}
                      settings={settings}
                      onSettingsChange={handleSettingChange}
                      onOpenTemplateEditor={handleOpenTemplateEditor}
                    />
                  </React.Fragment>
                ))}
                
                <FormField
                  control={form.control}
                  name="form_identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{__('formIdentifierOptional')}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          value={field.value || ''}
                          placeholder={__("leaveEmptyForGlobalProvider")}
                        />
                      </FormControl>
                      <FormDescription>
                        {__('formIdentifierDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">{__('active')}</FormLabel>
                        <FormDescription>
                          {__('enableOrDisableProvider')}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                  >
                    {__('cancel')}
                  </Button>
                  <Button type="submit" disabled={creating || updating}>
                    {editingProvider ? __("update") : __("create")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        <FullscreenTemplateEditor
          open={isTemplateEditorOpen}
          onOpenChange={setIsTemplateEditorOpen}
          initialHtml={editingBodyField ? (settings[editingBodyField] || '') : ''}
          onSave={handleTemplateEditorSave}
        />
      </div>
      <div className="space-y-4">
        <h4 className="text-sm font-medium">{__("addProviderFromType")}</h4>
        <ProviderTypeGrid
          providerTypes={providerTypes.map((t) => ({
            slug: t.slug,
            title: t.title,
            icon: t.icon ?? null,
          }))}
          comingSoon={[]}
          onSelectType={(slug) => handleOpenDialog(null, slug)}
        />
      </div>
      <Separator />
      {providers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {__('noProvidersFound')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {provider.name}
                      {provider.is_active && (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                          {__('active')}
                        </span>
                      )}
                      {!provider.is_active && (
                        <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded">
                          {__('inactive')}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {__('type')} {provider.provider_type}
                      {provider.form_identifier && ` • ${__('form')} ${provider.form_identifier}`}
                      {!provider.form_identifier && ` • ${__('globalProvider')}`}
                      {' • ' + __('created') + ' '}
                      {new Date(provider.date_created).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleOpenDialog(provider)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(provider.id)}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
