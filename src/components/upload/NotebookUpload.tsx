import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, FileText, CheckCircle2, X, Upload, Sparkles } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useDayStore } from '../../store/dayStore';
import type { Task } from '../../types';

type UploadState = 'idle' | 'uploading' | 'analyzing' | 'extracting' | 'review' | 'imported' | 'error';

const STEPS = [
  { key: 'uploading', label: 'Uploading image', pct: 20 },
  { key: 'analyzing', label: 'Analyzing handwriting', pct: 55 },
  { key: 'extracting', label: 'Extracting tasks', pct: 85 },
] as const;

function parseLine(line: string): { title: string; category: Task['category'] } {
  const trimmed = line.trim();
  if (!trimmed) return { title: '', category: 'work' };
  if (trimmed.startsWith('!')) return { title: trimmed.slice(1).trim(), category: 'must-win' };
  if (trimmed.startsWith('-')) return { title: trimmed.slice(1).trim(), category: 'personal' };
  if (trimmed.startsWith('?')) return { title: trimmed.slice(1).trim(), category: 'follow-up' };
  const title = trimmed.startsWith('*') ? trimmed.slice(1).trim() : trimmed;
  return { title, category: 'work' };
}

const CATEGORY_COLORS: Record<Task['category'], string> = {
  'must-win': 'text-[#f472b6] bg-[#f472b6]/10 border-[#f472b6]/20',
  work: 'text-[#38bdf8] bg-[#38bdf8]/10 border-[#38bdf8]/20',
  personal: 'text-[#a78bfa] bg-[#a78bfa]/10 border-[#a78bfa]/20',
  'follow-up': 'text-[#fbbf24] bg-[#fbbf24]/10 border-[#fbbf24]/20',
  blitz: 'text-[#34d399] bg-[#34d399]/10 border-[#34d399]/20',
};

