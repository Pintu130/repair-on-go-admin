"use client"

import { useMemo } from "react"
import { useGetReviewEligibleCategoriesQuery } from "@/lib/store/api/bookingsApi"

/**
 * reviewEligibility collection se: is user (customerUid) ko kaun si categories mein review likhne ka option dena hai.
 * Usage: const { categoryIds, categories, canReviewCategory, isLoading } = useReviewEligibleCategories(customerUid)
 */
export function useReviewEligibleCategories(customerUid: string | undefined) {
  const { data, isLoading, isError } = useGetReviewEligibleCategoriesQuery(customerUid ?? "", {
    skip: !customerUid?.trim(),
  })

  const categoryIds = data?.categoryIds ?? []
  const categories = data?.categories ?? []

  const canReviewCategory = useMemo(() => {
    return (categoryId: string) => {
      if (!categoryId?.trim()) return false
      return categoryIds.includes(categoryId.trim())
    }
  }, [categoryIds])

  return {
    categoryIds,
    categories,
    canReviewCategory,
    isLoading,
    isError,
  }
}
