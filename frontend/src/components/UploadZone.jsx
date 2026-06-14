import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileUp, Loader2 } from 'lucide-react'
import { uploadPDF } from '../lib/api'

export default function UploadZone({ onUploaded }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const onDrop = useCallback(async (files) => {
    const file = files[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const data = await uploadPDF(file)
      onUploaded(data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }, [onUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: uploading,
  })

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8">
      <div>
        <h1 className="text-3xl font-bold text-white text-center mb-2">Smart PDF Q&A</h1>
        <p className="text-[#64748b] text-center font-mono text-sm">
          Upload a PDF · Ask anything · Get grounded answers
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`w-full max-w-md border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive
            ? 'border-[#7c6aff] bg-[#7c6aff11]'
            : 'border-[#2e2e3a] bg-[#111118] hover:border-[#4338ca] hover:bg-[#13102a]'
          }
          ${uploading ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-[#7c6aff] animate-spin" />
            <p className="text-sm text-[#94a3b8]">Processing PDF & building index…</p>
            <p className="font-mono text-xs text-[#475569]">Chunking · Embedding · Indexing</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <FileUp size={32} className={isDragActive ? 'text-[#7c6aff]' : 'text-[#475569]'} />
            <p className="text-sm text-[#94a3b8]">
              {isDragActive ? 'Drop it here!' : 'Drag & drop your PDF here'}
            </p>
            <p className="font-mono text-xs text-[#334155]">or click to browse · max 20 MB</p>
          </div>
        )}
      </div>

      {error && (
        <p className="font-mono text-xs text-red-400 bg-red-900/20 border border-red-900 px-4 py-2 rounded-lg">
          ⚠ {error}
        </p>
      )}

      {/* Architecture note */}
      <div className="w-full max-w-md bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#334155] mb-3">How it works</p>
        <div className="flex items-center gap-2 flex-wrap justify-center font-mono text-xs text-[#475569]">
          {['PDF Upload', '→', 'PyMuPDF', '→', 'LangChain Chunks', '→', 'FAISS Index', '→', 'Claude Sonnet'].map((t, i) => (
            <span key={i} className={t === '→' ? 'text-[#7c6aff]' : 'bg-[#1e293b] text-[#64748b] px-2 py-0.5 rounded'}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
