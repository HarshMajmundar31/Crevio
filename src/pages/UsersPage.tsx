import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { getUsers, type ApiDirectoryUser } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const roleColors: Record<string, string> = {
  brand: 'bg-primary/10 text-primary border-primary/20',
  creator: 'bg-accent/10 text-accent border-accent/20',
  admin: 'bg-warning/10 text-warning border-warning/20',
};

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<ApiDirectoryUser[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const result = await getUsers();
        setUsers(result.users || []);
      } catch (error) {
        toast({
          title: 'Failed to load users',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      }
    };

    void loadUsers();
  }, [toast]);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} registered users</p>
        </div>
        <Button className="gradient-primary text-primary-foreground font-medium text-xs">+ Add User</Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-elevated overflow-hidden"
      >
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-4">User</th>
              <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-4">Email</th>
              <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-4">Role</th>
              <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-4">Status</th>
              <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {users.map((u, i) => (
              <motion.tr
                key={u.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="hover:bg-muted/20 transition-colors group"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground ring-2 ring-border/30">
                      {u.full_name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm font-medium">{u.full_name}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-muted-foreground font-mono text-xs">{u.email}</td>
                <td className="p-4">
                  <Badge variant="outline" className={`capitalize text-[10px] font-medium ${roleColors[u.role]}`}>
                    {u.role}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="icon" className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </DashboardLayout>
  );
}
