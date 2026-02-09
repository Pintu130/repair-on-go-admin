'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InputField } from '@/components/common/input-field'
import { TextareaField } from '@/components/common/textarea-field'
import { MediaUploadField } from '@/components/common/media-upload-field'
import { Link2, Type as TypeIcon, FileText, Copy, Loader2 } from 'lucide-react'

type FormData = {
  type: 'image' | 'video'
  sourceType: 'file' | 'url'
  mediaData: string
  url: string
  title: string
  description: string
  status: 'active' | 'inactive'
}

interface GalleryModalProps {
  open: boolean
  mode: 'add' | 'edit'
  initial?: {
    type: 'image' | 'video'
    sourceType: 'file' | 'url'
    url: string
    title: string
    description: string
    status: 'active' | 'inactive'
  }
  onClose: () => void
  onSave: (data: FormData) => void
  isSaving?: boolean
}

export function GalleryModal({ open, mode, initial, onClose, onSave, isSaving = false }: GalleryModalProps) {
  const [form, setForm] = useState<FormData>({
    type: 'image',
    sourceType: 'file',
    mediaData: '',
    url: '',
    title: '',
    description: '',
    status: 'active',
  })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        type: initial.type,
        sourceType: initial.sourceType,
        mediaData: initial.sourceType === 'file' ? initial.url : '',
        url: initial.sourceType === 'url' ? initial.url : '',
        title: initial.title,
        description: initial.description,
        status: initial.status,
      })
    } else {
      setForm({
        type: 'image',
        sourceType: 'file',
        mediaData: '',
        url: '',
        title: '',
        description: '',
        status: 'active',
      })
    }
  }, [open, initial])

  const canSave =
    form.title &&
    (form.sourceType === 'file' ? !!form.mediaData : !!form.url)

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Media' : 'Edit Media'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="w-full">
              <Select
                value={form.type}
                onValueChange={(v: 'image' | 'video') =>
                  setForm((p) => ({ ...p, type: v, mediaData: '', url: '' }))
                }
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="min-w-[240px]">
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full">
              <Select
                value={form.sourceType}
                onValueChange={(v: 'file' | 'url') =>
                  setForm((p) => ({ ...p, sourceType: v, mediaData: '', url: '' }))
                }
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent className="min-w-[240px]">
                  <SelectItem value="file">Upload File</SelectItem>
                  <SelectItem value="url">Media URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full">
              <Select
                value={form.status}
                onValueChange={(v: 'active' | 'inactive') =>
                  setForm((p) => ({ ...p, status: v }))
                }
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="min-w-[240px]">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <InputField
              label="Title"
              name="title"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Enter title"
              icon={TypeIcon}
            />
          </div>

          <TextareaField
            label="Description"
            name="description"
            value={form.description}
            onChange={(e: any) => setForm((p) => ({ ...p, description: e.target.value }))}
            icon={FileText}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {form.sourceType === 'file' ? (
              <MediaUploadField
                label={form.type === 'image' ? 'Image Upload' : 'Video Upload'}
                type={form.type}
                value={form.mediaData}
                onSelect={(data) => setForm((p) => ({ ...p, mediaData: data }))}
              />
            ) : (
              <>
                <InputField
                  label="Media URL"
                  name="url"
                  value={form.url}
                  onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                  placeholder={form.type === 'image' ? 'https://example.com/image.jpg' : 'https://example.com/video.mp4'}
                  icon={Link2}
                />
                {mode === 'edit' && form.url ? (
                  <div className="flex items-end gap-2">
                    <Button
                      variant="outline"
                      size="lg"
                      className="cursor-pointer"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(form.url)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        } catch {}
                      }}
                      title="Copy URL"
                      aria-label="Copy URL"
                    >
                      <Copy size={14} className="" /> 
                    </Button>
                    {copied && <span className="text-green-600 text-sm">Copied!</span>}
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="cursor-pointer bg-muted text-muted-foreground hover:bg-muted/80 hover:text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={() => onSave(form)}
              disabled={!canSave || isSaving}
              className="cursor-pointer"
            >
              {isSaving ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
