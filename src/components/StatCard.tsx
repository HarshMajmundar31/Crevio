import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import { cn } from '@/lib/utils';

export interface StatCardTrend {
  value: string;
  positive?: boolean;
}

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  trend?: string | StatCardTrend;
  trendUp?: boolean;
  subtitle?: string;
  className?: string;
  delay?: number;
  accentColor?: string;
}

export default function StatCard({ 
  title, 
  value, 
  prefix, 
  suffix, 
  icon: Icon, 
  trend, 
  trendUp, 
  subtitle,
  className, 
  delay = 0, 
  accentColor 
}: StatCardProps) {
  // Normalize trend object vs string
  const trendText = typeof trend === 'object' && trend !== null ? trend.value : trend;
  const isPositive = typeof trend === 'object' && trend !== null 
    ? (trend.positive ?? trendUp ?? true) 
    : (trendUp ?? true);

  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0;
  const displayString = typeof value === 'string' && isNaN(Number(value)) ? value : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={cn('glass-card-elevated p-5 group hover:shadow-lg transition-shadow duration-300', className)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {displayString ? (
              <span>{displayString}</span>
            ) : (
              <AnimatedCounter value={numericValue} prefix={prefix} suffix={suffix} />
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground font-medium">{subtitle}</p>
          )}
          {trendText && (
            <div className={cn(
              'inline-flex items-center gap-1 mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full font-mono',
              isPositive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
            )}>
              <span>{isPositive ? '↑' : '↓'}</span> {trendText}
            </div>
          )}
        </div>
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110',
          accentColor || 'bg-primary/10 text-primary'
        )}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </motion.div>
  );
}