export default function NotebookUpload() {
  const [state, setState] = useState<UploadState>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState('');
  const [parsedTasks, setParsedTasks] = useState<
    Array<{ title: string; category: Task['category'] }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { importTasks } = useTaskStore();
  const today = useDayStore((s) => s.today);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // Animate progress smoothly
  const animateProgress = (from: number, to: number, duration: number) => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      setProgress(from + (to - from) * t);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    
    // Step 1: Upload / read image
    setState('uploading');
    setStatusLabel('Uploading image...');
    setProgress(0);
    animateProgress(0, 20, 500);

    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve) => {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });

    setImageUrl(dataUrl);

    // Step 2: Analyzing
    setState('analyzing');
    setStatusLabel('Analyzing handwriting...');
    animateProgress(20, 55, 1000);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ image: dataUrl }),
        signal: controller.signal,
      });

      // Step 3: Extracting
      setState('extracting');
      setStatusLabel('Extracting tasks...');
      animateProgress(55, 95, 600);

      const data = await res.json() as {
        rawText?: string;
        tasks?: Array<{ title: string; category: string; priority: string }>;
        error?: string;
      };

      if (!res.ok || data.error) {
        // API error — let user type manually
        setProgress(100);
        setStatusLabel('AI extraction unavailable — type tasks manually');
        setOcrText('');
        setParsedTasks([]);
        setState('review');
        return;
      }

      setProgress(100);
      setStatusLabel(`Found ${data.tasks?.length ?? 0} tasks`);
      setOcrText(data.rawText || '');
      setParsedTasks(
        (data.tasks || []).map((t) => ({
          title: t.title,
          category: t.category as Task['category'],
        }))
      );

      // Brief pause to show 100%, then show review
      setTimeout(() => setState('review'), 400);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setProgress(100);
      setOcrText('');
      setParsedTasks([]);
      setState('review');
      setStatusLabel('Connection failed — type tasks manually');
    }
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
    setProgress(0);
    setStatusLabel('');
        if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOcrChange = (newText: string) => {
    setOcrText(newText);
    const lines = newText.split('\n').filter((l) => l.trim());
    setParsedTasks(lines.map(parseLine).filter((t) => t.title.length > 0));
  };

  const isProcessing = state === 'uploading' || state === 'analyzing' || state === 'extracting';

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
                ! big 3 &nbsp; * work &nbsp; - personal &nbsp; ? follow-up &nbsp; ~ blitz
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

        {/* ── Processing: status bar with progress ── */}
        {isProcessing && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="rounded-[var(--radius-md)] overflow-hidden"
            style={{ backgroundColor: '#252d3d', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Top section with image preview and status */}
            <div className="flex items-center gap-3 px-4 py-3">
              {imageUrl && (
                <div className="rounded-md overflow-hidden border border-white/[0.08] w-10 h-10 flex-shrink-0">
                  <img src={imageUrl} alt="Notebook" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <motion.div
                    animate={{ rotate: [0, 180, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                  </motion.div>
                  <span className="text-xs font-semibold text-[#e2e8f0]">Task Extractor</span>
                </div>
                <p className="text-[10px] text-[#94a3b8]">{statusLabel}</p>
              </div>
              <button
                onClick={handleReset}
                className="p-1 rounded-md hover:bg-white/[0.06] text-[#64748b] hover:text-[#94a3b8] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="px-4 pb-3">
              <div className="flex items-center justify-between mb-1.5">
                {STEPS.map((step) => (
                  <span
                    key={step.key}
                    className={`text-[9px] font-medium uppercase tracking-wider transition-colors duration-300 ${
                      state === step.key
                        ? 'text-[#38bdf8]'
                        : progress >= step.pct
                          ? 'text-[#a3e635]'
                          : 'text-[#475569]'
                    }`}
                  >
                    {step.label}
                  </span>
                ))}
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #38bdf8, #0ea5e9)',
                    boxShadow: '0 0 12px rgba(56,189,248,0.4)',
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] font-mono text-[#64748b] tabular-nums">{Math.round(progress)}%</span>
                <motion.span
                  className="text-[9px] text-[#64748b]"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Processing with AI...
                </motion.span>
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
            className="rounded-[var(--radius-lg)] overflow-hidden"
            style={{ backgroundColor: '#252d3d', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {/* Completed progress bar */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #38bdf8, #a3e635)' }} />

            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#38bdf8]" />
                <h3 className="text-xs font-semibold text-[#e2e8f0]">
                  Review Extracted Tasks
                </h3>
                {statusLabel && (
                  <span className="text-[9px] text-[#94a3b8]">— {statusLabel}</span>
                )}
              </div>
              <button
                onClick={handleReset}
                className="p-1 rounded-md hover:bg-white/[0.06] text-[#64748b] hover:text-[#94a3b8] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1">
                  Raw Text{' '}
                  <span className="text-[#475569] normal-case tracking-normal">(edit to adjust)</span>
                </label>
                <textarea
                  value={ocrText}
                  onChange={(e) => handleOcrChange(e.target.value)}
                  placeholder={"Type or paste your tasks here...\n! = big 3  * = work  - = personal  ? = follow-up  ~ = blitz"}
                  rows={4}
                  className="w-full rounded-[var(--radius-sm)] px-3 py-2 text-base font-mono text-[#e2e8f0] placeholder:text-[#475569] focus:outline-none focus:border-[#38bdf8] focus:shadow-[0_0_12px_rgba(56,189,248,0.15)] transition-all duration-150 resize-none"
                  style={{
                    backgroundColor: '#1e2433',
                    border: '1px solid rgba(255,255,255,0.10)',
                  }}
                />
              </div>

              {parsedTasks.length > 0 && (
                <div>
                  <label className="block text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider mb-1.5">
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
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-sm)]"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider border ${CATEGORY_COLORS[task.category]}`}
                          >
                            {task.category}
                          </span>
                          <span className="text-xs text-[#e2e8f0]">{task.title}</span>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-white/[0.06]">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium text-[#94a3b8] hover:bg-white/[0.06] transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={parsedTasks.length === 0}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold bg-[#38bdf8] hover:bg-[#0ea5e9] text-white shadow-[0_0_12px_rgba(56,189,248,0.2)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
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
            className="rounded-[var(--radius-md)] p-3 flex items-center gap-3"
            style={{ backgroundColor: '#252d3d', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
              className="p-1.5 rounded-full bg-[#a3e635]/15"
            >
              <CheckCircle2 className="w-4 h-4 text-[#a3e635]" />
            </motion.div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-[#e2e8f0]">
                {parsedTasks.length} tasks imported
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-[var(--radius-md)] text-[10px] font-medium text-[#94a3b8] hover:bg-white/[0.06] border border-white/[0.08] transition-colors duration-150"
            >
              Upload Another
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
