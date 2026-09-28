"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit2, Trash2, Plus, Package, X } from "lucide-react"
import { StatusBadge } from "@/components/common/status-badge"
import { CategoryModal } from "@/components/common/category-modal"
import { ConfirmationModal } from "@/components/common/confirmation-modal"
import { SearchInput } from "@/components/common/search-input"
import { SelectFilter } from "@/components/common/select-filter"
import { Pagination } from "@/components/common/pagination"
import { EmptyState } from "@/components/common/empty-state"
import { CategoriesTableSkeleton } from "@/components/common/categories-table-skeleton"
import { useGetCategoriesQuery, useCreateCategoryMutation, useUpdateCategoryMutation, useDeleteCategoryMutation, type Category } from "@/lib/store/api/categoriesApi"
import { useToast } from "@/hooks/use-toast"

export default function CategoriesPage() {
  // Fetch categories from Firebase
  const { data, isLoading, isError, error, refetch } = useGetCategoriesQuery()
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation()
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation()
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation()
  const { toast } = useToast()

  // Extract categories from API response or use empty array
  const categories = data?.categories || []

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    seoImage: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    status: "active" as "active" | "inactive",
    sortOrder: 1,
    referenceFront: "",
    referenceProblem: "",
    referenceModel: "",
    guidelines: [] as string[],
  })
  // Store base64 image data separately for API
  const [iconData, setIconData] = useState<string>("")
  const [seoImageData, setSeoImageData] = useState<string>("")

  // Table-only view state
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [viewingDesc, setViewingDesc] = useState<{ title: string; description: string } | null>(null)

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return categories
      .filter((c) => (statusFilter === "all" ? true : c.status === statusFilter))
      .filter((c) => c.name.toLowerCase().includes(term) || (c.slug || "").toLowerCase().includes(term))
  }, [categories, statusFilter, search])

  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const hasActiveFilters = search !== "" || statusFilter !== "all"
  const handleClearFilters = () => {
    setSearch("")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  const handleAddCategory = async (sortOrder: number) => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      const guidelinesClean = formData.guidelines.map((g) => g.trim()).filter(Boolean)
      await createCategory({
        ...formData,
        sortOrder: Math.max(1, sortOrder),
        iconData: iconData || formData.icon,
        seoImageData: seoImageData || formData.seoImage,
        referenceFrontData: formData.referenceFront.startsWith("data:image/")
          ? formData.referenceFront
          : undefined,
        referenceProblemData: formData.referenceProblem.startsWith("data:image/")
          ? formData.referenceProblem
          : undefined,
        referenceModelData: formData.referenceModel.startsWith("data:image/")
          ? formData.referenceModel
          : undefined,
        guidelines: guidelinesClean,
      }).unwrap()

      toast({
        title: "Category Created Successfully! 🎉",
        description: "Category has been added successfully.",
      })

      handleCancel()
      refetch()
    } catch (error: any) {
      console.error("❌ Error creating category:", error)

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to create category. Please try again."

      toast({
        title: "Failed to Create Category",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({
      name: "",
      slug: "",
      description: "",
      icon: "",
      seoImage: "",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      status: "active",
      sortOrder: 1,
      referenceFront: "",
      referenceProblem: "",
      referenceModel: "",
      guidelines: [],
    })
    setIconData("")
    setSeoImageData("")
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingId) return

    try {
      await deleteCategory(deletingId).unwrap()

      toast({
        title: "Category Deleted Successfully! ✅",
        description: "Category and its images have been deleted successfully.",
      })

      setDeletingId(null)
      refetch()
    } catch (error: any) {
      console.error("❌ Error deleting category:", error)

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to delete category. Please try again."

      toast({
        title: "Failed to Delete Category",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      slug: category.slug || "",
      description: category.description,
      icon: category.icon,
      seoImage: category.seoImage,
      seoTitle: category.seoTitle,
      seoDescription: category.seoDescription,
      seoKeywords: category.seoKeywords,
      status: category.status === "inactive" ? "inactive" : "active",
      sortOrder:
        typeof category.sortOrder === "number" && !Number.isNaN(category.sortOrder)
          ? Math.max(1, category.sortOrder)
          : 1,
      referenceFront: category.referenceImages?.frontView || "",
      referenceProblem: category.referenceImages?.problemArea || "",
      referenceModel: category.referenceImages?.modelBrand || "",
      guidelines: category.guidelines?.length ? [...category.guidelines] : [],
    })
    setIconData("")
    setSeoImageData("")
  }

  const handleSaveEdit = async (sortOrder: number) => {
    if (!editingId || !formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      const guidelinesClean = formData.guidelines.map((g) => g.trim()).filter(Boolean)
      const updateData: any = {
        ...formData,
        sortOrder: Math.max(1, sortOrder),
        guidelines: guidelinesClean,
      }

      // Only pass iconData if it's a new base64 image
      if (iconData && iconData.startsWith("data:image/")) {
        updateData.iconData = iconData
      }

      // Only pass seoImageData if it's a new base64 image
      if (seoImageData && seoImageData.startsWith("data:image/")) {
        updateData.seoImageData = seoImageData
      }

      if (formData.referenceFront.startsWith("data:image/")) {
        updateData.referenceFrontData = formData.referenceFront
      }
      if (formData.referenceProblem.startsWith("data:image/")) {
        updateData.referenceProblemData = formData.referenceProblem
      }
      if (formData.referenceModel.startsWith("data:image/")) {
        updateData.referenceModelData = formData.referenceModel
      }

      await updateCategory({
        categoryId: editingId,
        categoryData: updateData,
      }).unwrap()

      toast({
        title: "Category Updated Successfully! ✅",
        description: "Category has been updated successfully.",
      })

      handleCancel()
      refetch()
    } catch (error: any) {
      console.error("❌ Error updating category:", error)

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to update category. Please try again."

      toast({
        title: "Failed to Update Category",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleOpenAdd = () => {
    const cats = data?.categories || []
    const maxSo = cats.length > 0 ? Math.max(...cats.map((c) => c.sortOrder ?? 0)) : 0
    setFormData({
      name: "",
      description: "",
      icon: "",
      seoImage: "",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      status: "active",
      sortOrder: maxSo + 1,
      referenceFront: "",
      referenceProblem: "",
      referenceModel: "",
      guidelines: [],
    })
    setIconData("")
    setSeoImageData("")
    setIsAdding(true)
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <CategoriesTableSkeleton />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-balance">Categories</h1>
              <p className="text-muted-foreground">Manage service categories</p>
            </div>
            <Button onClick={handleOpenAdd} className="shrink-0 cursor-pointer">
              <Plus size={16} className="mr-2" /> Add Category
            </Button>
          </div>

          <Card>
            <CardContent className="px-5">
              <div className="flex flex-wrap items-center gap-2">
                <SearchInput
                  value={search}
                  onChange={(value) => {
                    setSearch(value)
                    setCurrentPage(1)
                  }}
                  placeholder="Search by name or slug..."
                  hideLabel
                />

                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-none">
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
                    width="w-full min-w-[110px] flex-1 sm:w-[110px] sm:flex-none"
                    hideLabel
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
                    width="w-full min-w-[90px] flex-1 sm:w-[90px] sm:flex-none"
                    hideLabel
                  />

                  {hasActiveFilters && (
                    <Button variant="outline" onClick={handleClearFilters} className="gap-2 cursor-pointer">
                      <X size={16} />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              {isError ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  Error loading categories. Please try again.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0">
                          <EmptyState
                            icon={<Package className="size-7" />}
                            message={
                              categories.length === 0
                                ? 'No categories found. Click "Add Category" to create your first category.'
                                : "No categories match the current filters."
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell>
                            {category.icon ? (
                              <div className="h-14 w-14 overflow-hidden rounded-lg border border-border bg-muted shadow-sm">
                                <img
                                  src={category.icon}
                                  alt={category.name}
                                  className="h-full w-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-muted">
                                <Package size={22} className="text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{category.name}</div>
                            {category.slug ? (
                              <div className="text-xs text-muted-foreground">/{category.slug}</div>
                            ) : null}
                          </TableCell>
                          <TableCell className="align-middle">
                            <div className="flex items-center justify-center">
                              <StatusBadge
                                status={category.status === "inactive" ? "inactive" : "active"}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="align-middle">
                            <Badge variant="outline" className="text-xs font-normal">
                              {category.sortOrder ?? "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setViewingDesc({ title: category.name, description: category.description })
                              }
                              className="h-7 shrink-0 cursor-pointer border-primary bg-transparent px-2 text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                              Show
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon-sm"
                                className="cursor-pointer"
                                onClick={() => handleEdit(category)}
                                title="Edit"
                                aria-label="Edit"
                              >
                                <Edit2 size={16} />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon-sm"
                                className="cursor-pointer"
                                onClick={() => handleDeleteClick(category.id)}
                                title="Delete"
                                aria-label="Delete"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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
        </>
      )}

      <CategoryModal
        open={isAdding || !!editingId}
        onOpenChange={(open) => {
          if (!open) {
            handleCancel()
          }
        }}
        formData={formData}
        onFormDataChange={(data) => {
          setFormData(data)
          // Extract base64 data if it's a new image
          if (data.icon && data.icon.startsWith("data:image/")) {
            setIconData(data.icon)
          }
          if (data.seoImage && data.seoImage.startsWith("data:image/")) {
            setSeoImageData(data.seoImage)
          }
        }}
        onSave={(sortOrder) => (editingId ? handleSaveEdit(sortOrder) : handleAddCategory(sortOrder))}
        onCancel={handleCancel}
        isEditing={!!editingId}
        isLoading={isCreating || isUpdating}
      />

      <ConfirmationModal
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingId(null)
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Category?"
        description="Are you sure you want to delete this category? This action cannot be undone. All associated images will also be deleted."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />

      <Dialog open={!!viewingDesc} onOpenChange={(open) => !open && setViewingDesc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Category Description - {viewingDesc?.title}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {viewingDesc?.description}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
