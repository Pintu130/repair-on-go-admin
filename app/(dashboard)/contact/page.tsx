"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trash2, Eye, X, Mail, Phone, User, MessageSquare } from "lucide-react"
import { SearchInput } from "@/components/common/search-input"
import { SelectFilter } from "@/components/common/select-filter"
import { InfoCard } from "@/components/common/info-card"
import { Pagination } from "@/components/common/pagination"
import { ConfirmationModal } from "@/components/common/confirmation-modal"

interface Contact {
    id: string
    name: string
    email: string
    phone: string
    message: string
    status: "new" | "read"
    date: string
}

const mockContacts: Contact[] = [
    {
        id: "C001",
        name: "John Smith",
        email: "john.smith@example.com",
        phone: "+1 234 567 8900",
        message: "I need help with plumbing repair in my house. Can you provide a quote?",
        status: "new",
        date: "2024-02-15",
    },
    {
        id: "C002",
        name: "Sarah Johnson",
        email: "sarah.j@example.com",
        phone: "+1 234 567 8901",
        message: "Looking for electrical wiring services. What are your rates?",
        status: "read",
        date: "2024-02-14",
    },
    {
        id: "C003",
        name: "Michael Brown",
        email: "michael.brown@example.com",
        phone: "+1 234 567 8902",
        message: "I would like to schedule a carpentry consultation for next week.",
        status: "new",
        date: "2024-02-13",
    },
    {
        id: "C004",
        name: "Emily Davis",
        email: "emily.davis@example.com",
        phone: "+1 234 567 8903",
        message: "Do you offer painting services? I need my living room painted.",
        status: "read",
        date: "2024-02-12",
    },
    {
        id: "C005",
        name: "David Wilson",
        email: "david.w@example.com",
        phone: "+1 234 567 8904",
        message: "Emergency plumbing needed! My kitchen sink is leaking badly.",
        status: "new",
        date: "2024-02-11",
    },
]

export default function ContactPage() {
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<"all" | "new" | "read">("all")

    // Check if any filters are active
    const hasActiveFilters = searchTerm !== "" || statusFilter !== "all"

    // Clear all filters
    const handleClearFilters = () => {
        setSearchTerm("")
        setStatusFilter("all")
        setCurrentPage(1)
    }

    const [contacts, setContacts] = useState(mockContacts)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [viewingMessage, setViewingMessage] = useState<{ message: string; name: string; email: string; phone: string } | null>(null)

    const filtered = useMemo(() => {
        return contacts.filter((contact) => {
            const matchesSearch =
                contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contact.phone.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesStatus = statusFilter === "all" || contact.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [searchTerm, statusFilter, contacts])

    const stats = {
        totalContacts: contacts.length,
        newMessages: contacts.filter((c) => c.status === "new").length,
        readMessages: contacts.filter((c) => c.status === "read").length,
    }

    const totalPages = Math.ceil(filtered.length / pageSize)
    const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const handleDeleteClick = (id: string) => {
        setDeletingId(id)
    }

    const handleDeleteConfirm = () => {
        if (deletingId) {
            setContacts(contacts.filter((c) => c.id !== deletingId))
            setDeletingId(null)
        }
    }

    const handleViewMessage = (contact: Contact) => {
        setViewingMessage({
            message: contact.message,
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
        })
        // Mark as read
        setContacts(contacts.map((c) => (c.id === contact.id ? { ...c, status: "read" as const } : c)))
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-balance">Contact Messages</h1>
                    <p className="text-muted-foreground">Manage customer contact form submissions</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <InfoCard
                    icon={MessageSquare}
                    label="Total Messages"
                    value={stats.totalContacts.toString()}
                    iconColor="text-blue-500"
                    iconBgColor="bg-blue-500/10"
                />
                <InfoCard
                    icon={Mail}
                    label="New Messages"
                    value={stats.newMessages.toString()}
                    iconColor="text-green-500"
                    iconBgColor="bg-green-500/10"
                />
                <InfoCard
                    icon={Eye}
                    label="Read Messages"
                    value={stats.readMessages.toString()}
                    iconColor="text-gray-500"
                    iconBgColor="bg-gray-500/10"
                />
            </div>

            {/* Custom Filter Section */}
            <Card>
                <CardContent className="px-5">
                    <div className="flex items-end justify-between gap-3">
                        {/* Left Side - Search Input */}
                        <SearchInput
                            value={searchTerm}
                            onChange={(value) => {
                                setSearchTerm(value)
                                setCurrentPage(1)
                            }}
                            placeholder="Search by name, email, or phone..."
                        />

                        {/* Right Side - Status Filter, Page Size, and Clear Button */}
                        <div className="flex items-end gap-2">
                            {/* Status Filter */}
                            <SelectFilter
                                value={statusFilter}
                                onChange={(value) => {
                                    setStatusFilter(value as "all" | "new" | "read")
                                    setCurrentPage(1)
                                }}
                                options={[
                                    { value: "all", label: "All Status" },
                                    { value: "new", label: "New" },
                                    { value: "read", label: "Read" },
                                ]}
                                label="Status"
                                placeholder="All Status"
                            />

                            {/* Page Size */}
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

                            {/* Clear Filters Button - Only show when filters are active */}
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
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-border">
                                <tr>
                                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                                    <th className="text-left py-3 px-4 font-semibold">Phone</th>
                                    <th className="text-left py-3 px-4 font-semibold">Message</th>
                                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((contact) => (
                                    <tr key={contact.id} className="border-b border-border hover:bg-muted/50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <User size={16} className="text-muted-foreground" />
                                                <p className="font-semibold">{contact.name}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Mail size={16} className="text-muted-foreground" />
                                                <a
                                                    href={`mailto:${contact.email}`}
                                                    className="text-primary hover:underline cursor-pointer"
                                                >
                                                    {contact.email}
                                                </a>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Phone size={16} className="text-muted-foreground" />
                                                <p className="text-muted-foreground">{contact.phone}</p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewMessage(contact)}
                                                    className="cursor-pointer shrink-0 h-7 px-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-primary-foreground"
                                                >
                                                    View
                                                </Button>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="text-muted-foreground">{contact.date}</p>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant={contact.status === "new" ? "default" : "secondary"}>
                                                {contact.status === "new" ? "New" : "Read"}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(contact.id)}
                                                    className="text-destructive cursor-pointer shrink-0"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalItems={filtered.length}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                open={!!deletingId}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingId(null)
                    }
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Contact Message?"
                description="Are you sure you want to delete this contact message? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
            />

            {/* Message View Dialog */}
            <Dialog open={!!viewingMessage} onOpenChange={(open) => !open && setViewingMessage(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Contact Message</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground mb-1">Name</p>
                                <p className="text-sm">{viewingMessage?.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-muted-foreground mb-1">Email</p>
                                <a
                                    href={`mailto:${viewingMessage?.email}`}
                                    className="text-sm text-primary hover:underline cursor-pointer"
                                >
                                    {viewingMessage?.email}
                                </a>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-1">Phone</p>
                            <p className="text-sm">{viewingMessage?.phone}</p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-1">Message</p>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted p-4 rounded-lg">
                                {viewingMessage?.message}
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
