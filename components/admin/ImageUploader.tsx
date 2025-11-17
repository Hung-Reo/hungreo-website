'use client'

import { useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { toast } from 'sonner'

interface ImageUploaderProps {
  onUpload: (url: string) => void
  currentImage?: string
  onRemove?: () => void
  multiple?: boolean
  maxFiles?: number
  label?: string
}

export function ImageUploader({
  onUpload,
  currentImage,
  onRemove,
  multiple = false,
  maxFiles = 5,
  label = 'Upload Image',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)

  const optimizeImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    }

    try {
      const compressedFile = await imageCompression(file, options)
      return compressedFile
    } catch (error) {
      console.error('Image optimization failed:', error)
      return file // Return original if optimization fails
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (multiple && files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    setUploading(true)

    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`)
          continue
        }

        // Validate file size (max 5MB before compression)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`)
          continue
        }

        // Optimize image
        const optimizedFile = await optimizeImage(file)

        // Upload to API
        const formData = new FormData()
        formData.append('image', optimizedFile)

        const response = await fetch('/api/admin/upload/image', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const { url } = await response.json()
        onUpload(url)
        toast.success(`${file.name} uploaded successfully`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      e.target.value = '' // Reset input
    }
  }

  return (
    <div>
      <label className="text-xs font-medium text-slate-500 uppercase block mb-2">
        {label}
      </label>

      {/* Current Image Preview */}
      {currentImage && (
        <div className="mb-3 relative inline-block">
          <img
            src={currentImage}
            alt="Preview"
            className="w-48 h-32 object-cover rounded-lg border-2 border-slate-200"
          />
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
              title="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Upload Button */}
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileUpload}
        disabled={uploading}
        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer disabled:opacity-50"
      />

      {uploading && (
        <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading and optimizing...
        </div>
      )}

      <p className="text-xs text-slate-500 mt-2">
        Recommended: {multiple ? `Up to ${maxFiles} images` : 'Single image'}, max 5MB each. Images
        will be optimized automatically.
      </p>
    </div>
  )
}
