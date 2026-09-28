"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Ban,
  Clock3,
  FolderTree,
  IndianRupee,
  MessagesSquare,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  UserCog,
  UserPlus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/common/page-header"
import { FilterSelect } from "@/components/common/filter-select"
import { DateRangeFilter } from "@/components/common/date-range-filter"
import { StatCard } from "@/components/stat-card"
import { RevenueTrendCard } from "@/components/dashboard/revenue-trend-card"
import { OrdersByStatusCard } from "@/components/dashboard/orders-by-status-card"
import { TopCategoriesCard } from "@/components/dashboard/top-categories-card"
import { RecentEnquiriesCard } from "@/components/dashboard/recent-enquiries-card"
import { RecentOrdersCard } from "@/components/dashboard/recent-orders-card"

import { useGetBookingsQuery } from "@/lib/store/api/bookingsApi"
import { useGetCustomersQuery } from "@/lib/store/api/customersApi"
import { useGetEmployeesQuery } from "@/lib/store/api/employeesApi"
import { useGetContactsQuery } from "@/lib/store/api/contactsApi"
import { useGetCategoriesQuery } from "@/lib/store/api/categoriesApi"

import {
  buildDashboardStats,
  DASHBOARD_RANGE_OPTIONS,
  RANGE_LABELS,
  resolveDashboardRange,
  type DashboardRangeKey,
  type DateRangeValue,
} from "@/lib/dashboard-stats"
import { formatDate, formatINR, formatNumber, formatPercent, timeAgo } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"

const ALL_CATEGORIES = "all"

