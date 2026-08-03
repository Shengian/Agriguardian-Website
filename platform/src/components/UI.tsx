import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export function GlassCard({ children, className = '', delay = 0, style }: { children: ReactNode; className?: string; delay?: number; style?: React.CSSProperties }) {
  return (
    <motion.div
      className={`glass gradient-border ${className}`}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      {children}
    </motion.div>
  );
}

export function StatCard({ label, value, icon: Icon, delay = 0 }: { label: string; value: string | number; icon: React.ComponentType<{ size?: number }>; delay?: number }) {
  return (
    <GlassCard className="stat-card" delay={delay}>
      <h4>{label}</h4>
      <div className="value">{value}</div>
      <div className="icon-wrap"><Icon size={22} /></div>
    </GlassCard>
  );
}

export function CountUp({ value }: { value: number }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key={value}
    >
      {value}
    </motion.span>
  );
}

export function PageLoader() {
  return (
    <div className="page-loader">
      <div className="spinner" />
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}>
      <motion.div className="glass modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </motion.div>
    </motion.div>
  );
}

export function ProgressRing({ progress, size = 80 }: { progress: number; size?: number }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="url(#goldGrad)" strokeWidth={stroke}
        strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E8C547" />
          <stop offset="100%" stopColor="#C9A227" />
        </linearGradient>
      </defs>
    </svg>
  );
}
