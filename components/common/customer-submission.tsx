"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { ImageIcon, Mic, FileText, X } from "lucide-react"

interface CustomerSubmissionProps {
  images?: string[]
  audioRecording?: string
  textDescription?: string
}

export function CustomerSubmission({ images, audioRecording, textDescription }: CustomerSubmissionProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Default images if not provided
  const customerImages = images || [
    "/category/download (17).jpg",
    "/category/download (18).jpg",
    "/category/download (19).jpg",
  ]

  const defaultAudio = audioRecording || "Audio not available"
  const defaultText = textDescription || "Description not available"

  return (
    <>
      <Card>
        <CardHeader className="">
          <CardTitle className="text-lg font-semibold">Customer Submission</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-start">
            {/* Left Side - Images */}
            <div className="flex-1 max-w-[255px]">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon size={16} className="text-blue-500" />
                <Label className="text-xs font-semibold">Images (3)</Label>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {customerImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative cursor-pointer group aspect-square"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image}
                      alt={`Customer submission ${index + 1}`}
                      className="w-full h-full object-cover rounded-md border border-border hover:border-blue-500 transition-colors"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-md flex items-center justify-center">
                      <ImageIcon size={12} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Audio */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Mic size={16} className="text-purple-500" />
                <Label className="text-xs font-semibold">Audio Recording</Label>
              </div>
              <div className="p-3 rounded-md bg-muted/50 border border-border">
                <audio controls className="w-full">
                  <source src={defaultAudio} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          </div>

          {/* Text Description - Below */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} className="text-green-500" />
              <Label className="text-xs font-semibold">Text Description</Label>
            </div>
            <div className="p-2 rounded-md bg-muted/50 border border-border">
              <p className="text-xs text-foreground leading-relaxed line-clamp-2">{defaultText}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={selectedImage !== null} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setSelectedImage(null)}
            >
              <X size={20} />
            </Button>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Customer submission"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

