'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { useImageUpload } from '@/hooks/useImageUpload';

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  type?: 'logo' | 'screenshot' | 'avatar' | 'general';
  className?: string;
  placeholder?: string;
  aspectRatio?: 'square' | 'video' | 'wide';
}

export function ImageUpload({
  value,
  onChange,
  type = 'general',
  className,
  placeholder = 'Upload image',
  aspectRatio = 'square',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const { upload, isUploading, error } = useImageUpload({
    type,
    onSuccess: (result) => {
      setPreview(result.url);
      onChange?.(result.url);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    await upload(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange?.('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[3/1]',
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />

      {preview ? (
        <div className={cn('relative rounded-lg overflow-hidden', aspectClasses[aspectRatio])}>
          <img
            src={preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
          {!isUploading && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            'w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6',
            'hover:border-orange-500 hover:bg-orange-50 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            aspectClasses[aspectRatio]
          )}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Upload className="h-6 w-6 text-orange-500" />
              </div>
              <span className="text-sm text-muted-foreground">{placeholder}</span>
              <span className="text-xs text-muted-foreground">
                JPEG, PNG, GIF, WebP (max 5MB)
              </span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}

// Avatar-specific upload component
interface AvatarUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarUpload({
  value,
  onChange,
  size = 'md',
  className,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const { upload, isUploading, error } = useImageUpload({
    type: 'avatar',
    onSuccess: (result) => {
      setPreview(result.url);
      onChange?.(result.url);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    await upload(file);
  };

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className={cn(
          'relative rounded-full overflow-hidden border-2 border-dashed border-gray-300',
          'hover:border-orange-500 transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizeClasses[size]
        )}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            ) : (
              <ImageIcon className="h-8 w-8 text-gray-400" />
            )}
          </div>
        )}
      </button>

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
