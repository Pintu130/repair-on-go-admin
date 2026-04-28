'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Save, Eye, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AdvancedCKEditor from './AdvancedCKEditor';

interface CMSPageEditorProps {
  title: string;
  description: string;
  initialContent: string;
  pageKey?: string;
}

// Static storage for CMS content
const staticContentStorage: Record<string, string> = {
  'terms-conditions': `<h1>Terms & Conditions</h1>
<p>Welcome to RepairOnGo. By using our services, you agree to these terms and conditions.</p>
<h2>1. Service Agreement</h2>
<p>We provide mobile device repair services. All repairs are subject to availability of parts and technician assessment.</p>
<h2>2. Warranty</h2>
<p>All repairs come with a 30-day warranty covering the specific repair performed.</p>
<h2>3. Payment</h2>
<p>Payment is due upon completion of service. We accept various payment methods including credit cards and digital wallets.</p>`,
  'privacy-policy': `<h1>Privacy Policy</h1>
<p>At RepairOnGo, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information.</p>
<h2>Information We Collect</h2>
<p>We collect information necessary to provide our repair services, including contact details and device information.</p>
<h2>How We Use Your Information</h2>
<p>Your information is used solely for providing repair services and communicating with you about your repairs.</p>
<h2>Data Security</h2>
<p>We implement appropriate security measures to protect your personal information.</p>`,
  'refund-policy': `<h1>Refund Policy</h1>
<p>We want you to be satisfied with our services. Please review our refund policy below.</p>
<h2>Eligibility for Refund</h2>
<p>Refunds may be issued if the repair service was not completed as described or if the issue persists after repair.</p>
<h2>Refund Process</h2>
<p>To request a refund, please contact our customer service within 7 days of service completion.</p>
<h2>Exceptions</h2>
<p>Refunds are not available for damage caused by user misuse or third-party accessories.</p>`
};

export default function CMSPageEditor({
  title,
  description,
  initialContent,
  pageKey = 'cms-page'
}: CMSPageEditorProps) {
  const { toast } = useToast();
  const [content, setContent] = useState(() => {
    // Load from static storage or use initial content
    return staticContentStorage[pageKey] || initialContent;
  });
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const handleContentChange = (event: any, editor: any) => {
    const data = editor.getData();
    setContent(data);
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Save to static storage
    staticContentStorage[pageKey] = content;
    
    setLastSaved(new Date());
    setIsDirty(false);
    toast({
      title: 'Content saved successfully!',
      description: 'Your changes have been saved.',
    });
    
    setIsSaving(false);
  };

  const handlePreview = () => {
    setPreviewMode(!previewMode);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground mt-1">{description}</p>
          </div>
          {/* <div className="flex items-center gap-2">
            {isDirty && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <AlertCircle className="w-3 h-3 mr-1" />
                Unsaved
              </Badge>
            )}
            {lastSaved && !isDirty && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Saved
              </Badge>
            )}
          </div> */}
        </div>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="cursor-pointer"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              onClick={handlePreview}
              className="cursor-pointer"
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? 'Edit Mode' : 'Preview Mode'}
            </Button>
            <div className="flex-1" />
            {lastSaved && (
              <p className="text-sm text-muted-foreground self-center">
                Last saved: {lastSaved.toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Editor/Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {previewMode ? 'Preview' : 'Content Editor'}
          </CardTitle>
          <CardDescription>
            {previewMode 
              ? 'Preview how your content will appear to users'
              : 'Edit your page content using the editor below'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {previewMode ? (
            <div className="min-h-[500px] max-h-[500px] p-6 border border-border rounded-md bg-background overflow-auto">
              <div 
                className="prose prose-sm sm:prose-base max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <AdvancedCKEditor
                data={content}
                onChange={handleContentChange}
                placeholder="Start typing your content here..."
                height="500px"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
