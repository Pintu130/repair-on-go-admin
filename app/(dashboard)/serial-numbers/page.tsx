"use client"

import { useEffect, useMemo, useState } from "react"
import { Ban, Download, Hash, Loader2, Plus, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { endOfDay, startOfDay } from "date-fns"
import { SearchInput } from "@/components/common/search-input"
import { SelectFilter } from "@/components/common/select-filter"
import { DateRangeFilter } from "@/components/common/date-range-filter"
import { Pagination } from "@/components/common/pagination"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmationModal } from "@/components/common/confirmation-modal"
import { GenerateSerialsModal } from "@/components/common/generate-serials-modal"
import { SerialNumbersTableSkeleton } from "@/components/common/serial-numbers-table-skeleton"
import {
  useGetSerialsQuery,
  useGenerateSerialsMutation,
  useVoidSerialMutation,
} from "@/lib/store/api/serialNumbersApi"
import {
  SERIAL_STATUS_OPTIONS,
  formatSerialStatus,
  type SerialStatus,
} from "@/data/serial-numbers"
import { buildSerialStickerPdf, downloadBlob } from "@/lib/utils/serial-sticker"
import { useFirebaseAuthReady } from "@/lib/utils/firebase-auth"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const STATUS_BADGE_CLASS: Record<SerialStatus, string> = {
  available: "bg-green-600 text-white border-0",
  linked: "bg-blue-600 text-white border-0",
  void: "bg-muted text-muted-foreground border-0",
}

/** Radix Select reserves "" for clearing the selection, so "no filter" needs a real value. */
const BATCH_FILTER_ALL = "all"

function SerialStatusBadge({ status }: { status: SerialStatus }) {
  return (
    <Badge className={cn("text-[10px] sm:text-xs", STATUS_BADGE_CLASS[status])}>
      {formatSerialStatus(status)}
    </Badge>
  )
}

