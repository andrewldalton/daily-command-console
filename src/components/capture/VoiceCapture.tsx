import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Check, Sparkles } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useTaskStore } from '../../store/taskStore';
import { useDayStore } from '../../store/dayStore';
import type { Task } from '../../types';

/* ── Auto-categorization heuristics (matches OCR logic) ── */
function categorizeText(text: string): {
  title: string;
  category: Task['category'];
  priority: Task['priority'];
} {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  let category: Task['category'] = 'work';
  let priority: Task['priority'] = 'medium';

  if (
    /urgent|asap|critical|important|deadline|must win|priority|big\s?3/i.test(lower)
  ) {
    category = 'must-win';
    priority = 'high';
  } else if (
    /gym|doctor|dentist|grocery|pick\s?up|laundry|cook|clean|personal|appointment|haircut|errand|kids|wife|family|home/i.test(
      lower
    )
  ) {
    category = 'personal';
    priority = 'low';
  } else if (
    /follow\s?up|waiting|check\s?on|remind|ask\s?about|ping|check\s?in|status|circle\s?back/i.test(
      lower
    )
  ) {
    category = 'follow-up';
    priority = 'medium';
  }

  // Clean up category prefix if user spoke it
  const cleaned = trimmed
    .replace(
      /^(big\s?3|must\s?win|blitz|daily\s?blitz|personal|follow[\s-]?up)[:\s]+/i,
      ''
    )
    .trim();

  // Override category if user explicitly said it
  if (/^(big\s?3|must\s?win)/i.test(trimmed)) {
    category = 'must-win';
    priority = 'high';
  } else if (/^(blitz|daily\s?blitz)/i.test(trimmed)) {
    category = 'work';
  } else if (/^personal/i.test(trimmed)) {
    category = 'personal';
    priority = 'low';
  } else if (/^follow[\s-]?up/i.test(trimmed)) {
    category = 'follow-up';
  }

  return { title: cleaned || trimmed, category, priority };
}

