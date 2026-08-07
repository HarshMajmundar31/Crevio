import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
  color?: string;
}

export default function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">No recent activity yet.</p>;
  }

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08, duration: 0.3 }}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
        >
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
            item.color || 'bg-primary/10'
          )}>
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{item.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
          </div>
          <span className="text-[10px] text-muted-foreground/60 font-mono shrink-0 mt-1">{item.time}</span>
        </motion.div>
      ))}
    </div>
  );
}
