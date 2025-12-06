"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Trash2,
  Eye,
  X,
  Mail,
  Phone,
  User,
  MessageSquare,
  Plus,
  Loader2,
} from "lucide-react";
import { SearchInput } from "@/components/common/search-input";
import { SelectFilter } from "@/components/common/select-filter";
import { InfoCard } from "@/components/common/info-card";
import { Pagination } from "@/components/common/pagination";
import { ConfirmationModal } from "@/components/common/confirmation-modal";
import {
  useGetContactsQuery,
  useCreateContactMutation,
  useUpdateContactStatusMutation,
  useDeleteContactMutation,
  type Contact,
} from "@/lib/store/api/contactsApi";
import { useToast } from "@/hooks/use-toast";
import { formatMobileNumber } from "@/data/customers";

export default function ContactPage() {
  // Fetch contacts from Firebase
  const { data, isLoading, isError, error, refetch } = useGetContactsQuery();
  const [createContact, { isLoading: isCreating }] = useCreateContactMutation();
  const [updateContactStatus, { isLoading: isUpdatingStatus }] =
    useUpdateContactStatusMutation();
  const [deleteContact, { isLoading: isDeleting }] = useDeleteContactMutation();
  const { toast } = useToast();

  // Extract contacts from API response or use empty array
  const contacts = data?.contacts || [];

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "read">(
    "all"
  );
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingMessage, setViewingMessage] = useState<{
    message: string;
    name: string;
    email: string;
    phone: string;
    contactId: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  // Check if any filters are active
  const hasActiveFilters = searchTerm !== "" || statusFilter !== "all";

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const filtered = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch =
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || contact.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, contacts]);

  const stats = useMemo(() => {
    return {
      totalContacts: contacts.length,
      newMessages: contacts.filter((c) => c.status === "new").length,
      readMessages: contacts.filter((c) => c.status === "read").length,
    };
  }, [contacts]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleAdd = async () => {
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.message.trim()
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields (Name, Email, Message).",
        variant: "destructive",
      });
      return;
    }

    try {
      await createContact(formData).unwrap();

      toast({
        title: "Contact Created Successfully! 🎉",
        description: "Contact message has been added successfully.",
      });

      setFormData({ name: "", email: "", phone: "", message: "" });
      setIsAdding(false);
      refetch();
    } catch (error: any) {
      console.error("❌ Error creating contact:", error);

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to create contact. Please try again.";

      toast({
        title: "Failed to Create Contact",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      await deleteContact(deletingId).unwrap();

      toast({
        title: "Contact Deleted Successfully! ✅",
        description: "Contact message has been deleted successfully.",
      });

      setDeletingId(null);
      refetch();
    } catch (error: any) {
      console.error("❌ Error deleting contact:", error);

      const errorMessage =
        error?.data?.error ||
        error?.data?.data ||
        error?.message ||
        "Failed to delete contact. Please try again.";

      toast({
        title: "Failed to Delete Contact",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleViewMessage = async (contact: Contact) => {
    setViewingMessage({
      message: contact.message,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      contactId: contact.id,
    });

    // Update status to "read" if it's currently "new"
    if (contact.status === "new") {
      try {
        await updateContactStatus({
          contactId: contact.id,
          status: "read",
        }).unwrap();
        refetch();
      } catch (error: any) {
        console.error("❌ Error updating contact status:", error);
        // Don't show toast for status update errors, just log
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Contact Messages</h1>
          <p className="text-muted-foreground">
            Manage customer contact form submissions
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="cursor-pointer">
          <Plus size={16} className="mr-2" /> Add Contact
        </Button>
      </div>

      {/* Add Contact Modal */}
      {isAdding && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Add New Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contact-name"
                type="text"
                placeholder="Enter name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Phone</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-message">
                Message <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="contact-message"
                placeholder="Enter message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleAdd}
                className="cursor-pointer"
                disabled={isCreating}
              >
                {isCreating && (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                )}
                Add Contact
              </Button>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => {
                  setIsAdding(false);
                  setFormData({ name: "", email: "", phone: "", message: "" });
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                setSearchTerm(value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, email, or phone..."
            />

            {/* Right Side - Status Filter, Page Size, and Clear Button */}
            <div className="flex items-end gap-2">
              {/* Status Filter */}
              <SelectFilter
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value as "all" | "new" | "read");
                  setCurrentPage(1);
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
                  setPageSize(Number(value));
                  setCurrentPage(1);
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-destructive">
                Error loading contacts. Please try again.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Phone
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Message
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-12 text-muted-foreground"
                        >
                          No contacts found
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((contact) => (
                        <tr
                          key={contact.id}
                          className="border-b border-border hover:bg-muted/50"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <User
                                size={16}
                                className="text-muted-foreground"
                              />
                              <p className="font-semibold capitalize">{contact.name}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Mail
                                size={16}
                                className="text-muted-foreground"
                              />
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-primary hover:underline cursor-pointer"
                              >
                                {contact.email}
                              </a>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {contact.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone
                                  size={14}
                                  className="text-muted-foreground shrink-0"
                                />
                                <span>{formatMobileNumber(contact.phone)}</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center">
                                <span className="text-muted-foreground font-medium">
                                  -
                                </span>
                              </div>
                            )}
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
                            <p className="text-muted-foreground">
                              {contact.date}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={
                                contact.status === "new"
                                  ? "default"
                                  : "secondary"
                              }
                            >
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
                      ))
                    )}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={!!deletingId}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingId(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Contact Message?"
        description="Are you sure you want to delete this contact message? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />

      {/* Message View Dialog */}
      <Dialog
        open={!!viewingMessage}
        onOpenChange={(open) => !open && setViewingMessage(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Message</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">
                  Name
                </p>
                <p className="text-sm">{viewingMessage?.name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">
                  Email
                </p>
                <a
                  href={`mailto:${viewingMessage?.email}`}
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  {viewingMessage?.email}
                </a>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">
                Phone
              </p>
              <p className="text-sm">{viewingMessage?.phone}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">
                Message
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted p-4 rounded-lg">
                {viewingMessage?.message}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
