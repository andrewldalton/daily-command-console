import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, FileText, CheckCircle2, X, Loader2, Upload } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useDayStore } from '../../store/dayStore';
import type { Task } from '../../types';

type UploadState = 'idle' | 'preview' | 'processing' | 'review' | 'imported';

function parseLine(line: string): {
  title: string;
  category: Task['category'];
} {
  const trimmed = line.trim();
  if (!trimmed) return { title: '', category: 'work' };
  if (trimmed.startsWith('!')) return { title: trimmed.slice(1).trim(), category: 'must-win' };
  if (trimmed.startsWith('-')) return { title: trimmed.slice(1).trim(), category: 'personal' };
  if (trimmed.startsWith('?')) return { title: trimmed.slice(1).trim(), category: 'follow-up' };
  const title = trimmed.startsWith('*') ? trimmed.slice(1).trim() : trimmed;
  return { title, category: 'work' };
}

const CATEGORY_COLORS: Record<Task['category'], string> = {
  'must-win': 'text-red-400 bg-red-500/10 border-red-500/20',
  work: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  personal: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'follow-up': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

export default function NotebookUpload() {
  const [state, setState] = useState<UploadState>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [parsedTasks, setParsedTasks] = useState<
    Array<{ title: string; category: Task['category'] }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { importTasks } = useTaskStore();
  const today = useDayStore((s) => s.today);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, []);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setImageUrl(dataUrl);
      setState('preview');

      // Brief preview before processing
      previewTimerRef.current = setTimeout(async () => {
        setState('processing');

        // Cancel any in-flight request
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
          const res = await fetch('/api/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: dataUrl }),
            signal: controller.signal,
          });

          const data = await res.json() as {
            rawText?: string;
            tasks?: Array<{ title: string; category: string; priority: string }>;
            error?: string;
          };

          if (!res.ok || data.error) {
            // API failed — fall back to empty editable textarea
            setOcrText('');
            setParsedTasks([]);
            setState('review');
            return;
          }

          setOcrText(data.rawText || '');
          setParsedTasks(
            (data.tasks || []).map((t) => ({
              title: t.title,
              category: t.category as Task['category'],
            }))
          );
          setState('review');
        } catch (err: any) {
          if (err?.name === 'AbortError') return;
          // Network error or local dev — fall back to empty editable textarea
          setOcrText('');
          setParsedTasks([]);
          setState('review');
        }
      }, 600);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleImport = () => {
    if (!today) return;
    importTasks(
      parsedTasks.map((t) => ({
        title: t.title,
        category: t.category,
        priority: 'medium' as const,
      })),
      today.id
    );
    setState('imported');
  };

  const handleReset = () => {
    setState('idle');
    setImageUrl(null);
    setOcrText('');
    setParsedTasks([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOcrChange = (newText: string) => {
    setOcrText(newText);
    const lines = newText.split('\n').filter((l) => l.trim());
    setParsedTasks(lines.map(parseLine).filter((t) => t.title.length > 0));
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {/* ── Idle: slim inline bar ── */}
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={`flex items-center gap-3 cursor-pointer rounded-[var(--radius-md)] border border-dashed transition-all duration-200 ${
                dragOver
                  ? 'border-[#38bdf8]/40 bg-[#38bdf8]/[0.05] shadow-[0_0_20px_rgba(56,189,248,0.15)]'
                  : 'border-white/[0.08] hover:border-white/[0.15] bg-[var(--color-bg-surface)]'
              } px-4 py-3`}
            >
              <div
                className={`p-1.5 rounded-md transition-colors duration-200 ${
                  dragOver
                    ? 'bg-[#38bdf8]/10 text-[#38bdf8]'
                    : 'bg-white/[0.04] text-[var(--color-text-tertiary)]'
                }`}
              >
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
                Drop or click to upload a notebook page
              </span>
              <span className="ml-auto text-[9px] font-mono text-[var(--color-text-disabled)] hidden sm:inline">
                ! must-win &nbsp; * work &nbsp; - personal &nbsp; ? follow-up
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          </motion.div>
        )}

        {/* ── Preview ── */}
        {state === 'preview' && imageUrl && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="surface p-3 flex items-center gap-4"
          >
            <div className="rounded-[var(--radius-sm)] overflow-hidden border border-[var(--color-border-subtle)] w-16 h-12 flex-shrink-0">
              <img src={imageUrl} alt="Notebook preview" className="w-full h-full object-cover" />
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)]">Preparing image...</p>
          </motion.div>
        )}

        {/* ── Processing ── */}
        {state === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="surface p-3 flex items-center gap-4"
          >
            {imageUrl && (
              <div className="rounded-[var(--radius-sm)] overflow-hidden border border-[var(--color-border-subtle)] w-16 h-12 flex-shrink-0 opacity-50">
                <img src={imageUrl} alt="Processing" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-4 h-4 text-[var(--color-accent)]" />
              </motion.div>
              <div>
                <p className="text-xs font-medium text-[var(--color-text-primary)]">Processing...</p>
                <motion.p
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-[10px] text-[var(--color-text-tertiary)]"
                >
                  Extracting tasks from your handwriting
                </motion.p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Review ── */}
        {state === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[var(--radius-lg)] bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-md)] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Review Extracted Tasks
                </h3>
              </div>
              <button
                onClick={handleReset}
                className="p-1 rounded-md hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
                  Raw Text{' '}
                  <span className="text-[var(--color-text-disabled)] normal-case tracking-normal">(edit to adjust)</span>
                </label>
                <textarea
                  value={ocrText}
                  onChange={(e) => handleOcrChange(e.target.value)}
                  rows={4}
                  className="w-full bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] px-3 py-2 text-[11px] font-mono text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-glow)] transition-all duration-150 resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                  {parsedTasks.length} Tasks Detected
                </label>
                <div className="flex flex-col gap-1">
                  <AnimatePresence>
                    {parsedTasks.map((task, i) => (
                      <motion.div
                        key={`${task.title}-${i}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.15 }}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-bg-overlay)] border border-[var(--color-border-subtle)]"
                      >
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider border ${CATEGORY_COLORS[task.category]}`}
                        >
                          {task.category}
                        </span>
                        <span className="text-xs text-[var(--color-text-primary)]">{task.title}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-[var(--color-border-subtle)]">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={parsedTasks.length === 0}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-[var(--shadow-sm)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              >
                <Upload className="w-3 h-3" />
                Import {parsedTasks.length} Tasks
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Imported ── */}
        {state === 'imported' && (
          <motion.div
            key="imported"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="surface p-3 flex items-center gap-3"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
              className="p-1.5 rounded-full bg-[var(--color-success-muted)]"
            >
              <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />
            </motion.div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                {parsedTasks.length} tasks imported
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-[var(--radius-md)] text-[10px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)] transition-colors duration-150"
            >
              Upload Another
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
