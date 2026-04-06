import { useRef, useState, useEffect } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { useTheme } from '../../context/ThemeContext'

export default function RichTextEditor({ value, onChange, placeholder }) {
  const quillRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { isDark } = useTheme()

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'code-block', 'blockquote'],
      ['clean']
    ],
  }

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'code-block', 'blockquote'
  ]

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    
    if (isFullscreen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isFullscreen])

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    setTimeout(() => {
      if (quillRef.current) {
        quillRef.current.focus()
      }
    }, 100)
  }

  return (
    <div className={`rich-text-editor-container ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900 p-4' : ''}`}>
      <div className={`rich-text-editor ${isFullscreen ? 'h-full flex flex-col' : ''}`}>
        {/* Toolbar with Fullscreen Button */}
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isFullscreen ? 'Fullscreen Mode - Press ESC to exit' : 'Write your lesson content'}
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>

        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value || ''}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder || 'Write your lesson content here...'}
          className={`bg-white dark:bg-gray-800 rounded-lg ${isFullscreen ? 'flex-1' : ''}`}
        />
      </div>

      {/* Global Styles for Dark Mode */}
      <style jsx global>{`
        /* Dark mode for Quill editor */
        .dark .ql-toolbar {
          background-color: #1f2937 !important;
          border-color: #374151 !important;
        }

        .dark .ql-toolbar button {
          color: #e5e7eb !important;
        }

        .dark .ql-toolbar button:hover {
          color: #60a5fa !important;
        }

        .dark .ql-toolbar .ql-stroke {
          stroke: #e5e7eb !important;
        }

        .dark .ql-toolbar .ql-fill {
          fill: #e5e7eb !important;
        }

        .dark .ql-toolbar .ql-picker {
          color: #e5e7eb !important;
        }

        .dark .ql-toolbar .ql-picker-options {
          background-color: #1f2937 !important;
          border-color: #374151 !important;
        }

        .dark .ql-container {
          background-color: #111827 !important;
          border-color: #374151 !important;
        }

        .dark .ql-editor {
          color: #e5e7eb !important;
          background-color: #111827 !important;
        }

        .dark .ql-editor.ql-blank::before {
          color: #6b7280 !important;
        }

        .dark .ql-editor a {
          color: #60a5fa !important;
        }

        .dark .ql-editor blockquote {
          border-left-color: #374151 !important;
          color: #9ca3af !important;
        }

        .dark .ql-editor code {
          background-color: #1f2937 !important;
          color: #fbbf24 !important;
        }

        .dark .ql-editor pre {
          background-color: #1f2937 !important;
          color: #e5e7eb !important;
        }

        /* Fullscreen mode */
        .rich-text-editor-container.fixed {
          backdrop-filter: blur(4px);
        }

        .rich-text-editor-container.fixed .rich-text-editor {
          max-width: 1200px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .rich-text-editor-container.fixed .ql-container {
          flex: 1;
          min-height: 0;
        }

        .rich-text-editor-container.fixed .ql-editor {
          height: 100%;
          max-height: none;
        }

        /* Editor height */
        .ql-editor {
          min-height: 300px;
          font-size: 16px;
          line-height: 1.6;
        }

        .rich-text-editor-container.fixed .ql-editor {
          min-height: calc(100vh - 150px);
        }
      `}</style>
    </div>
  )
}