function formatTimestamp(value: any): string {
  if (!value) return "—"
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function SerialNumbersPage() {
  const { toast } = useToast()

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<SerialStatus | "all">("all")
  const [batchFilter, setBatchFilter] = useState(BATCH_FILTER_ALL)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [voidingSerial, setVoidingSerial] = useState<string | null>(null)
  const [generatedBatch, setGeneratedBatch] = useState<{
    batchId: string
    fromSerial: string
    toSerial: string
    serials: string[]
  } | null>(null)
  const [pdfProgress, setPdfProgress] = useState<{ done: number; total: number } | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const authReady = useFirebaseAuthReady()

  const { data, isLoading, isError, isFetching, refetch } = useGetSerialsQuery(
    {
      status: statusFilter,
      search: debouncedSearch,
      batchId: batchFilter === BATCH_FILTER_ALL ? "" : batchFilter,
    },
    { skip: !authReady }
  )
  const [generateSerials, { isLoading: isGenerating }] = useGenerateSerialsMutation()
  const [voidSerial, { isLoading: isVoiding }] = useVoidSerialMutation()

  const serials = useMemo(() => {
    const list = data?.serials ?? []
    if (!dateRange?.from) return list
    const from = startOfDay(new Date(dateRange.from))
    const to = endOfDay(dateRange.to ?? dateRange.from)
    return list.filter((serial) => {
      if (!serial.createdAt) return false
      const created = new Date(serial.createdAt)
      if (Number.isNaN(created.getTime())) return false
      return created >= from && created <= to
    })
  }, [data, dateRange])
  const batches = useMemo(() => data?.batches ?? [], [data])
  const year = data?.year ?? new Date().getFullYear()
  const nextSequence = data?.nextSequence ?? 0

  const totalPages = Math.ceil(serials.length / pageSize) || 1
  const paginated = serials.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "all" ||
    batchFilter !== BATCH_FILTER_ALL ||
    dateRange?.from !== undefined
  const handleClearFilters = () => {
    setSearch("")
    setDebouncedSearch("")
    setStatusFilter("all")
    setBatchFilter(BATCH_FILTER_ALL)
    setDateRange(undefined)
    setCurrentPage(1)
  }

  const batchOptions = useMemo(
    () => [
      { value: BATCH_FILTER_ALL, label: "All Batches" },
      ...batches.map((batch) => ({
        value: batch.id,
        label: `${batch.fromSerial} – ${batch.toSerial} (${batch.count})`,
      })),
    ],
    [batches]
  )

  const handleDownload = async (targets: string[], fileName: string) => {
    if (targets.length === 0) {
      toast({
        title: "Nothing to download",
        description: "There are no serials in the current selection.",
        variant: "destructive",
      })
      return
    }

    try {
      setPdfProgress({ done: 0, total: targets.length })
      const blob = await buildSerialStickerPdf(targets, {
        onProgress: (done, total) => setPdfProgress({ done, total }),
        batchLabel: fileName,
      })
      downloadBlob(blob, `${fileName}.pdf`)
      toast({
        title: "Sticker sheet ready",
        description: `${targets.length} sticker${targets.length === 1 ? "" : "s"} exported to PDF.`,
      })
    } catch (error: any) {
      console.error("Error building sticker PDF:", error)
      toast({
        title: "Failed to build PDF",
        description: error?.message || "Could not generate the sticker sheet.",
        variant: "destructive",
      })
    } finally {
      setPdfProgress(null)
    }
  }

  const handleDownloadVisible = () => {
    const name = batchFilter !== BATCH_FILTER_ALL
      ? batches.find((b) => b.id === batchFilter)?.fromSerial || "batch"
      : debouncedSearch
        ? "search"
        : `serial-numbers-${year}`
    handleDownload(
      serials.map((s) => s.serial),
      name
    )
  }

  const handleGenerate = async (count: number, note: string) => {
    try {
      const result = await generateSerials({ count, note }).unwrap()
      setIsGenerateOpen(false)
      setGeneratedBatch(result)
      refetch()
      toast({
        title: "Serials generated",
        description: `${result.serials.length} serials created from ${result.fromSerial} to ${result.toSerial}.`,
      })
    } catch (error: any) {
      console.error("Error generating serials:", error)
      toast({
        title: "Failed to generate serials",
        description: error?.data?.error || error?.message || "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleVoidConfirm = async () => {
    if (!voidingSerial) return
    try {
      await voidSerial({ serial: voidingSerial }).unwrap()
      toast({
        title: "Serial voided",
        description: `${voidingSerial} can no longer be used.`,
      })
      setVoidingSerial(null)
      refetch()
    } catch (error: any) {
      console.error("Error voiding serial:", error)
      toast({
        title: "Failed to void serial",
        description: error?.data?.error || error?.message || "Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {isLoading || !authReady ? (
        <SerialNumbersTableSkeleton />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-balance">Serial Numbers</h1>
              <p className="text-muted-foreground">
                Generate unique device serials and print barcode sticker sheets
              </p>
            </div>
            <Button onClick={() => setIsGenerateOpen(true)} className="shrink-0 cursor-pointer">
              <Plus size={16} className="mr-2" /> Generate Serials
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Hash size={14} /> Next serial this year:{" "}
              <span className="font-mono text-foreground">
                {`ROG-${year}-${String(nextSequence + 1).padStart(6, "0")}`}
              </span>
            </span>
            {data?.truncated && (
              <span>Showing the most recent serials only — search by serial to look further back.</span>
            )}
            {isFetching && <span className="inline-flex items-center gap-1.5"><Loader2 size={14} className="animate-spin" /> Updating…</span>}
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
                  placeholder="Search by serial, e.g. ROG-2026-000123"
                  hideLabel
                />

                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-none">
                  <SelectFilter
                    value={statusFilter}
                    onChange={(value) => {
                      setStatusFilter(value as SerialStatus | "all")
                      setCurrentPage(1)
                    }}
                    options={SERIAL_STATUS_OPTIONS}
                    label="Status"
                    placeholder="All Status"
                    width="w-full min-w-[110px] flex-1 sm:w-[110px] sm:flex-none"
                    hideLabel
                  />
                  <SelectFilter
                    value={batchFilter}
                    onChange={(value) => {
                      setBatchFilter(value)
                      setCurrentPage(1)
                    }}
                    options={batchOptions}
                    label="Batch"
                    placeholder="All Batches"
                    width="w-full min-w-[180px] flex-1 sm:w-[220px] sm:flex-none"
                    hideLabel
                  />
                  <DateRangeFilter
                    value={dateRange}
                    onChange={(range) => {
                      setDateRange(range)
                      setCurrentPage(1)
                    }}
                    onClear={() => {
                      setDateRange(undefined)
                      setCurrentPage(1)
                    }}
                    placeholder="Filter by date"
                    className="w-full sm:w-[200px]"
                  />
                  <SelectFilter
                    value={pageSize.toString()}
                    onChange={(value) => {
                      setPageSize(Number(value))
                      setCurrentPage(1)
                    }}
                    options={[
                      { value: "10", label: "10" },
                      { value: "20", label: "20" },
                      { value: "50", label: "50" },
                      { value: "100", label: "100" },
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

                  <Button
                    variant="outline"
                    onClick={handleDownloadVisible}
                    disabled={serials.length === 0 || !!pdfProgress}
                    className="gap-2 cursor-pointer"
                  >
                    {pdfProgress ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    {pdfProgress ? `${pdfProgress.done}/${pdfProgress.total}` : "Sticker PDF"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4">
              {isError ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  Error loading serials. Please try again.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Linked Order</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0">
                          <EmptyState
                            icon={<Hash className="size-7" />}
                            message={
                              batches.length === 0
                                ? 'No serials yet. Click "Generate Serials" to create your first batch.'
                                : "No serials match the current filters."
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((serial) => (
                        <TableRow key={serial.id}>
                          <TableCell className="font-mono text-sm">{serial.serial}</TableCell>
                          <TableCell>
                            <SerialStatusBadge status={serial.status} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {serial.batchId ? serial.batchId.slice(0, 8) : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatTimestamp(serial.createdAt)}
                          </TableCell>
                          <TableCell>
                            {serial.linkedOrderId ? (
                              <div className="text-sm">
                                {serial.linkedOrderLabel || serial.linkedOrderId}
                                {serial.linkedAt && (
                                  <div className="text-xs text-muted-foreground">
                                    {formatTimestamp(serial.linkedAt)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon-sm"
                                className="cursor-pointer"
                                onClick={() => handleDownload([serial.serial], serial.serial)}
                                title="Download sticker"
                                aria-label="Download sticker"
                                disabled={serial.status === "void" || !!pdfProgress}
                              >
                                <Download size={16} />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon-sm"
                                className="cursor-pointer"
                                onClick={() => setVoidingSerial(serial.serial)}
                                title={serial.status === "available" ? "Void serial" : "Only available serials can be voided"}
                                aria-label="Void serial"
                                disabled={serial.status !== "available" || !!pdfProgress}
                              >
                                <Ban size={16} />
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
                totalItems={serials.length}
                onPageChange={setCurrentPage}
              />
            </CardContent>
          </Card>
        </>
      )}

      <GenerateSerialsModal
        open={isGenerateOpen}
        onOpenChange={setIsGenerateOpen}
        year={year}
        nextSequence={nextSequence}
        isLoading={isGenerating}
        onGenerate={handleGenerate}
      />

      <ConfirmationModal
        open={!!voidingSerial}
        onOpenChange={(open) => {
          if (!open) setVoidingSerial(null)
        }}
        onConfirm={handleVoidConfirm}
        title="Void this serial?"
        description={`${voidingSerial ?? ""} will be permanently marked as void. It can never be used or reissued, even if the printed sticker is damaged.`}
        confirmText="Void serial"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isVoiding}
      />

      <Dialog
        open={!!generatedBatch}
        onOpenChange={(open) => {
          if (!open) setGeneratedBatch(null)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Serials generated</DialogTitle>
            <DialogDescription>
              {generatedBatch?.serials.length} unique serials were created and are ready to print.
            </DialogDescription>
          </DialogHeader>

          {generatedBatch && (
            <div className="rounded-md border border-border bg-muted/50 px-3 py-2.5 font-mono text-sm">
              {generatedBatch.fromSerial} <span className="text-muted-foreground">to</span>{" "}
              {generatedBatch.toSerial}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGeneratedBatch(null)}
              disabled={!!pdfProgress}
              className="cursor-pointer"
            >
              Close
            </Button>
            <Button
              onClick={() =>
                generatedBatch &&
                handleDownload(generatedBatch.serials, `serials-${generatedBatch.fromSerial}`)
              }
              disabled={!!pdfProgress}
              className="cursor-pointer"
            >
              {pdfProgress ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" /> {pdfProgress.done}/{pdfProgress.total}
                </>
              ) : (
                <>
                  <Download size={16} className="mr-2" /> Download Sticker Sheet
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
