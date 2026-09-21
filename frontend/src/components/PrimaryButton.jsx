import { motion } from 'framer-motion';

export default function PrimaryButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  loading = false,
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-9 py-4 text-sm font-semibold uppercase tracking-[0.16em] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none';
  const styles =
    variant === 'primary'
      ? 'bg-brand-accent text-ink-950 hover:bg-brand-accentHover hover:shadow-glow'
      : variant === 'dark'
        ? 'bg-ink-800 text-mist border border-white/10 hover:border-white/25 hover:bg-ink-700'
        : 'border border-white/15 text-mist hover:border-white/35 hover:bg-white/5';

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.03 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={`${base} ${styles} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </motion.button>
  );
}
