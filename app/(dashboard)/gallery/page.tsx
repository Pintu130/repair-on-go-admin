"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Image as ImageIcon, Film, Edit2, Plus, X, Trash2 } from "lucide-react"
import { SearchInput } from "@/components/common/search-input"
import { SelectFilter } from "@/components/common/select-filter"
import { useToast } from "@/hooks/use-toast"
import { GalleryModal } from "@/components/common/gallery-modal"
import { ConfirmationModal } from "@/components/common/confirmation-modal"
import { Pagination } from "@/components/common/pagination"
import { useGetGalleryQuery, useCreateGalleryItemMutation, useUpdateGalleryItemMutation, useDeleteGalleryItemMutation } from "@/lib/store/api/galleryApi"
import { isFirebaseStorageUrl } from "@/lib/utils/storage"
import { StatusBadge } from "@/components/common/status-badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GalleryTableSkeleton } from "@/components/common/gallery-table-skeleton"

type GalleryItem = {
  id: string
  type: "image" | "video"
  sourceType: "file" | "url"
  url: string
  title: string
  description: string
  status: "active" | "inactive"
}

export default function GalleryPage() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useGetGalleryQuery()
  const [createItem, { isLoading: isCreating }] = useCreateGalleryItemMutation()
  const [updateItem, { isLoading: isUpdating }] = useUpdateGalleryItemMutation()
  const [deleteItem, { isLoading: isDeleting }] = useDeleteGalleryItemMutation()

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isSaving, setIsSaving] = useState(false)
  const [viewingDesc, setViewingDesc] = useState<{ title: string; description: string } | null>(null)

  const items = data?.items || []
  const filtered = useMemo(() => {
    return items
      .filter((it) => (statusFilter === "all" ? true : it.status === statusFilter))
      .filter((it) => it.title.toLowerCase().includes(search.toLowerCase()))
  }, [items, statusFilter, search])

  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const hasActiveFilters = search !== "" || statusFilter !== "all"
  const handleClearFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  const handleAddSave = async (data: {
    type: "image" | "video"
    sourceType: "file" | "url"
    mediaData: string
    url: string
    title: string
    description: string
    status: "active" | "inactive"
  }) => {
    setIsSaving(true)
    const payload: any = {
      type: data.type,
      sourceType: data.sourceType,
      title: data.title,
      description: data.description,
      status: data.status,
    }
    if (data.sourceType === "file") {
      payload.mediaData = data.mediaData
    } else {
      payload.url = data.url
    }
    const resp = await createItem(payload).unwrap().catch((e: any) => null)
    setIsSaving(false)
    if (resp && resp.success) {
      setAddOpen(false)
      toast({ title: "Gallery Item Added", description: "Item successfully added to gallery." })
      refetch()
    } else {
      toast({ title: "Error", description: "Failed to add item", variant: "destructive" as any })
    }
  }

  const handleEditSave = async (data: {
    type: "image" | "video"
    sourceType: "file" | "url"
    mediaData: string
    url: string
    title: string
    description: string
    status: "active" | "inactive"
  }) => {
    if (!editing) return
    setIsSaving(true)
    const payload: any = {
      type: data.type,
      sourceType: data.sourceType,
      title: data.title,
      description: data.description,
      status: data.status,
    }
    if (data.sourceType === "file") {
      payload.mediaData = data.mediaData
    } else {
      payload.url = data.url
    }
    const resp = await updateItem({ id: editing.id, data: payload }).unwrap().catch((e: any) => null)
    setIsSaving(false)
    if (resp && resp.success) {
      setEditOpen(false)
      setEditing(null)
      toast({ title: "Gallery Item Updated", description: "Item updated successfully." })
      refetch()
    } else {
      toast({ title: "Error", description: "Failed to update item", variant: "destructive" as any })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingId) return
    setIsSaving(true)
    const resp = await deleteItem(deletingId).unwrap().catch((e: any) => null)
    setIsSaving(false)
    if (resp && resp.success) {
      setDeleteOpen(false)
      setDeletingId(null)
      toast({ title: "Deleted", description: "Gallery item removed." })
      refetch()
    } else {
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" as any })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gallery</h1>
        <p className="text-muted-foreground">Images and videos to showcase on your site</p>
      </div>

      <div className="flex items-center justify-between">
        <div />
        <Button onClick={() => setAddOpen(true)} className="cursor-pointer">
          <Plus size={16} className="mr-2" /> Add Media
        </Button>
      </div>

      <Card>
        <CardContent className="px-5">
          <div className="flex items-end justify-between gap-3">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value)
                setCurrentPage(1)
              }}
              placeholder="Search by title..."
            />

            <div className="flex items-end gap-2">
              <SelectFilter
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value as "all" | "active" | "inactive")
                  setCurrentPage(1)
                }}
                options={[
                  { value: "all", label: "All Status" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                label="Status"
                placeholder="All Status"
              />
              <SelectFilter
                value={pageSize.toString()}
                onChange={(value) => {
                  setPageSize(Number(value))
                  setCurrentPage(1)
                }}
                options={[
                  { value: "5", label: "5" },
                  { value: "10", label: "10" },
                  { value: "20", label: "20" },
                  { value: "50", label: "50" },
                ]}
                label="Page Size"
                width="w-[140px]"
              />

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="gap-2 cursor-pointer"
                >
                  <X size={16} />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gallery Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <GalleryTableSkeleton />
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>
                    {isFirebaseStorageUrl((it.url || "").replace(/[`\s]/g, "")) ? (
                      it.type === "image" ? (
                        <img src={(it.url || "").replace(/[`\s]/g, "")} alt={it.title} className="w-24 h-16 object-contain rounded border" />
                      ) : (
                        <video src={(it.url || "").replace(/[`\s]/g, "")} className="w-24 h-16 object-cover rounded border" />
                      )
                    ) : (
                      <div className="w-24 h-16 rounded bg-muted flex items-center justify-center border">
                        {it.type === "image" ? <ImageIcon size={16} className="text-muted-foreground" /> : <Film size={16} className="text-muted-foreground" />}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="align-middle">
                    <div className="flex items-center gap-2">
                      {it.type === "image" ? <ImageIcon size={16} /> : <Film size={16} />}
                      {it.type}
                    </div>
                  </TableCell>
                  <TableCell>{it.title}</TableCell>
                  <TableCell className="align-middle">
                    <div className="flex items-center justify-center">
                      <StatusBadge status={it.status} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingDesc({ title: it.title, description: it.description })}
                        className="cursor-pointer shrink-0 h-7 px-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground"
                      >
                        Show
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="cursor-pointer"
                        onClick={() => {
                          setEditing(it)
                          setEditOpen(true)
                        }}
                        title="Edit"
                        aria-label="Edit"
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="cursor-pointer"
                        onClick={() => {
                          setDeletingId(it.id)
                          setDeleteOpen(true)
                        }}
                        title="Delete"
                        aria-label="Delete"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      <GalleryModal
        open={addOpen}
        mode="add"
        onClose={() => setAddOpen(false)}
        onSave={handleAddSave}
        isSaving={isSaving}
      />
      <GalleryModal
        open={editOpen}
        mode="edit"
        initial={
          editing
            ? {
                type: editing.type,
                sourceType: editing.sourceType,
                url: editing.url,
                title: editing.title,
                description: editing.description,
                status: editing.status,
              }
            : undefined
        }
        onClose={() => {
          setEditOpen(false)
          setEditing(null)
        }}
        onSave={handleEditSave}
        isSaving={isSaving}
      />
      <ConfirmationModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Media?"
        description="This will permanently remove the selected media item."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isSaving}
      />
      <Dialog open={!!viewingDesc} onOpenChange={(open) => !open && setViewingDesc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gallery Description - {viewingDesc?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {viewingDesc?.description}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
