'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Upload, Trash2, FileText, AlertCircle, Plus, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface KnowledgeDoc {
  id: string;
  title: string;
  fileName: string | null;
  chunkCount: number;
  createdAt: string;
  uploadedBy: { name: string | null; email: string };
}

type UploadTab = 'text' | 'file';

export default function KnowledgePage() {
  const searchParams = useSearchParams();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [activeServiceId, setActiveServiceId] = useState('');
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadTab, setUploadTab] = useState<UploadTab>('text');
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadServices() {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (res.ok && data.memberships?.length > 0) {
        // Only show services where user is ADMIN or REVIEWER
        const allowed = data.memberships.filter((m: any) => m.role !== 'USER');
        setMemberships(allowed);
        const paramId = searchParams.get('serviceId');
        setActiveServiceId(paramId ?? (allowed[0]?.service.id ?? ''));
      }
    }
    loadServices();
  }, [searchParams]);

  const loadDocs = useCallback(async () => {
    if (!activeServiceId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/knowledge?serviceId=${activeServiceId}`);
      const data = await res.json();
      if (res.ok) setDocs(data.documents ?? []);
    } finally {
      setLoading(false);
    }
  }, [activeServiceId]);

  useEffect(() => {
    if (activeServiceId) loadDocs();
  }, [activeServiceId, loadDocs]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!activeServiceId || uploading) return;

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      let res: Response;

      if (uploadTab === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('serviceId', activeServiceId);
        formData.append('title', title || selectedFile.name);
        formData.append('file', selectedFile);
        res = await fetch('/api/knowledge', { method: 'POST', body: formData });
      } else {
        if (!textContent.trim()) throw new Error('Content is required');
        res = await fetch('/api/knowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceId: activeServiceId, title: title || 'Untitled', content: textContent }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');

      setUploadSuccess(`✓ "${data.document.title}" uploaded — ${data.document.chunkCount} chunks indexed`);
      setTitle('');
      setTextContent('');
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      setShowForm(false);
      loadDocs();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: string, docTitle: string) {
    if (!confirm(`Delete "${docTitle}" and all its chunks?`)) return;
    setDeletingId(docId);
    try {
      const res = await fetch(`/api/knowledge/${docId}`, { method: 'DELETE' });
      if (res.ok) loadDocs();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-3 border-neo-black shadow-brutal bg-neo-purple p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-black text-2xl mb-1 flex items-center gap-2">
              <BookOpen size={22} /> Knowledge Base
            </h1>
            <p className="font-body text-sm text-neo-black/70">
              Upload reports, docs, and text. AI uses these for in-memory RAG when answering queries.
            </p>
          </div>
          <Button variant="black" size="sm" onClick={() => setShowForm(!showForm)} className="gap-1 shrink-0">
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Cancel' : 'Add Document'}
          </Button>
        </div>
      </div>

      {/* Service selector */}
      {memberships.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {memberships.map(({ service }: any) => (
            <button
              key={service.id}
              onClick={() => setActiveServiceId(service.id)}
              className={`flex items-center gap-2 px-4 py-2 border-3 border-neo-black font-display font-bold text-sm whitespace-nowrap transition-all ${
                activeServiceId === service.id ? 'bg-neo-black text-white' : 'bg-white hover:bg-neo-cream'
              }`}
            >
              {service.logoEmoji} {service.name}
            </button>
          ))}
        </div>
      )}

      {memberships.length === 0 && !loading && (
        <div className="border-3 border-neo-black p-8 text-center bg-neo-cream">
          <p className="font-display font-bold">You need ADMIN or REVIEWER role to manage knowledge base.</p>
        </div>
      )}

      {uploadSuccess && (
        <div className="border-3 border-neo-black bg-neo-green p-3 shadow-brutal-sm">
          <p className="font-display font-bold text-sm">{uploadSuccess}</p>
        </div>
      )}

      {/* Upload Form */}
      {showForm && (
        <div className="border-3 border-neo-black shadow-brutal bg-white">
          {/* Tabs */}
          <div className="flex border-b-3 border-neo-black">
            {(['text', 'file'] as UploadTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setUploadTab(tab)}
                className={`flex-1 py-3 font-display font-bold text-sm capitalize flex items-center justify-center gap-2 transition-colors ${
                  uploadTab === tab ? 'bg-neo-black text-white' : 'hover:bg-neo-cream'
                }`}
              >
                {tab === 'text' ? <FileText size={14} /> : <Upload size={14} />}
                {tab === 'text' ? 'Paste Text' : 'Upload File'}
              </button>
            ))}
          </div>

          <form onSubmit={handleUpload} className="p-5 space-y-4">
            <Input
              label="Document Title"
              placeholder="e.g., Q3 Report, Product Manual, FAQ..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            {uploadTab === 'text' ? (
              <Textarea
                label="Content *"
                placeholder="Paste your document content here — reports, manuals, FAQs, knowledge articles..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={10}
              />
            ) : (
              <div>
                <label className="block font-display font-bold text-sm mb-1.5">File (.txt or .md) *</label>
                <div
                  className="border-3 border-dashed border-neo-black p-6 text-center cursor-pointer hover:bg-neo-cream transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="font-display font-bold text-sm">
                    {selectedFile ? selectedFile.name : 'Click to select file'}
                  </p>
                  <p className="text-xs font-body text-neo-black/40 mt-1">Supports .txt, .md files</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.md,.csv"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
              </div>
            )}

            {uploadError && (
              <div className="border-3 border-red-600 bg-red-50 p-3 flex items-start gap-2">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <p className="font-display font-bold text-sm text-red-700">{uploadError}</p>
              </div>
            )}

            <div className="border-3 border-neo-black bg-neo-cream p-3">
              <p className="text-xs font-body text-neo-black/60">
                <strong>How it works:</strong> Your document will be chunked into ~800-char segments and embedded using Gemini embeddings. When users ask queries, the most relevant chunks are retrieved and included in the AI context.
              </p>
            </div>

            <Button type="submit" variant="purple" loading={uploading} className="w-full gap-2">
              <Upload size={14} />
              {uploading ? 'Processing & Embedding...' : 'Upload & Index Document'}
            </Button>
          </form>
        </div>
      )}

      {/* Documents list */}
      {loading ? (
        <div className="border-3 border-neo-black p-10 text-center">
          <div className="w-8 h-8 border-3 border-neo-black border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : docs.length === 0 ? (
        <div className="border-3 border-neo-black p-10 text-center bg-neo-cream">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <h3 className="font-display font-black text-lg mb-1">No documents yet</h3>
          <p className="font-body text-sm text-neo-black/50 mb-4">
            Add documents to enable RAG-powered answers for your users.
          </p>
          <Button variant="black" onClick={() => setShowForm(true)} className="gap-1">
            <Plus size={14} /> Add First Document
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-display font-bold text-sm text-neo-black/50">
            {docs.length} document{docs.length !== 1 ? 's' : ''} indexed
          </p>
          {docs.map((doc) => (
            <div key={doc.id} className="border-3 border-neo-black shadow-brutal bg-white flex items-start gap-4 p-4">
              <div className="w-10 h-10 bg-neo-purple border-3 border-neo-black flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-base leading-tight">{doc.title}</p>
                {doc.fileName && (
                  <p className="text-xs font-mono text-neo-black/40 mt-0.5">{doc.fileName}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-2 text-xs font-body text-neo-black/50">
                  <span className="bg-neo-purple border-2 border-neo-black px-2 py-0.5 font-display font-bold">
                    {doc.chunkCount} chunks
                  </span>
                  <span>by {doc.uploadedBy.name ?? doc.uploadedBy.email}</span>
                  <span>{formatDate(doc.createdAt)}</span>
                </div>
              </div>
              <Button
                variant="red"
                size="sm"
                loading={deletingId === doc.id}
                onClick={() => handleDelete(doc.id, doc.title)}
                className="shrink-0"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
