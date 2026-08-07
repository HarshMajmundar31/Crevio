import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Mail, UserPlus, Trash2, ArrowLeft, ArrowRight, UserCircle, Loader2, Award, Shield, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { inviteTeamMembers } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Step5Props {
  onNext: () => void;
  onBack: () => void;
}

interface Invitee {
  id: string;
  email: string;
  role: 'admin' | 'member' | 'finance' | string;
}

export default function Step5_InviteTeam({ onNext, onBack }: Step5Props) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitees, setInvitees] = useState<Invitee[]>(() => {
    const draftTeam = user?.onboardingDraft?.team || [];
    return draftTeam.map((item: any) => ({
      id: item.id || Math.random().toString(),
      email: item.email,
      role: item.role,
    }));
  });
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('member');

  const addInvitee = () => {
    if (!newEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to invite.",
        variant: "destructive"
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast({
        title: "Invalid Email Format",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    if (invitees.some(i => i.email.toLowerCase() === newEmail.toLowerCase())) {
      toast({
        title: "Already Added",
        description: "This email has already been added to the invite list.",
        variant: "destructive"
      });
      return;
    }

    setInvitees([...invitees, { id: Math.random().toString(), email: newEmail.toLowerCase(), role: newRole }]);
    setNewEmail('');
  };

  const removeInvitee = (id: string) => {
    setInvitees(invitees.filter(i => i.id !== id));
  };

  const handleNext = async () => {
    setIsSubmitting(true);
    try {
      // Save draft even if empty, to sync back with backend onboardingDraft
      await inviteTeamMembers({
        invitees: invitees.map(i => ({ email: i.email, role: i.role }))
      });
      
      // Update global context so Step 6 reads fresh team draft details if needed
      await refreshUser();
      
      onNext();
    } catch (error) {
      toast({
        title: "Failed to Save Team Draft",
        description: error instanceof Error ? error.message : "Failed to record invitations draft",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleIconAndBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          icon: <Shield className="w-3.5 h-3.5 text-violet-500" />,
          classes: 'bg-violet-500/10 text-violet-500 border-violet-500/20'
        };
      case 'finance':
        return {
          icon: <DollarSign className="w-3.5 h-3.5 text-amber-500" />,
          classes: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
        };
      default:
        return {
          icon: <UserCircle className="w-3.5 h-3.5 text-indigo-500" />,
          classes: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
        };
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 animate-pulse-soft">
          <UserPlus className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Invite Your Team</h2>
        <p className="text-muted-foreground">Collaboration is key. Add your team members to manage campaigns together.</p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-end bg-muted/20 p-5 rounded-2xl border border-dashed hover:border-primary/40 transition-colors">
          <div className="flex-1 space-y-2 w-full">
            <Label className="text-sm font-semibold text-foreground">Colleague's Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="colleague@company.com" 
                className="pl-11 h-12 rounded-xl border focus-visible:ring-primary shadow-sm"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addInvitee();
                  }
                }}
              />
            </div>
          </div>
          <div className="w-full md:w-44 space-y-2">
            <Label className="text-sm font-semibold text-foreground">Platform Role</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="h-12 rounded-xl shadow-sm focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator (Admin)</SelectItem>
                <SelectItem value="member">Campaign Manager</SelectItem>
                <SelectItem value="finance">Finance/Billing Operator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            type="button" 
            onClick={addInvitee} 
            className="h-12 px-6 rounded-xl w-full md:w-auto font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:scale-[1.02]"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add To List
          </Button>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence initial={false}>
            {invitees.map((invitee) => {
              const badge = getRoleIconAndBadge(invitee.role);
              return (
                <motion.div
                  key={invitee.id}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between p-4 bg-background border rounded-2xl shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{invitee.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badge.classes}`}>
                          {badge.icon}
                          {invitee.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeInvitee(invitee.id)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl h-10 w-10 shrink-0 group-hover:opacity-100 opacity-80 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {invitees.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground italic border-2 border-dashed rounded-2xl bg-muted/5 flex flex-col items-center justify-center gap-2"
            >
              <UserCircle className="w-8 h-8 opacity-40 text-muted-foreground" />
              <div>
                <p className="font-semibold text-sm">No team members drafted yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">Inviting your co-workers is optional. You can safely skip this step.</p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex gap-4 pt-6 border-t">
          <Button variant="outline" onClick={onBack} className="flex-1 h-12 rounded-xl" disabled={isSubmitting}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={handleNext} 
            className="flex-1 h-12 gradient-primary shadow-glow-primary rounded-xl font-bold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {invitees.length > 0 ? 'Send Invites & Continue' : 'Skip for Now'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
