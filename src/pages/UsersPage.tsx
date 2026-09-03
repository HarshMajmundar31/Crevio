import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { 
  apiAdminGetUsers, 
  apiAdminCreateUser, 
  apiAdminUpdateUser, 
  apiAdminAdjustUserBalance, 
  apiAdminDeleteUser, 
  AdminUserItem 
} from '@/lib/api';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  DollarSign, 
  Users as UsersIcon, 
  X, 
  RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';

const roleColors: Record<string, string> = {
  brand: 'bg-primary/10 text-primary border-primary/20',
  creator: 'bg-accent/10 text-accent border-accent/20',
  admin: 'bg-warning/10 text-warning border-warning/20',
};

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [adjustingUser, setAdjustingUser] = useState<AdminUserItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    role: 'creator',
    initial_balance: 10000
  });

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const res = await apiAdminGetUsers();
      setUsers(res.users || []);
    } catch (err: any) {
      toast.error('Failed to load users: ' + (err?.message || 'Server error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiAdminCreateUser(form);
      if (res.success) {
        toast.success(`User ${form.full_name} created successfully!`);
        setShowAddModal(false);
        setForm({ full_name: '', email: '', role: 'creator', initial_balance: 10000 });
        loadUsers();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await apiAdminUpdateUser(editingUser.id, editingUser);
      if (res.success) {
        toast.success(`User ${editingUser.full_name} updated.`);
        setEditingUser(null);
        loadUsers();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update user');
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser) return;
    const num = parseFloat(adjustAmount);
    if (isNaN(num)) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      const res = await apiAdminAdjustUserBalance(adjustingUser.id, num, adjustReason);
      if (res.success) {
        toast.success(`Wallet balance updated for ${adjustingUser.full_name}`);
        setAdjustingUser(null);
        setAdjustAmount('');
        setAdjustReason('');
        loadUsers();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to adjust balance');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user ${name}? This action cannot be undone.`)) return;
    try {
      const res = await apiAdminDeleteUser(id);
      if (res.success) {
        toast.success(`User ${name} deleted.`);
        setUsers(prev => prev.filter(u => u.id !== id));
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchQuery ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Users Directory
            <UsersIcon className="w-5 h-5 text-accent" />
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{users.length} registered accounts across the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadUsers} 
            className="p-2 text-muted-foreground hover:text-foreground bg-muted rounded-lg"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Button 
            onClick={() => setShowAddModal(true)} 
            className="gradient-primary text-primary-foreground font-medium text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users by name, email, or ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-muted/40 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-accent"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="bg-muted/40 border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground focus:outline-none focus:border-accent"
        >
          <option value="all">All Roles</option>
          <option value="creator">Creators</option>
          <option value="brand">Brands</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-elevated overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b bg-muted/30 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Wallet Balance</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {isLoading ? 'Loading users...' : 'No users found matching your filters.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-muted/20 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground ring-1 ring-border/30 shrink-0">
                          {u.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground block">{u.full_name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{u.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground font-mono text-xs">{u.email}</td>
                    <td className="p-4">
                      <Badge variant="outline" className={`capitalize text-[10px] font-medium ${roleColors[u.role]}`}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-4 font-bold text-foreground">
                      ₹{Number(u.available_balance || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
                        <span className="text-xs text-muted-foreground">{u.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setAdjustingUser(u)}
                          title="Adjust Balance"
                          className="p-1 hover:bg-muted text-muted-foreground hover:text-success rounded"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingUser(u)}
                          title="Edit User"
                          className="p-1 hover:bg-muted text-muted-foreground hover:text-accent rounded"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.full_name)}
                          title="Delete User"
                          className="p-1 hover:bg-muted text-muted-foreground hover:text-destructive rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card-elevated p-6 w-full max-w-md space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Plus className="w-4 h-4 text-accent" />
                  Add New User
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="User Name"
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">Role</label>
                    <select
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    >
                      <option value="creator">Creator</option>
                      <option value="brand">Brand</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">Initial Balance (INR)</label>
                    <input
                      type="number"
                      value={form.initial_balance}
                      onChange={e => setForm({ ...form, initial_balance: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
                <div className="border-t border-border pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-accent hover:bg-accent/80 text-accent-foreground font-bold rounded-lg shadow-glow-accent">Create User</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card-elevated p-6 w-full max-w-md space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-accent" />
                  Edit User
                </h3>
                <button onClick={() => setEditingUser(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingUser.full_name}
                    onChange={e => setEditingUser({ ...editingUser, full_name: e.target.value })}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Email</label>
                  <input
                    type="email"
                    required
                    value={editingUser.email}
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">Role</label>
                    <select
                      value={editingUser.role}
                      onChange={e => setEditingUser({ ...editingUser, role: e.target.value as any })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    >
                      <option value="creator">Creator</option>
                      <option value="brand">Brand</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold uppercase text-[10px] text-muted-foreground">Status</label>
                    <select
                      value={editingUser.is_active ? 'active' : 'inactive'}
                      onChange={e => setEditingUser({ ...editingUser, is_active: e.target.value === 'active' })}
                      className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="border-t border-border pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-accent hover:bg-accent/80 text-accent-foreground font-bold rounded-lg shadow-glow-accent">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Adjust Balance Modal */}
      <AnimatePresence>
        {adjustingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-card-elevated p-6 w-full max-w-md space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-success" />
                  Adjust Balance: {adjustingUser.full_name}
                </h3>
                <button onClick={() => setAdjustingUser(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAdjustBalance} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Adjustment Amount (INR)</label>
                  <p className="text-[10px] text-muted-foreground mb-1">Enter positive (+5000) to credit or negative (-2000) to debit.</p>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="+5000 or -2000"
                    value={adjustAmount}
                    onChange={e => setAdjustAmount(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="font-bold uppercase text-[10px] text-muted-foreground">Reason / Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Test credit or adjustment"
                    value={adjustReason}
                    onChange={e => setAdjustReason(e.target.value)}
                    className="w-full mt-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="border-t border-border pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setAdjustingUser(null)} className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-success hover:bg-success/80 text-success-foreground font-bold rounded-lg shadow-glow-success">Confirm</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

