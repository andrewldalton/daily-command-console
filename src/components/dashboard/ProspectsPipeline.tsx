import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Check, X } from 'lucide-react';
import { useProspectStore } from '../../store/prospectStore';

export default function ProspectsPipeline() {
  const { active, researched, markResearched, dismissProspect } = useProspectStore();

  const todayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return researched.filter((p) => p.addedAt.slice(0, 10) === today).length;
  }, [researched]);

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: 'rgba(37,45,61,0.6)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={14} style={{ color: '#38bdf8' }} />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: '#94a3b8', letterSpacing: '0.1em' }}
          >
            Prospect Pipeline
          </span>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: 'rgba(56,189,248,0.15)',
            color: '#38bdf8',
          }}
        >
          {active.length}
        </span>
      </div>

      {/* Prospect List */}
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {active.map((prospect) => (
            <motion.div
              key={prospect.id}
              layout
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="flex items-start justify-between gap-2 rounded-lg px-3 py-2.5"
              style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {/* Left: Info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: '#e2e8f0' }}
                >
                  {prospect.company}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>
                  {prospect.industry} &middot; {prospect.employeeRange} employees
                </p>
                <p className="text-xs mt-1" style={{ color: '#38bdf8' }}>
                  {prospect.signal}
                </p>
                <span
                  className="inline-block text-[9px] mt-1 px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#64748b',
                  }}
                >
                  {prospect.source}
                </span>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex flex-col items-center gap-1.5 pt-0.5 flex-shrink-0">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => markResearched(prospect.id)}
                  className="flex items-center justify-center cursor-pointer"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.12)',
                    backgroundColor: 'transparent',
                    color: '#64748b',
                    padding: 0,
                  }}
                  title="Mark researched"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(52,211,153,0.2)';
                    e.currentTarget.style.borderColor = '#34d399';
                    e.currentTarget.style.color = '#34d399';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                    e.currentTarget.style.color = '#64748b';
                  }}
                >
                  <Check size={10} strokeWidth={2.5} />
                </motion.button>

                <button
                  onClick={() => dismissProspect(prospect.id)}
                  className="flex items-center justify-center cursor-pointer"
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#64748b',
                    opacity: 0.4,
                    padding: 0,
                  }}
                  title="Dismiss"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.color = '#f472b6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0.4';
                    e.currentTarget.style.color = '#64748b';
                  }}
                >
                  <X size={10} strokeWidth={2} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <p className="text-[10px] mt-3" style={{ color: '#64748b' }}>
        {todayCount} researched today
      </p>
    </div>
  );
}
