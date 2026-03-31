import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const [password, setPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { login, loading, error } = useAuthStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;
    await login(password);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg-root)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent stripe at top */}
      <div className="accent-stripe" style={{ width: '100%', flexShrink: 0 }} />

      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '300px',
          background:
            'radial-gradient(ellipse, rgba(56, 189, 248, 0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Centered content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-6)',
        }}
      >
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-8)',
            width: '100%',
            maxWidth: '320px',
          }}
        >
          {/* Lock icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Lock
              size={20}
              style={{
                color: 'var(--color-text-tertiary)',
                strokeWidth: 1.5,
              }}
            />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ textAlign: 'center' }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--color-text-tertiary)',
                margin: 0,
              }}
            >
              Command Console
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-disabled)',
                margin: 0,
                marginTop: 'var(--space-2)',
                letterSpacing: '0.02em',
              }}
            >
              Enter access code
            </p>
          </motion.div>

          {/* Password input */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%' }}
          >
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              spellCheck={false}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border-default)'}`,
                outline: 'none',
                padding: 'var(--space-3) 0',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-base)',
                color: 'var(--color-text-primary)',
                textAlign: 'center',
                letterSpacing: '0.12em',
                caretColor: 'var(--color-accent)',
                transition: 'border-color var(--duration-normal) ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                if (!error) {
                  e.currentTarget.style.borderBottomColor = 'var(--color-accent)';
                }
              }}
              onBlur={(e) => {
                if (!error) {
                  e.currentTarget.style.borderBottomColor =
                    'var(--color-border-default)';
                }
              }}
            />
          </motion.div>

          {/* Error message */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-danger)',
                margin: 0,
                marginTop: 'calc(var(--space-2) * -1)',
                letterSpacing: '0.02em',
              }}
            >
              {error}
            </motion.p>
          )}

          {/* Submit button */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%' }}
          >
            <button
              type="submit"
              disabled={loading || !password.trim()}
              style={{
                width: '100%',
                padding: 'var(--space-3) var(--space-6)',
                background: loading
                  ? 'var(--color-accent-muted)'
                  : 'var(--color-accent)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#08090e',
                cursor: loading || !password.trim() ? 'not-allowed' : 'pointer',
                transition: 'all var(--duration-normal) ease',
                opacity: !password.trim() ? 0.4 : 1,
                animation: loading ? 'loginPulse 1.5s ease-in-out infinite' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!loading && password.trim()) {
                  e.currentTarget.style.background = 'var(--color-accent-hover)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-glow)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'var(--color-accent)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {loading ? 'Authenticating...' : 'Authenticate'}
            </button>
          </motion.div>
        </motion.form>
      </div>

      {/* Pulse animation for loading state */}
      <style>{`
        @keyframes loginPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
