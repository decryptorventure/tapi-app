'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileImage, FileText } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  helperText?: string;
  existingUrl?: string;
  disabled?: boolean;
  error?: string;
}

/**
 * ImageUpload Component
 * Drag & drop file upload with preview functionality
 * Supports images and PDF files
 */
export function ImageUpload({
  onFileSelect,
  onFileRemove,
  accept = 'image/*,application/pdf',
  maxSize = 10, // 10MB default
  label,
  helperText,
  existingUrl,
  disabled = false,
  error,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(existingUrl || null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(error || null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setUploadError(null);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setUploadError(`Tệp quá lớn. Kích thước tối đa: ${maxSize}MB`);
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setUploadError('Loại tệp không hợp lệ. Chỉ chấp nhận ảnh và PDF');
        } else {
          setUploadError('Lỗi tải lên tệp');
        }
        return;
      }

      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setFileName(file.name);
      onFileSelect(file);

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // For PDFs, just show file name
        setPreview(null);
      }
    },
    [maxSize, onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.split(',').reduce((acc, type) => {
      acc[type.trim()] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    multiple: false,
    disabled,
  });

  const handleRemove = () => {
    setPreview(null);
    setFileName(null);
    setUploadError(null);
    onFileRemove?.();
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}

      {/* Upload Area */}
      {!preview && !fileName && (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50',
            disabled && 'opacity-50 cursor-not-allowed',
            uploadError && 'border-red-300 bg-red-50'
          )}
        >
          <input {...getInputProps()} />
          <Upload
            className={cn(
              'mx-auto h-12 w-12 mb-4',
              isDragActive ? 'text-blue-500' : 'text-slate-400'
            )}
          />
          <p className="text-sm font-medium text-slate-700 mb-1">
            {isDragActive ? 'Thả tệp vào đây...' : 'Kéo thả tệp hoặc nhấp để chọn'}
          </p>
          {helperText && (
            <p className="text-xs text-slate-500">{helperText}</p>
          )}
          <p className="text-xs text-slate-400 mt-2">
            Kích thước tối đa: {maxSize}MB
          </p>
        </div>
      )}

      {/* Image Preview */}
      {preview && (
        <div className="relative rounded-lg border-2 border-slate-200 overflow-hidden">
          <Image
            src={preview}
            alt="Preview"
            width={400}
            height={300}
            className="w-full h-auto object-contain bg-slate-50"
          />
          {!disabled && (
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-red-50 transition-colors"
              aria-label="Xóa ảnh"
            >
              <X className="h-4 w-4 text-red-600" />
            </button>
          )}
        </div>
      )}

      {/* PDF File Preview */}
      {fileName && !preview && (
        <div className="flex items-center justify-between p-4 border-2 border-slate-200 rounded-lg bg-slate-50">
          <div className="flex items-center gap-3">
            {fileName.endsWith('.pdf') ? (
              <FileText className="h-10 w-10 text-red-500" />
            ) : (
              <FileImage className="h-10 w-10 text-blue-500" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-700">{fileName}</p>
              <p className="text-xs text-slate-500">Tệp đã tải lên</p>
            </div>
          </div>
          {!disabled && (
            <button
              onClick={handleRemove}
              className="p-2 hover:bg-red-50 rounded-full transition-colors"
              aria-label="Xóa tệp"
            >
              <X className="h-5 w-5 text-red-600" />
            </button>
          )}
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <p className="mt-2 text-sm text-red-600">{uploadError}</p>
      )}
    </div>
  );
}
