"use client";

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"

// Dynamically import CKEditor React component
const CKEditor = dynamic(
  () => import("@ckeditor/ckeditor5-react").then((mod) => mod.CKEditor),
  { ssr: false }
)

// Singleton pattern - use pre-built classic build to avoid duplicate modules
let ClassicEditor: any = null
let isLoading = false
let loadPromise: Promise<any> | null = null

const loadEditor = async () => {
  if (ClassicEditor) {
    return ClassicEditor
  }

  if (isLoading && loadPromise) {
    return loadPromise
  }

  isLoading = true
  loadPromise = import("@ckeditor/ckeditor5-build-classic")
    .then((module: any) => {
      // Classic build exports the editor as default
      const EditorClass = module.default
      
      // Verify it's a constructor/class
      if (typeof EditorClass !== 'function') {
        throw new Error('Editor is not a constructor function')
      }
      
      ClassicEditor = EditorClass
      isLoading = false
      return ClassicEditor
    })
    .catch((error) => {
      isLoading = false
      loadPromise = null
      throw error
    })

  return loadPromise
}

const LICENSE_KEY = "GPL"

interface AdvancedCKEditorProps {
  data: string
  onChange: (event: any, editor: any) => void
  placeholder?: string
  disabled?: boolean
  height?: string // Dynamic height prop (e.g., "400px", "300px", "500px")
}

export default function AdvancedCKEditor({
  data,
  onChange,
  placeholder = "Type or paste your content here!",
  disabled = false,
  height = "300px", // Default height
}: AdvancedCKEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const editorInstanceRef = useRef<any>(null)
  const [editorConfig, setEditorConfig] = useState<any>(null)

  // Load CSS
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const existingLink = document.querySelector('link[data-ckeditor-css]')
    if (!existingLink) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.type = "text/css"
      link.href = "https://cdn.ckeditor.com/ckeditor5/44.3.0/classic/ckeditor.css"
      link.setAttribute("data-ckeditor-css", "true")
      document.head.appendChild(link)
    }

  }, [])

  // Load editor
  useEffect(() => {
    let isMounted = true

    const initializeEditor = async () => {
      try {
        const EditorClass = await loadEditor()
        
        if (!isMounted) return

        // Verify EditorClass is a function
        if (typeof EditorClass !== 'function') {
          throw new Error('Editor class is not a function')
        }

        // Create enhanced config with more features
        const config: any = {
          licenseKey: LICENSE_KEY,
          toolbar: {
            items: [
              'heading', '|',
              'bold', 'italic', 'underline', 'strikethrough', '|',
              'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
              'link', 'bulletedList', 'numberedList', '|',
              'outdent', 'indent', '|',
              'blockQuote', 'horizontalLine', '|',
              'insertTable', 'mediaEmbed', '|',
              'undo', 'redo'
            ]
          },
          fontSize: {
            options: [
              'tiny',
              'small',
              'default',
              'big',
              'huge',
              { title: 'Custom', value: '60px' }
            ]
          },
          fontFamily: {
            options: [
              'default',
              'Arial, Helvetica, sans-serif',
              'Georgia, serif',
              'Courier New, monospace',
              'Times New Roman, serif'
            ]
          },
          heading: {
            options: [
              { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
              { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
              { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
              { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
              { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
              { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
              { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
            ]
          },
          table: {
            contentToolbar: [
              'tableColumn',
              'tableRow',
              'mergeTableCells',
              'tableProperties',
              'tableCellProperties'
            ]
          },
          link: {
            addTargetToExternalLinks: true,
            defaultProtocol: 'https://',
            decorators: [
              {
                mode: 'manual',
                label: 'Downloadable',
                attributes: {
                  download: 'download'
                }
              }
            ]
          },
          mediaEmbed: {
            previewsInData: true,
            providers: [
              {
                name: 'youtube',
                url: [
                  /^(?:m\.)?youtube\.com\/watch\?v=([\w-]+)/,
                  /^(?:m\.)?youtube\.com\/embed\/([\w-]+)/,
                  /^youtu\.be\/([\w-]+)/
                ],
                html: (match: string[]) => {
                  const id = match[1];
                  return `<div style="position: relative; padding-bottom: 100%; height: 0;"><iframe style="position: absolute; width: 100%; height: 100%; top: 0; left: 0;" src="https://www.youtube.com/embed/${id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
                }
              }
            ]
          }
        }

        if (placeholder) {
          config.placeholder = placeholder
        }

        editorInstanceRef.current = EditorClass
        setEditorConfig(config)
        setIsEditorReady(true)
      } catch (error) {
        console.error('Failed to load CKEditor:', error)
        if (isMounted) {
          setIsEditorReady(false)
        }
      }
    }

    initializeEditor()

    return () => {
      isMounted = false
    }
  }, [placeholder])

  // Set editor height after it's ready
  useEffect(() => {
    if (!isEditorReady || !editorContainerRef.current) return

    const setEditorHeight = () => {
      // Try multiple selectors to find editable element
      const selectors = [
        '.ck-editor__editable',
        '.ck-editor__editable_inline',
        '[contenteditable="true"]',
      ]
      
      selectors.forEach(selector => {
        const editableElement = editorContainerRef.current?.querySelector(selector) as HTMLElement
        if (editableElement) {
          editableElement.style.minHeight = height
          editableElement.style.height = height
        }
      })
    }

    // Try immediately
    setEditorHeight()

    // Try multiple times with delays
    const timeouts = [
      setTimeout(setEditorHeight, 100),
      setTimeout(setEditorHeight, 300),
      setTimeout(setEditorHeight, 500),
      setTimeout(setEditorHeight, 1000),
    ]

    // Use MutationObserver to watch for when editable element appears
    const observer = new MutationObserver(() => {
      setEditorHeight()
    })

    if (editorContainerRef.current) {
      observer.observe(editorContainerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
      })
    }

    return () => {
      timeouts.forEach(id => clearTimeout(id))
      observer.disconnect()
    }
  }, [isEditorReady, data, height])

  if (!isEditorReady || !editorInstanceRef.current || !editorConfig) {
    return (
      <div className="h-[300px] flex items-center justify-center border border-border rounded-md">
        <div className="text-sm text-muted-foreground">Loading editor...</div>
      </div>
    )
  }

  const handleReady = (editor: any) => {
    // Set height when editor is ready
    setTimeout(() => {
      const editable = editor.editing.view.domConverter.viewToDom(editor.editing.view.document.getRoot())
      if (editable) {
        const editableElement = editable as HTMLElement
        editableElement.style.minHeight = height
        editableElement.style.height = height
      }
      
      // Also try to find editable element in DOM
      const editableElements = editorContainerRef.current?.querySelectorAll('.ck-editor__editable')
      editableElements?.forEach((el: Element) => {
        (el as HTMLElement).style.minHeight = height
        ;(el as HTMLElement).style.height = height
      })
    }, 100)
  }

  return (
    <div className="main-container w-full">
      <div className="editor-container editor-container_classic-editor" ref={editorContainerRef}>
        <div className="editor-container__editor">
          <CKEditor
            editor={editorInstanceRef.current}
            config={editorConfig}
            data={data}
            onChange={onChange}
            onReady={handleReady}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}
