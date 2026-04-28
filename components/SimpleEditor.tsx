'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface SimpleEditorProps {
  data: string;
  onChange: (event: any, editor: any) => void;
  placeholder?: string;
  height?: string;
}

export default function SimpleEditor({
  data,
  onChange,
  placeholder = 'Start typing...',
  height = '500px'
}: SimpleEditorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Simulate CKEditor onChange signature
    onChange(null, {
      getData: () => e.target.value
    });
  };

  return (
    <Textarea
      value={data}
      onChange={handleChange}
      placeholder={placeholder}
      className="w-full resize-none font-mono text-sm"
      style={{ height, minHeight: height }}
    />
  );
}
