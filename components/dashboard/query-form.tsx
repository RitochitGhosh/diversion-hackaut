'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Send, Paperclip, X, ImageIcon, Loader2 } from 'lucide-react';

const MAX_IMAGES = 3;
const ACCEPTED = 'image/jpeg,image/png,image/gif,image/webp';

interface UploadedImage {
  file: File;
  preview: string;    // object URL for preview
  url: string | null; // Cloudinary URL after upload
  error: string | null;
  uploading: boolean;
}

interface QueryFormProps {
  serviceId: string;
  onQuerySubmitted: () => void;
}

export function QueryForm({ serviceId, onQuerySubmitted }: QueryFormProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadOne(img: UploadedImage, index: number) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET;

    if (!cloudName || !uploadPreset) {
      setImages((prev) =>
        prev.map((im, i) =>
          i === index ? { ...im, error: 'Image upload not configured', uploading: false } : im
        )
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', img.file);
      formData.append('upload_preset', uploadPreset);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error?.message ?? 'Upload failed');

      setImages((prev) =>
        prev.map((im, i) => (i === index ? { ...im, url: data.secure_url, uploading: false } : im))
      );
    } catch (err) {
      setImages((prev) =>
        prev.map((im, i) =>
          i === index
            ? { ...im, error: err instanceof Error ? err.message : 'Upload failed', uploading: false }
            : im
        )
      );
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_IMAGES - images.length);
    if (!files.length) return;

    const newImages: UploadedImage[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      url: null,
      error: null,
      uploading: true,
    }));

    const startIdx = images.length;
    setImages((prev) => [...prev, ...newImages]);
    newImages.forEach((img, idx) => {
      uploadOne(img, startIdx + idx);
    });

    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  function removeImage(index: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    // Wait for any pending uploads
    const pending = images.some((im) => im.uploading);
    if (pending) {
      setError('Please wait for images to finish uploading.');
      return;
    }
    const failedUploads = images.filter((im) => im.error);
    if (failedUploads.length) {
      setError('Some images failed to upload. Remove them before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess(false);

    const imageUrls = images.map((im) => im.url).filter(Boolean) as string[];

    try {
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), serviceId, imageUrls }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit query');

      setContent('');
      setImages([]);
      setSuccess(true);
      onQuerySubmitted();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const canAttach = images.length < MAX_IMAGES;

  return (
    <div className="border-3 border-neo-black shadow-brutal-lg bg-neo-yellow">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b-3 border-neo-black bg-neo-black text-white">
        <Sparkles size={18} className="text-neo-yellow" />
        <span className="font-display font-black text-base">Ask the AI</span>
        <span className="ml-auto text-xs font-body text-white/50">Reviewed by human experts</span>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <Textarea
          id="query"
          placeholder="Ask anything... e.g., 'How do I implement JWT refresh tokens in Node.js?' or 'What are best practices for PostgreSQL indexing?'"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="bg-white border-3 border-neo-black focus:shadow-brutal"
        />

        {/* Image previews */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative w-20 h-20 border-3 border-neo-black overflow-hidden shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.preview} alt="attachment" className="w-full h-full object-cover" />
                {img.uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 size={20} className="text-white animate-spin" />
                  </div>
                )}
                {img.error && (
                  <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center p-1">
                    <span className="text-white text-[9px] font-bold text-center leading-tight">
                      Upload failed
                    </span>
                  </div>
                )}
                {!img.uploading && (
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-neo-black text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X size={10} />
                  </button>
                )}
                {img.url && (
                  <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-neo-green border border-white rounded-full flex items-center justify-center">
                    <span className="text-[8px] font-black text-neo-black">✓</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="border-3 border-red-600 bg-red-50 p-3">
            <p className="font-display font-bold text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="border-3 border-neo-black bg-neo-green p-3 shadow-brutal-sm">
            <p className="font-display font-bold text-sm">
              ✓ Query submitted! AI is drafting a response. A reviewer will check it shortly.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Attach image */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!canAttach}
              title={canAttach ? 'Attach images (max 3)' : 'Max 3 images'}
              className="flex items-center gap-1.5 px-3 py-1.5 border-3 border-neo-black font-display font-bold text-xs bg-white hover:bg-neo-cream disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-brutal-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <Paperclip size={13} />
              {images.length > 0 ? (
                <span className="flex items-center gap-1">
                  <ImageIcon size={11} /> {images.length}/{MAX_IMAGES}
                </span>
              ) : (
                'Attach'
              )}
            </button>
            <span className="text-xs font-body text-neo-black/50">
              {content.length > 0 ? `${content.length} chars` : 'Be specific for better answers'}
            </span>
          </div>

          <Button
            type="submit"
            variant="black"
            loading={submitting}
            disabled={!content.trim() || images.some((im) => im.uploading)}
            className="gap-2 shrink-0"
          >
            Submit Query <Send size={14} />
          </Button>
        </div>
      </form>
    </div>
  );
}
