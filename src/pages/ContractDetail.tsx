import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ContractStatusBadge from '@/components/ContractStatusBadge';
import ProgressRing from '@/components/ProgressRing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Lock, Unlock, CheckCircle2, XCircle, Clock, AlertTriangle, Shield, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  acceptContract,
  executeContract,
  getContractDetail,
  getContractDossier,
  lockContract,
  updateDeliverableStatus,
  apiCreateRazorpayOrder,
  apiVerifyRazorpayPayment,
  apiGetWallet,
  apiFundContractWithWallet,
  type ApiContract,
  type ApiDecision,
  type ApiDeliverable,
  type ApiRule,
  type ApiWallet,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function ContractDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [contract, setContract] = useState<ApiContract | null>(null);
  const [deliverables, setDeliverables] = useState<ApiDeliverable[]>([]);
  const [rules, setRules] = useState<ApiRule[]>([]);
  const [decision, setDecision] = useState<ApiDecision | null>(null);
  const [dossier, setDossier] = useState<any>(null);
  const [busyAction, setBusyAction] = useState('');
  const [finalSubmissionUrl, setFinalSubmissionUrl] = useState('');
  const [wallet, setWallet] = useState<ApiWallet | null>(null);

  const refresh = async () => {
    if (!id) return;
    const result = await getContractDetail(id);
    setContract(result.contract);
    setDeliverables(result.deliverables);
    setRules(result.rules);
    setDecision(result.decisions[0] || null);

    if (user?.role === 'brand' || user?.role === 'admin') {
      try {
        const walletPayload = await apiGetWallet();
        setWallet(walletPayload.wallet);
      } catch (e) {
        console.error("Failed to load wallet", e);
      }
    }

    if (user?.role === 'admin') {
      try {
        const dossierPayload = await getContractDossier(id);
        setDossier(dossierPayload);
      } catch {
        setDossier(null);
      }
    }
  };

  useEffect(() => {
    refresh().catch((error) => {
      toast({
        title: 'Failed to load contract',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    });
  }, [id, user?.role]);

  const verifiedCount = useMemo(() => deliverables.filter((d) => d.status === 'verified').length, [deliverables]);

  if (!contract) {
    return <DashboardLayout><p>Contract not found.</p></DashboardLayout>;
  }

  const isCreator = user?.role === 'creator';
  const isBrand = user?.role === 'brand';

  const runAction = async (name: string, action: () => Promise<void>) => {
    setBusyAction(name);
    try {
      await action();
      await refresh();
    } catch (error) {
      toast({
        title: 'Action failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setBusyAction('');
    }
  };

  const handleWalletEscrow = async () => {
    if (!contract) return;
    setBusyAction('wallet');
    try {
      const res = await apiFundContractWithWallet(contract.id);
      if (res.success) {
        toast({
          title: '🎉 Escrow Secured via Wallet Balance!',
          description: `Successfully escrowed ₹${Number(contract.payment_amount).toLocaleString()} from your available wallet balance.`,
        });
        await refresh();
      }
    } catch (err: any) {
      toast({
        title: 'Wallet Funding Failed',
        description: err?.message || 'Failed to complete wallet escrow payment.',
        variant: 'destructive',
      });
    } finally {
      setBusyAction('');
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayEscrow = async () => {
    setBusyAction('razorpay');
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast({
          title: 'Payment Gateway Error',
          description: 'Failed to load Razorpay payment overlay. Please check your internet connection.',
          variant: 'destructive',
        });
        return;
      }

      // 1. Fetch Order ID from backend
      const res = await apiCreateRazorpayOrder(contract.id);

      // 2. Open Razorpay Pop-Up Modal
      const options = {
        key: res.keyId,
        amount: res.amount,
        currency: res.currency,
        name: 'Crevio Escrow Vault',
        description: `Secure Escrow Deposit for Campaign Contract`,
        order_id: res.orderId,
        handler: async (response: any) => {
          setBusyAction('verify');
          try {
            // 3. Cryptographically Verify Signature on backend
            await apiVerifyRazorpayPayment(contract.id, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            });
            toast({
              title: '🔒 Escrow Locked',
              description: 'Payment authorized successfully! Funds are now securely held in escrow.'
            });
            await refresh();
          } catch (err: any) {
            toast({
              title: 'Verification Failed',
              description: err?.message || 'Failed to securely verify payment signature.',
              variant: 'destructive',
            });
          } finally {
            setBusyAction('');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email
        },
        theme: {
          color: '#6366f1' // Matches primary theme color
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast({
        title: 'Order Generation Failed',
        description: err?.message || 'Could not initialize payment order. Try again.',
        variant: 'destructive',
      });
    } finally {
      setBusyAction('');
    }
  };

  return (
    <DashboardLayout>
      <Link to="/contracts" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 font-medium">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Contracts
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card-elevated p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shrink-0">
              {contract.status === 'locked' ? <Lock className="w-5 h-5 text-primary-foreground" /> : <Shield className="w-5 h-5 text-primary-foreground" />}
            </div>
            <div>
              <h1 className="text-xl font-bold">{contract.campaign_id}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {contract.brand_name} <span className="text-accent">&lt;-&gt;</span> {contract.creator_name}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground mt-2">{contract.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ContractStatusBadge status={contract.status} />
            {contract.status === 'locked' && (
              <div className="flex items-center gap-1.5 text-[10px] text-accent font-semibold bg-accent/10 rounded-full px-2.5 py-1">
                <Lock className="w-3 h-3" /> Immutable
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Payment</p>
            <p className="text-xl font-bold mt-0.5">${Number(contract.payment_amount).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Created</p>
            <p className="text-sm font-medium mt-1 font-mono">{String(contract.created_at).slice(0, 10)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Locked</p>
            <p className="text-sm font-medium mt-1 font-mono">{contract.locked_at ? String(contract.locked_at).slice(0, 10) : '-'}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Executed</p>
            <p className="text-sm font-medium mt-1 font-mono">{contract.executed_at ? String(contract.executed_at).slice(0, 10) : '-'}</p>
          </div>
          <div className="flex justify-end">
            <ProgressRing value={verifiedCount} max={deliverables.length || 1} size={60} strokeWidth={5} label="Verified" />
          </div>
        </div>

        <div className="mt-6 rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
          Managed workflow: brand uploads signed contract paper {'->'} creator e-signs {'->'} creator uploads final signed proof {'->'} contract locks {'->'} creator starts deliverable tasks.
        </div>

        {contract.status === 'pending' && isCreator && (
          <div className="mt-6 pt-6 border-t flex gap-3">
            <Button
              className="gradient-accent text-accent-foreground font-medium"
              onClick={() => runAction('accept', async () => {
                await acceptContract(contract.id);
                toast({ title: 'Creator E-Sign Complete', description: 'Contract moved to creator-signed stage.' });
              })}
              disabled={busyAction === 'accept'}
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" /> E-Sign & Accept Contract
            </Button>
          </div>
        )}

        {contract.status === 'accepted' && isBrand && (
          <div className="mt-6 pt-6 border-t bg-accent/5 p-6 rounded-xl border border-accent/20 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <h3 className="font-bold text-sm flex items-center gap-1.5 text-accent">
                  <Lock className="w-4 h-4 text-accent animate-pulse-soft" /> Escrow Deposit Required
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  To secure this contract and allow {contract.creator_name} to safely begin creating content, you must deposit the campaign funds into Crevio's secure Escrow Vault. You can fund this contract instantly using your Available Wallet Balance or complete a test Sandbox payment via Razorpay.
                </p>
                <div className="text-xs mt-2 bg-background/50 inline-block px-3 py-1.5 rounded-lg border border-border/50 text-foreground">
                  Your Available Wallet Balance: <span className="font-bold text-emerald-400">₹{Number(wallet?.available_balance || 0).toLocaleString()}</span> (Required: ₹{Number(contract.payment_amount).toLocaleString()})
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full md:w-auto">
                {Number(wallet?.available_balance || 0) >= Number(contract.payment_amount) ? (
                  <>
                    <Button
                      className="gradient-emerald text-white font-bold shadow-glow-emerald px-5 py-2.5 h-11 text-xs uppercase tracking-wider shrink-0"
                      onClick={handleWalletEscrow}
                      disabled={busyAction !== ''}
                    >
                      {busyAction === 'wallet' ? 'Funding via Wallet...' : 'Pay with Wallet Balance'}
                    </Button>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground underline transition-colors text-center"
                      onClick={handleRazorpayEscrow}
                      disabled={busyAction !== ''}
                    >
                      Or, Pay with Razorpay Gateway
                    </button>
                  </>
                ) : (
                  <>
                    <Button
                      className="gradient-accent text-accent-foreground font-semibold shadow-glow-accent px-5 py-2.5 h-11 shrink-0"
                      onClick={handleRazorpayEscrow}
                      disabled={busyAction !== ''}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {busyAction === 'razorpay' ? 'Generating Order...' : busyAction === 'verify' ? 'Verifying Payment...' : 'Fund Escrow with Razorpay'}
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Top up your wallet in the <Link to="/wallet" className="underline text-accent">Wallet Hub</Link> to pay via balance.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {contract.status === 'accepted' && isCreator && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Final step: upload your final signed proof URL. Once submitted, contract is locked and brand team is notified.
            </p>
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                value={finalSubmissionUrl}
                onChange={(event) => setFinalSubmissionUrl(event.target.value)}
                placeholder="https://drive.google.com/..."
              />
              <Button
                className="gradient-primary text-primary-foreground font-medium"
                onClick={() => runAction('lock', async () => {
                  await lockContract(contract.id, finalSubmissionUrl);
                  toast({ title: 'Contract Locked', description: 'Final signed submission stored and brand team notified.' });
                })}
                disabled={busyAction === 'lock' || !finalSubmissionUrl.trim()}
              >
                <Lock className="w-3.5 h-3.5 mr-1.5" /> Submit Final Signed Copy & Lock
              </Button>
            </div>
          </div>
        )}

        {contract.status === 'locked' && isBrand && (
          <div className="mt-6 pt-6 border-t">
            <Button
              className="gradient-primary text-primary-foreground font-medium"
              onClick={() => runAction('execute', async () => {
                const result = await executeContract(contract.id);
                toast({ title: 'Contract Executed', description: `Decision: ${result.decision}` });
              })}
              disabled={busyAction === 'execute'}
            >
              <Shield className="w-3.5 h-3.5 mr-1.5" /> Execute Contract
            </Button>
          </div>
        )}

        {contract.status === 'locked' && isCreator && (
          <div className="mt-6 pt-6 border-t bg-success/5 p-4 rounded-xl border border-success/20 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            <div className="text-xs text-muted-foreground">
              <span className="font-bold text-success block">🔒 Escrow Secured in Razorpay Sandbox</span>
              The Brand has successfully deposited the campaign budget into Crevio's secure Razorpay Escrow vault. Your payment is guaranteed and will release automatically to your available wallet balance upon successful deliverable verification!
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card-elevated p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-sm">Deliverables</h2>
            <span className="text-[10px] text-muted-foreground font-mono">{verifiedCount}/{deliverables.length} verified</span>
          </div>
          <div className="space-y-3">
            {deliverables.map((d) => (
              <div key={d.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/30">
                {d.status === 'verified' ? <CheckCircle2 className="w-5 h-5 text-success mt-0.5 shrink-0" /> : d.status === 'rejected' ? <XCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" /> : d.status === 'submitted' ? <Clock className="w-5 h-5 text-warning mt-0.5 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-muted-foreground/40 mt-0.5 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{d.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5 font-medium">{d.platform}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Due: {String(d.deadline).slice(0, 10)}</span>
                    <ContractStatusBadge status={d.status} />
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    {isCreator && d.status === 'pending' && ['locked', 'executed'].includes(contract.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runAction(`submit-${d.id}`, async () => {
                          await updateDeliverableStatus(contract.id, d.id, 'submitted', 'creator-submission');
                          toast({ title: 'Deliverable Submitted', description: 'Marked as submitted for verification.' });
                        })}
                        disabled={busyAction === `submit-${d.id}`}
                      >
                        Submit
                      </Button>
                    )}
                    {isBrand && d.status === 'submitted' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => runAction(`verify-${d.id}`, async () => {
                            await updateDeliverableStatus(contract.id, d.id, 'verified', 'ftc disclosure confirmed; compliant');
                            toast({ title: 'Deliverable Verified' });
                          })}
                          disabled={busyAction === `verify-${d.id}`}
                        >
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runAction(`reject-${d.id}`, async () => {
                            await updateDeliverableStatus(contract.id, d.id, 'rejected', 'rejected due to compliance mismatch');
                            toast({ title: 'Deliverable Rejected' });
                          })}
                          disabled={busyAction === `reject-${d.id}`}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card-elevated p-6">
            <h2 className="font-semibold text-sm mb-4">Contract Rules</h2>
            <div className="space-y-2">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/30">
                  {rule.passed === true ? (
                    <div className="w-6 h-6 rounded-lg bg-success/10 flex items-center justify-center shrink-0"><CheckCircle2 className="w-3.5 h-3.5 text-success" /></div>
                  ) : rule.passed === false ? (
                    <div className="w-6 h-6 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0"><XCircle className="w-3.5 h-3.5 text-destructive" /></div>
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center shrink-0"><div className="w-2.5 h-2.5 rounded-full border-2 border-muted-foreground/30" /></div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{rule.description}</p>
                    <p className="text-[10px] text-muted-foreground capitalize font-medium">{rule.rule_type} check</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {decision && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={cn('rounded-xl p-6 border', decision.decision === 'success' ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20')}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-glow-accent"><Shield className="w-5 h-5 text-accent-foreground" /></div>
                <div>
                  <h2 className="font-semibold text-sm">Decision Engine Result</h2>
                  <p className="text-[10px] text-muted-foreground font-mono">Evaluated: {String(decision.evaluated_at).slice(0, 10)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-card/50">
                <ContractStatusBadge status={decision.decision === 'success' ? 'completed' : 'disputed'} />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Confidence:</span>
                  <span className="text-sm font-bold text-success">{(Number(decision.confidence_score) * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                {(decision.reasons || []).map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                    <span className="text-muted-foreground">{(r as any).reason_text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {user?.role === 'admin' && dossier && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card-elevated p-6">
              <h2 className="font-semibold text-sm mb-3">Admin Dossier</h2>
              <p className="text-xs text-muted-foreground mb-2">Includes document terms, event trail, and decision history.</p>
              <pre className="text-[11px] overflow-auto max-h-56 bg-muted/50 p-3 rounded-lg">{JSON.stringify(dossier, null, 2)}</pre>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
