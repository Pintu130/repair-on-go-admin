"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2, ChevronDown } from "lucide-react"

interface FAQItem {
  id: string
  question: string
  answer: string
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      id: "1",
      question: "How do I book a repair service?",
      answer: "You can book through our website or mobile app by selecting your service category and preferred date.",
    },
    {
      id: "2",
      question: "What payment methods do you accept?",
      answer: "We accept credit cards, debit cards, UPI, and digital wallets.",
    },
    {
      id: "3",
      question: "Can I reschedule my appointment?",
      answer: "Yes, you can reschedule up to 24 hours before your appointment.",
    },
  ])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ question: "", answer: "" })

  const handleAdd = () => {
    if (formData.question && formData.answer) {
      setFaqs([...faqs, { id: Date.now().toString(), ...formData }])
      setFormData({ question: "", answer: "" })
      setIsAdding(false)
    }
  }

  const handleEdit = (faq: FAQItem) => {
    setEditingId(faq.id)
    setFormData({ question: faq.question, answer: faq.answer })
  }

  const handleSaveEdit = () => {
    setFaqs(faqs.map((f) => (f.id === editingId ? { ...f, ...formData } : f)))
    setEditingId(null)
    setFormData({ question: "", answer: "" })
  }

  const handleDelete = (id: string) => {
    setFaqs(faqs.filter((f) => f.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">FAQ</h1>
          <p className="text-muted-foreground">Manage frequently asked questions</p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus size={16} className="mr-2" /> Add FAQ
        </Button>
      </div>

      {(isAdding || editingId) && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>{editingId ? "Edit FAQ" : "Add New FAQ"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="text"
              placeholder="Question"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background"
            />
            <textarea
              placeholder="Answer"
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background"
              rows={4}
            />
            <div className="flex gap-3">
              <Button onClick={editingId ? handleSaveEdit : handleAdd}>{editingId ? "Save" : "Add"}</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false)
                  setEditingId(null)
                  setFormData({ question: "", answer: "" })
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {faqs.map((faq) => (
          <Card key={faq.id}>
            <CardHeader className="cursor-pointer" onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{faq.question}</CardTitle>
                <ChevronDown
                  size={20}
                  className={`transition-transform ${expandedId === faq.id ? "rotate-180" : ""}`}
                />
              </div>
            </CardHeader>
            {expandedId === faq.id && (
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{faq.answer}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(faq)} className="flex-1">
                    <Edit2 size={16} className="mr-2" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(faq.id)}
                    className="flex-1 text-destructive"
                  >
                    <Trash2 size={16} className="mr-2" /> Delete
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
