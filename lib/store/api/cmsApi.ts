import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase/config"

export interface CMSPage {
  id: string
  title: string
  content: string
  slug: string
  updatedAt?: string
  createdAt?: string
}

export interface CMSPageResponse {
  page: CMSPage | null
}

// Default content for CMS pages
const defaultPages: Record<string, CMSPage> = {
  'terms-conditions': {
    id: 'terms-conditions',
    title: 'Terms & Conditions',
    slug: 'terms-conditions',
    content: `<h1>Terms & Conditions</h1>
<p>Welcome to RepairOnGo. By using our services, you agree to these terms and conditions.</p>
<h2>1. Service Agreement</h2>
<p>We provide mobile device repair services. All repairs are subject to availability of parts and technician assessment.</p>
<h2>2. Warranty</h2>
<p>All repairs come with a 30-day warranty covering the specific repair performed.</p>
<h2>3. Payment</h2>
<p>Payment is due upon completion of service. We accept various payment methods including credit cards and digital wallets.</p>`,
  },
  'privacy-policy': {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    content: `<h1>Privacy Policy</h1>
<p>At RepairOnGo, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information.</p>
<h2>Information We Collect</h2>
<p>We collect information necessary to provide our repair services, including contact details and device information.</p>
<h2>How We Use Your Information</h2>
<p>Your information is used solely for providing repair services and communicating with you about your repairs.</p>
<h2>Data Security</h2>
<p>We implement appropriate security measures to protect your personal information.</p>`,
  },
  'refund-policy': {
    id: 'refund-policy',
    title: 'Refund Policy',
    slug: 'refund-policy',
    content: `<h1>Refund Policy</h1>
<p>We want you to be satisfied with our services. Please review our refund policy below.</p>
<h2>Eligibility for Refund</h2>
<p>Refunds may be issued if the repair service was not completed as described or if the issue persists after repair.</p>
<h2>Refund Process</h2>
<p>To request a refund, please contact our customer service within 7 days of service completion.</p>
<h2>Exceptions</h2>
<p>Refunds are not available for damage caused by user misuse or third-party accessories.</p>`,
  },
}

// Convert Firestore document to CMSPage
const convertFirestoreDocToCMSPage = (docData: any, docId: string): CMSPage => {
  const convertTimestamp = (timestamp: any): string => {
    if (!timestamp) return ""
    if (timestamp?.toDate) {
      return timestamp.toDate().toISOString()
    }
    if (typeof timestamp === "string") {
      return timestamp
    }
    return ""
  }

  return {
    id: docId,
    title: docData.title || "",
    content: docData.content || "",
    slug: docData.slug || docId,
    updatedAt: convertTimestamp(docData.updatedAt),
    createdAt: convertTimestamp(docData.createdAt),
  }
}

export const cmsApi = createApi({
  reducerPath: "cmsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["CMSPages"],
  endpoints: (builder) => ({
    getCMSPage: builder.query<CMSPageResponse, string>({
      queryFn: async (pageId: string) => {
        try {
          const pageDocRef = doc(db, "cmsPages", pageId)
          const pageDoc = await getDoc(pageDocRef)

          // If page doesn't exist, create it with default content
          if (!pageDoc.exists()) {
            const defaultPage = defaultPages[pageId]
            if (defaultPage) {
              // Create the document with default content
              await setDoc(pageDocRef, {
                title: defaultPage.title,
                content: defaultPage.content,
                slug: defaultPage.slug,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              })
              
              return {
                data: {
                  page: defaultPage,
                },
              }
            }
            
            return {
              data: {
                page: null,
              },
            }
          }

          const docData = pageDoc.data()
          const page = convertFirestoreDocToCMSPage(docData, pageDoc.id)

          return {
            data: {
              page,
            },
          }
        } catch (error: any) {
          console.error(`Error fetching CMS page ${pageId}:`, error)
          // Return default content on error
          const defaultPage = defaultPages[pageId]
          if (defaultPage) {
            return {
              data: {
                page: defaultPage,
              },
            }
          }
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to fetch CMS page",
              data: error.message || "Failed to fetch CMS page",
            },
          }
        }
      },
      providesTags: (result, error, pageId) => [{ type: "CMSPages", id: pageId }],
    }),
    
    updateCMSPage: builder.mutation<{ success: boolean }, { pageId: string; content: string }>({
      queryFn: async ({ pageId, content }) => {
        try {
          const pageDocRef = doc(db, "cmsPages", pageId)
          const pageDoc = await getDoc(pageDocRef)
          
          const defaultPage = defaultPages[pageId]
          const title = defaultPage?.title || pageId

          if (!pageDoc.exists()) {
            // Create new document
            await setDoc(pageDocRef, {
              title: title,
              content: content,
              slug: pageId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
          } else {
            // Update existing document
            await updateDoc(pageDocRef, {
              content: content,
              updatedAt: serverTimestamp(),
            })
          }

          return {
            data: {
              success: true,
            },
          }
        } catch (error: any) {
          console.error(`Error updating CMS page ${pageId}:`, error)
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error.message || "Failed to update CMS page",
              data: error.message || "Failed to update CMS page",
            },
          }
        }
      },
      invalidatesTags: (result, error, { pageId }) => [
        { type: "CMSPages", id: pageId },
        "CMSPages",
      ],
    }),
  }),
})

export const {
  useGetCMSPageQuery,
  useUpdateCMSPageMutation,
} = cmsApi