/* ── Parse batch input: split on "period" or "next" or newlines ── */
function parseBatchTranscript(
  text: string
): Array<{ title: string; category: Task['category']; priority: Task['priority'] }> {
  // Split on ". " or " next " or newlines
  const segments = text
    .split(/(?:\.\s+|\s+next\s+|\n)+/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  return segments.map(categorizeText);
}

const CATEGORY_COLORS: Record<Task['category'], string> = {
  'must-win': '#f472b6',
  work: '#38bdf8',
  personal: '#a78bfa',
  'follow-up': '#fbbf24',
};

const CATEGORY_LABELS: Record<Task['category'], string> = {
  'must-win': 'Big 3',
  work: 'Blitz',
  personal: 'Personal',
  'follow-up': 'Follow-Up',
};

export default function VoiceCapture() {
  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    start,
    stop,
    reset,
    error,
  } = useSpeechRecognition({ continuous: true, interimResults: true });

  const { addTask } = useTaskStore();
  const today = useDayStore((s) => s.today);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [parsedTasks, setParsedTasks] = useState<
    Array<{ title: string; category: Task['category']; priority: Task['priority'] }>
  >([]);
  const [justAdded, setJustAdded] = useState(false);
  // Don't render on unsupported browsers
  if (!isSupported) return null;

  // Parse transcript into tasks whenever it changes
  useEffect(() => {
    if (transcript.trim()) {
      setParsedTasks(parseBatchTranscript(transcript));
    } else {
      setParsedTasks([]);
    }
  }, [transcript]);

  const handleFabClick = useCallback(() => {
    if (isListening) {
      stop();
      if (transcript.trim()) {
        setSheetOpen(true);
      }
    } else {
      reset();
      setParsedTasks([]);
      setJustAdded(false);
      start();
      setSheetOpen(true);
    }
  }, [isListening, transcript, start, stop, reset]);

  const handleConfirmAll = () => {
    if (!today || parsedTasks.length === 0) return;

    parsedTasks.forEach((task) => {
      addTask({
        dayId: today.id,
        title: task.title,
        category: task.category,
        priority: task.priority,
        source: 'manual',
      });
    });

    setJustAdded(true);
    if (isListening) stop();

    // Auto-close after animation
    setTimeout(() => {
      setSheetOpen(false);
      setJustAdded(false);
      reset();
      setParsedTasks([]);
    }, 1200);
  };

  const handleRemoveTask = (index: number) => {
    setParsedTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCycleCategory = (index: number) => {
    const order: Task['category'][] = ['work', 'must-win', 'personal', 'follow-up'];
    setParsedTasks((prev) =>
      prev.map((t, i) => {
        if (i !== index) return t;
        const currentIdx = order.indexOf(t.category);
        const nextCat = order[(currentIdx + 1) % order.length];
        return { ...t, category: nextCat };
      })
    );
  };

  const handleClose = () => {
    if (isListening) stop();
    setSheetOpen(false);
    reset();
    setParsedTasks([]);
    setJustAdded(false);
  };

  const liveText = transcript + (interimTranscript ? ' ' + interimTranscript : '');

  return (
    <>
      {/* ── Floating Action Button ── */}
      <motion.button
        onClick={handleFabClick}
        className="fixed z-[var(--z-dropdown)] rounded-full flex items-center justify-center shadow-lg cursor-pointer"
        style={{
          bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
          right: '1.25rem',
          width: 52,
          height: 52,
          backgroundColor: isListening ? '#f472b6' : '#38bdf8',
          border: 'none',
          boxShadow: isListening
            ? '0 0 24px rgba(244,114,182,0.4), 0 4px 16px rgba(0,0,0,0.3)'
            : '0 0 20px rgba(56,189,248,0.3), 0 4px 16px rgba(0,0,0,0.3)',
        }}
        whileTap={{ scale: 0.9 }}
        animate={
          isListening
            ? {
                boxShadow: [
                  '0 0 24px rgba(244,114,182,0.4), 0 4px 16px rgba(0,0,0,0.3)',
                  '0 0 40px rgba(244,114,182,0.6), 0 4px 16px rgba(0,0,0,0.3)',
                  '0 0 24px rgba(244,114,182,0.4), 0 4px 16px rgba(0,0,0,0.3)',
                ],
              }
            : {}
        }
        transition={isListening ? { duration: 1.5, repeat: Infinity } : {}}
        aria-label={isListening ? 'Stop recording' : 'Voice capture'}
      >
        {isListening ? (
          <MicOff className="w-5 h-5 text-white" />
        ) : (
          <Mic className="w-5 h-5 text-white" />
        )}
      </motion.button>

      {/* ── Bottom Sheet ── */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[var(--z-overlay)] bg-black/50 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 400 }}
              className="fixed bottom-0 left-0 right-0 z-[var(--z-modal)] max-h-[85vh] flex flex-col rounded-t-2xl overflow-hidden"
              style={{
                backgroundColor: '#1e2433',
                borderTop: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3">
                <div className="flex items-center gap-2.5">
                  {isListening ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Mic className="w-4 h-4 text-[#f472b6]" />
                    </motion.div>
                  ) : (
                    <Mic className="w-4 h-4 text-[#38bdf8]" />
                  )}
                  <span className="text-sm font-semibold text-[#e2e8f0]">
                    {isListening ? 'Listening...' : 'Voice Capture'}
                  </span>
                  {isListening && (
                    <motion.div
                      className="flex items-center gap-1"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#f472b6]" />
                      <span className="text-[10px] text-[#f472b6] font-mono uppercase">
                        rec
                      </span>
                    </motion.div>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-md hover:bg-white/[0.06] text-[#64748b] hover:text-[#94a3b8] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Live transcription area */}
              <div className="px-5 pb-4">
                <div
                  className="rounded-xl p-4 min-h-[80px] max-h-[120px] overflow-y-auto"
                  style={{
                    backgroundColor: '#252d3d',
                    border: `1px solid ${isListening ? 'rgba(244,114,182,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    transition: 'border-color 0.3s',
                  }}
                >
                  {liveText ? (
                    <p className="text-sm text-[#e2e8f0] leading-relaxed">
                      {transcript}
                      {interimTranscript && (
                        <span className="text-[#94a3b8] italic">
                          {' '}
                          {interimTranscript}
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-[#475569] italic">
                      {isListening
                        ? 'Speak your tasks... Say "Big 3" or "Follow up" to set category.'
                        : 'Tap the mic to start recording.'}
                    </p>
                  )}
                </div>

                {error && (
                  <p className="text-xs text-[#f472b6] mt-2">
                    Mic error: {error}. Check browser permissions.
                  </p>
                )}

                {/* Hint text */}
                {isListening && !transcript && (
                  <p className="text-[10px] text-[#64748b] mt-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Tip: Pause between tasks to separate them, or say "next" between items.
                  </p>
                )}
              </div>

              {/* Parsed tasks preview */}
              {parsedTasks.length > 0 && (
                <div
                  className="px-5 pb-4 flex-1 overflow-y-auto"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center justify-between py-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                      {parsedTasks.length} {parsedTasks.length === 1 ? 'Task' : 'Tasks'} Detected
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <AnimatePresence mode="popLayout">
                      {parsedTasks.map((task, i) => (
                        <motion.div
                          key={`${task.title}-${i}`}
                          layout
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          {/* Category badge (tap to cycle) */}
                          <button
                            onClick={() => handleCycleCategory(i)}
                            className="shrink-0 px-2 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border transition-colors cursor-pointer"
                            style={{
                              color: CATEGORY_COLORS[task.category],
                              backgroundColor: `${CATEGORY_COLORS[task.category]}15`,
                              borderColor: `${CATEGORY_COLORS[task.category]}30`,
                            }}
                            title="Tap to change category"
                          >
                            {CATEGORY_LABELS[task.category]}
                          </button>

                          {/* Title */}
                          <span className="flex-1 text-[13px] text-[#e2e8f0] min-w-0 truncate">
                            {task.title}
                          </span>

                          {/* Remove */}
                          <button
                            onClick={() => handleRemoveTask(i)}
                            className="shrink-0 p-0.5 rounded text-[#64748b] hover:text-[#f472b6] transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Action bar */}
              <div
                className="flex items-center gap-3 px-5 py-4"
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
                }}
              >
                {isListening ? (
                  <button
                    onClick={() => stop()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                    style={{
                      backgroundColor: 'rgba(244,114,182,0.15)',
                      color: '#f472b6',
                      border: '1px solid rgba(244,114,182,0.3)',
                    }}
                  >
                    <MicOff className="w-4 h-4" />
                    Stop Recording
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        reset();
                        setParsedTasks([]);
                        start();
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        color: '#94a3b8',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <Mic className="w-4 h-4" />
                      Re-record
                    </button>

                    <AnimatePresence mode="wait">
                      {justAdded ? (
                        <motion.div
                          key="success"
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                          style={{
                            backgroundColor: 'rgba(163,230,53,0.15)',
                            color: '#a3e635',
                            border: '1px solid rgba(163,230,53,0.3)',
                          }}
                        >
                          <Check className="w-4 h-4" />
                          Added!
                        </motion.div>
                      ) : (
                        <motion.button
                          key="confirm"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={handleConfirmAll}
                          disabled={parsedTasks.length === 0}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: '#38bdf8',
                            color: '#fff',
                            border: 'none',
                            boxShadow: '0 0 16px rgba(56,189,248,0.25)',
                          }}
                        >
                          <Check className="w-4 h-4" />
                          Add {parsedTasks.length}{' '}
                          {parsedTasks.length === 1 ? 'Task' : 'Tasks'}
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