export default function DashboardPage() {
  const [range, setRange] = useState<DashboardRangeKey>("30d")
  const [customRange, setCustomRange] = useState<DateRangeValue | undefined>()
  const [categoryId, setCategoryId] = useState(ALL_CATEGORIES)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const { toast } = useToast()

  const bookingsQuery = useGetBookingsQuery()
  const customersQuery = useGetCustomersQuery()
  const employeesQuery = useGetEmployeesQuery()
  const contactsQuery = useGetContactsQuery()
  const categoriesQuery = useGetCategoriesQuery()

  const orders = useMemo(() => bookingsQuery.data?.bookings ?? [], [bookingsQuery.data])
  const customers = useMemo(() => customersQuery.data?.customers ?? [], [customersQuery.data])
  const employees = useMemo(() => employeesQuery.data?.employees ?? [], [employeesQuery.data])
  const contacts = useMemo(() => contactsQuery.data?.contacts ?? [], [contactsQuery.data])
  const categories = useMemo(
    () => categoriesQuery.data?.categories ?? [],
    [categoriesQuery.data]
  )

  const isFetching =
    bookingsQuery.isFetching ||
    customersQuery.isFetching ||
    employeesQuery.isFetching ||
    contactsQuery.isFetching ||
    categoriesQuery.isFetching

  const isReady =
    bookingsQuery.isSuccess &&
    customersQuery.isSuccess &&
    employeesQuery.isSuccess &&
    contactsQuery.isSuccess &&
    categoriesQuery.isSuccess

  useEffect(() => {
    if (isReady && !isFetching) {
      setLastUpdated(new Date().toISOString())
    }
  }, [isReady, isFetching])

  const hasCustomRange = Boolean(customRange?.from)
  const rangeKey = hasCustomRange ? "custom" : range

  const resolvedRange = useMemo(
    () => resolveDashboardRange(range, customRange, orders),
    [range, customRange, orders]
  )

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId]
  )

  const stats = useMemo(
    () =>
      buildDashboardStats({
        orders,
        customers,
        employees,
        contacts,
        categories,
        range: resolvedRange,
        rangeKey,
        categoryId: categoryId === ALL_CATEGORIES ? undefined : categoryId,
        categoryName: categoryId === ALL_CATEGORIES ? undefined : selectedCategory?.name,
      }),
    [
      orders,
      customers,
      employees,
      contacts,
      categories,
      resolvedRange,
      rangeKey,
      categoryId,
      selectedCategory,
    ]
  )

  const summary = stats.summary
  const showSkeleton = isFetching && !isReady

  const categoryOptions = useMemo(
    () => [
      { value: ALL_CATEGORIES, label: "All categories" },
      ...categories
        .filter((category) => category.status !== "inactive")
        .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999))
        .map((category) => ({ value: category.id, label: category.name })),
    ],
    [categories]
  )

  const handleRangeChange = (value: string) => {
    setRange(value as DashboardRangeKey)
    setCustomRange(undefined)
  }

  const refetchAll = bookingsQuery.refetch
  const handleRefresh = useCallback(async () => {
    const results = await Promise.all([
      refetchAll(),
      customersQuery.refetch(),
      employeesQuery.refetch(),
      contactsQuery.refetch(),
      categoriesQuery.refetch(),
    ])
    const failed = results.find((result) => result.isError)
    if (failed?.error) {
      const message =
        "error" in failed.error && typeof failed.error === "string"
          ? failed.error
          : "Something went wrong"
      toast({ title: "Could not refresh dashboard", description: message, variant: "destructive" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetchAll])

  const rangeLabel = hasCustomRange ? "Custom range" : RANGE_LABELS[range]
  const trendDescription =
    categoryId === ALL_CATEGORIES
      ? `All categories · ${rangeLabel}`
      : `${selectedCategory?.name ?? "Selected category"} · ${rangeLabel}`

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        subtitle={`${rangeLabel} · ${formatDate(resolvedRange.from)} – ${formatDate(
          resolvedRange.to
        )}${lastUpdated ? ` · Updated ${timeAgo(lastUpdated)}` : ""}`}
        actions={
          <>
            <FilterSelect
              value={range}
              onChange={handleRangeChange}
              options={DASHBOARD_RANGE_OPTIONS}
              className="w-full sm:w-36"
            />
            <FilterSelect
              value={categoryId}
              onChange={setCategoryId}
              options={categoryOptions}
              className="w-full sm:w-48"
              placeholder={categoriesQuery.isLoading ? "Loading…" : "All categories"}
              disabled={categoriesQuery.isLoading}
            />
            <DateRangeFilter
              value={customRange}
              onChange={setCustomRange}
              onClear={() => setCustomRange(undefined)}
              placeholder="Pick a date range"
              align="end"
              className="w-full lg:w-[280px]"
            />
            <Button
              variant="outline"
              size="default"
              className="w-full cursor-pointer sm:w-auto"
              onClick={handleRefresh}
              disabled={isFetching}
            >
              <RefreshCw className={isFetching ? "animate-spin" : undefined} />
              Refresh
            </Button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Total Revenue"
          value={formatINR(summary.revenue)}
          icon={<IndianRupee className="size-4" />}
          iconClass="bg-emerald-50 text-emerald-600"
          loading={showSkeleton}
          sub={`${formatNumber(summary.paidOrders)} paid bookings`}
          href="/payments"
        />
        <StatCard
          label="Total Orders"
          value={formatNumber(summary.orders)}
          icon={<ShoppingBag className="size-4" />}
          iconClass="bg-sky-50 text-sky-600"
          loading={showSkeleton}
          sub={`${formatNumber(summary.pendingOrders)} pending · ${formatNumber(
            summary.inProgressOrders
          )} in progress`}
          href="/orders"
        />
        <StatCard
          label="Avg. Order Value"
          value={formatINR(summary.avgOrderValue)}
          icon={<TrendingUp className="size-4" />}
          iconClass="bg-violet-50 text-violet-600"
          loading={showSkeleton}
          sub="Per paid booking"
        />
        <StatCard
          label="New Customers"
          value={formatNumber(summary.newCustomers)}
          icon={<UserPlus className="size-4" />}
          iconClass="bg-indigo-50 text-indigo-600"
          loading={showSkeleton}
          sub={`${formatNumber(summary.customers)} total customers`}
          href="/customers"
        />
        <StatCard
          label="Active Categories"
          value={formatNumber(summary.activeCategories)}
          icon={<FolderTree className="size-4" />}
          iconClass="bg-rose-50 text-rose-600"
          loading={showSkeleton}
          sub={`${formatNumber(summary.totalCategories)} total categories`}
          href="/categories"
        />
        <StatCard
          label="Pending Orders"
          value={formatNumber(summary.pendingOrders)}
          icon={<Clock3 className="size-4" />}
          iconClass="bg-amber-50 text-amber-600"
          loading={showSkeleton}
          sub="Awaiting pickup confirmation"
          href="/orders"
        />
        <StatCard
          label="Canceled Orders"
          value={formatNumber(summary.canceledOrders)}
          icon={<Ban className="size-4" />}
          iconClass="bg-red-50 text-red-600"
          loading={showSkeleton}
          sub={`${formatPercent(summary.canceledOrders, summary.orders)} of total orders`}
          href="/orders"
        />
        <StatCard
          label="Total Employees"
          value={formatNumber(summary.employees)}
          icon={<UserCog className="size-4" />}
          iconClass="bg-teal-50 text-teal-600"
          loading={showSkeleton}
          sub={`${formatNumber(summary.newEmployees)} joined in period`}
          href="/employees"
        />
        <StatCard
          label="Enquiries"
          value={formatNumber(summary.enquiries)}
          icon={<MessagesSquare className="size-4" />}
          iconClass="bg-slate-100 text-slate-600"
          loading={showSkeleton}
          sub={`${formatNumber(summary.newEnquiries)} new in period`}
          href="/contact"
        />
      </div>

      {/* Revenue trend + orders by status */}
      <div className="grid gap-4 lg:grid-cols-5">
        <RevenueTrendCard
          data={stats.revenueTrend}
          loading={showSkeleton}
          description={trendDescription}
        />
        <OrdersByStatusCard
          data={stats.ordersByStatus}
          totalOrders={summary.orders}
          loading={showSkeleton}
        />
      </div>

      {/* Top categories + recent enquiries */}
      <div className="grid gap-4 lg:grid-cols-5">
        <TopCategoriesCard data={stats.topCategories} loading={showSkeleton} />
        <RecentEnquiriesCard data={stats.recentEnquiries} loading={showSkeleton} />
      </div>

      {/* Recent orders */}
      <RecentOrdersCard data={stats.recentOrders} loading={showSkeleton} />
    </div>
  )
}
