import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { Users, CheckCircle2, AlertCircle, ArrowLeft, Briefcase, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

interface TeamMember {
  employee_id: number;
  employee_name: string;
  role: string;
  task_description: string;
  similarity: number;
  workload_after: number;
  matched_skills: string[];
  missing_skills: string[];
}

export default function ProjectTeam() {
  const { project_id } = useParams<{ project_id: string }>();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { 
    if (project_id) fetchTeam(); 
  }, [project_id]);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${project_id}/team`);
      setTeam(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load team");
    } finally { 
      setLoading(false); 
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        <div className="h-10 w-32 bg-muted/50 animate-pulse rounded-xl mb-10"></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-panel rounded-3xl p-6 h-80 animate-pulse bg-muted/20" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-2xl flex items-center justify-center mb-6 text-destructive border border-destructive/20 shadow-sm">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-3xl font-black mb-4">Failed to load team</h2>
        <p className="text-muted-foreground mb-8 text-lg font-medium">{error}</p>
        <Link to="/projects" className="bg-card hover:bg-muted text-foreground px-8 py-3.5 rounded-xl font-bold transition-colors border border-border shadow-sm">
          Return to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">
      {/* Header and Navigation */}
      <div>
        <Link to="/projects" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Projects
        </Link>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-sm">
            <Users size={32} />
          </div>
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl md:text-5xl font-black tracking-tight text-foreground"
            >
              Deployed Team
            </motion.h1>
            <p className="text-muted-foreground font-bold text-lg mt-1 flex items-center gap-2">
              Project #{project_id} <ChevronRight size={14} className="opacity-50" /> {team.length} Members
            </p>
          </div>
        </div>
      </div>

      {team.length === 0 ? (
        <div className="glass-panel rounded-[3rem] border border-dashed border-border p-16 text-center flex flex-col items-center bg-card">
          <Users size={48} className="text-muted-foreground/30 mb-6" />
          <h2 className="text-2xl font-black mb-2 text-foreground">No active team members</h2>
          <p className="text-muted-foreground font-medium text-lg">This project might have been created without an allocation.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((m, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="group glass-panel rounded-[2rem] p-8 border border-border hover:border-primary/40 transition-all shadow-sm flex flex-col h-full bg-card"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-foreground mb-2">{m.employee_name}</h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-bold text-foreground">
                    <Briefcase size={14} /> {m.role}
                  </span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1.5">Match</span>
                  <span className={cn(
                    "flex items-center justify-center px-3 py-1.5 rounded-xl font-black text-sm border",
                    m.similarity > 0.7 
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-primary/10 text-primary border-primary/20"
                  )}>
                    {Math.round(m.similarity * 100)}%
                  </span>
                </div>
              </div>
              
              <p className="text-muted-foreground font-medium text-sm leading-relaxed mb-8 flex-grow">
                {m.task_description}
              </p>

              <div className="space-y-5 mt-auto border-t border-border/50 pt-6">
                {m.matched_skills.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-black tracking-widest uppercase mb-2">
                      <CheckCircle2 size={14} /> Matched Skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {m.matched_skills.map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-md border border-emerald-500/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {m.missing_skills.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-destructive text-[10px] font-black tracking-widest uppercase mb-2">
                      <AlertCircle size={14} /> Missing Skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {m.missing_skills.map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-destructive/10 text-destructive text-xs font-bold rounded-md border border-destructive/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 flex items-end justify-between border-t border-border/50">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Resulting Workload</p>
                  <p className="text-lg font-black text-foreground">{m.workload_after.toFixed(1)} <span className="text-xs font-bold text-muted-foreground ml-1">hrs/wk</span></p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}