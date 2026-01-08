import { useState } from 'react';

interface UploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
}

interface UseImageUploadOptions {
  type?: 'logo' | 'screenshot' | 'avatar' | 'general';
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: string) => void;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const upload = async (file: File): Promise<UploadResult | null> => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (options.type) {
        formData.append('type', options.type);
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Upload failed');
      }

      const data: UploadResult = await res.json();
      setResult(data);
      options.onSuccess?.(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      options.onError?.(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setError(null);
    setResult(null);
  };

  return {
    upload,
    isUploading,
    error,
    result,
    reset,
  };
}
