import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ContractStatusBadge from '@/components/ContractStatusBadge';
import ProgressRing from '@/components/ProgressRing';
import { mockDecisions, mockContracts } from '@/lib/mock-data';
import { Shield, CheckCircle2, Activity, Cpu } from 'lucide-react';

export default function Decisions() {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Decision Engine</h1>
          <p className="text-sm text-muted-foreground mt-1">Automated contract evaluation results</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted rounded-lg px-3 py-1.5">
          <Cpu className="w-3 h-3 text-accent" />
          Engine v2.1 — Active
        </div>
      </div>

      {/* Engine Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid md:grid-cols-4 gap-4 mb-8"
      >
        {[
          { label: 'Total Evaluations', value: '1', color: 'text-foreground' },
          { label: 'Success Rate', value: '100%', color: 'text-success' },
          { label: 'Avg. Confidence', value: '100%', color: 'text-accent' },
          { label: 'Avg. Processing', value: '0.8s', color: 'text-foreground' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-4 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </motion.div>

      <div className="space-y-5">
        {mockDecisions.map((decision, idx) => {
          const contract = mockContracts.find(c => c.id === decision.contractId);
          return (
            <motion.div
              key={decision.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card-elevated p-6"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl gradient-accent flex items-center justify-center shadow-glow-accent">
                    <Shield className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{contract?.campaignTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {contract?.brandName} <span className="text-accent">↔</span> {contract?.creatorName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ProgressRing value={decision.confidenceScore * 100} size={48} strokeWidth={4} />
                  <ContractStatusBadge status={decision.decision === 'success' ? 'completed' : 'disputed'} />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3 mb-5">
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Decision</p>
                  <p className="font-bold capitalize text-success mt-1">{decision.decision}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Confidence</p>
                  <p className="font-bold mt-1">{(decision.confidenceScore * 100).toFixed(0)}%</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Evaluated</p>
                  <p className="font-bold mt-1 font-mono text-sm">{decision.evaluatedAt}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Evaluation Trace</p>
                <div className="space-y-2">
                  {decision.reasons.map((r, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className="flex items-center gap-2.5 text-sm p-2 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="w-5 h-5 rounded-md bg-success/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-success" />
                      </div>
                      <span className="text-muted-foreground">{r}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
