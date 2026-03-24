import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { CheckCircle2, AlertCircle, RotateCw, Eye, ArrowLeft, BrainCircuit, Activity, Users, Target, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

interface AllocationResponse {
  status: string;
  selected_team?: TeamMember[];
  avg_similarity?: number;
  workload_std?: number;
  tasks_generated?: number;
  reason?: string;
}

export default function AllocatePage() {
  const { project_id } = useParams<{ project_id: string }>();

  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AllocationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    allocateTeam();
  }, [project_id]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const allocateTeam = async () => {
    setLoading(true);
    setLoadingStep(0);
    setError(null);
    setResult(null);
    try {
      const res = await api.post(`/projects/${project_id}/allocate`);
      setResult(res.data);
    } catch (err: any) {
      console.error("Allocation failed:", err);
      setError(err.response?.data?.detail || "Failed to allocate team");
    } finally {
      setLoading(false);
    }
  };

  const loadingMessages = [
    { text: "Initializing semantic search...", icon: <BrainCircuit className="w-6 h-6" /> },
    { text: "Analyzing project requirements...", icon: <Target className="w-6 h-6" /> },
    { text: "Extracting skills matrix...", icon: <Activity className="w-6 h-6" /> },
    { text: "Optimizing workload balance...", icon: <Users className="w-6 h-6" /> },
    { text: "Finalizing allocations...", icon: <CheckCircle2 className="w-6 h-6" /> }
  ];

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Magical Background Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse-slow"></div>
          <div className="w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[100px] absolute -top-20 -left-20 mix-blend-multiply dark:mix-blend-screen animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="glass-panel p-12 rounded-[3rem] flex flex-col items-center justify-center relative z-10 w-full max-w-lg border border-primary/20 shadow-2xl shadow-primary/10">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full border-4 border-muted border-t-primary animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BrainCircuit className="w-10 h-10 text-primary animate-pulse" />
            </div>
          </div>
          
          <h2 className="text-3xl font-black mb-8 bg-gradient-to-r from-primary to-fuchsia-500 bg-clip-text text-transparent">
            AI is mapping your team...
          </h2>
          
          <div className="h-16 relative w-full flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={loadingStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute flex items-center gap-3 text-foreground font-bold text-lg"
              >
                <span className="text-primary">{loadingMessages[Math.min(loadingStep, loadingMessages.length - 1)].icon}</span>
                {loadingMessages[Math.min(loadingStep, loadingMessages.length - 1)].text}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="w-full bg-muted h-2 rounded-full mt-6 overflow-hidden border border-border/50">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-fuchsia-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${(loadingStep / 4) * 100}%` }}
              transition={{ duration: 0.5 }}
            ></motion.div>
          </div>
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
        <h2 className="text-3xl font-black mb-4">Allocation Failed</h2>
        <p className="text-muted-foreground max-w-lg mb-8 text-lg font-medium">{error}</p>
        <div className="flex gap-4">
          <button onClick={() => allocateTeam()} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg hover:-translate-y-0.5">
            Try Again
          </button>
          <Link to="/projects" className="bg-card hover:bg-muted text-foreground px-8 py-3.5 rounded-xl font-bold transition-colors border border-border shadow-sm">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  if (!result || result.status !== "success") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <AlertCircle size={48} className="text-amber-500 mb-6" />
        <h2 className="text-2xl font-bold mb-4">Unexpected Result</h2>
        <pre className="bg-muted p-6 rounded-2xl text-sm max-w-2xl w-full overflow-auto border border-border shadow-inner">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link to="/projects" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold text-sm mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Projects
          </Link>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-sm">
              <CheckCircle2 size={32} className="stroke-[2.5]" />
            </div>
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl md:text-5xl font-black tracking-tight text-foreground"
              >
                Allocation Complete
              </motion.h1>
              <p className="text-muted-foreground font-medium text-lg mt-1">
                Successfully formed a team for Project #{project_id}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => allocateTeam()} className="bg-card hover:bg-muted text-foreground px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors border border-border shadow-sm">
            <RotateCw size={18} /> Re-roll
          </button>
          <Link to={`/projects/${project_id}/team`} className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5">
            <Eye size={18} /> View Team
          </Link>
        </div>
      </div>

      {/* Metrics Bento Box */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="glass-panel p-8 rounded-[2rem] border border-border/50 flex flex-col justify-center bg-card">
          <div className="flex items-center gap-3 mb-4 text-primary">
            <Target size={24} className="stroke-[2.5]" />
            <h3 className="text-lg font-black uppercase tracking-widest text-muted-foreground">Avg Similarity</h3>
          </div>
          <p className="text-5xl font-black text-foreground">{result.avg_similarity?.toFixed(3)}</p>
          <p className="text-sm text-muted-foreground mt-2 font-medium">Semantic skill match score</p>
        </div>
        
        <div className="glass-panel p-8 rounded-[2rem] border border-border/50 flex flex-col justify-center bg-card">
          <div className="flex items-center gap-3 mb-4 text-emerald-500">
            <Activity size={24} className="stroke-[2.5]" />
            <h3 className="text-lg font-black uppercase tracking-widest text-muted-foreground">Workload Std Dev</h3>
          </div>
          <p className="text-5xl font-black text-foreground">{result.workload_std?.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground mt-2 font-medium">Variance in team hours</p>
        </div>
        
        <div className="glass-panel p-8 rounded-[2rem] border border-border/50 flex flex-col justify-center bg-card">
          <div className="flex items-center gap-3 mb-4 text-fuchsia-500">
            <BrainCircuit size={24} className="stroke-[2.5]" />
            <h3 className="text-lg font-black uppercase tracking-widest text-muted-foreground">Tasks Generated</h3>
          </div>
          <p className="text-5xl font-black text-foreground">{result.tasks_generated}</p>
          <p className="text-sm text-muted-foreground mt-2 font-medium">Unique roles created</p>
        </div>
      </motion.div>

      {/* Team Breakdown Snapshot */}
      <div>
        <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-foreground">
          <Users className="text-primary" /> Deployed Members
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {result.selected_team?.map((member, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              whileHover={{ y: -4 }}
              className="group glass-panel rounded-[2rem] p-8 border border-border hover:border-primary/40 transition-all shadow-sm flex flex-col h-full bg-card"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-foreground mb-2">{member.employee_name}</h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-bold text-foreground">
                    <Briefcase size={14} /> {member.role}
                  </span>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1.5">Match</span>
                  <span className={cn(
                    "flex items-center justify-center px-3 py-1.5 rounded-xl font-black text-sm border",
                    member.similarity > 0.7 
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-primary/10 text-primary border-primary/20"
                  )}>
                    {Math.round(member.similarity * 100)}%
                  </span>
                </div>
              </div>

              <p className="text-muted-foreground font-medium text-sm leading-relaxed mb-8 flex-grow line-clamp-4">
                {member.task_description}
              </p>

              <div className="space-y-4 mt-auto border-t border-border/50 pt-5">
                {member.matched_skills && member.matched_skills.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-black tracking-widest uppercase mb-2">
                      <CheckCircle2 size={14} /> Matched
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {member.matched_skills.slice(0, 3).map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-md border border-emerald-500/20">
                          {s}
                        </span>
                      ))}
                      {member.matched_skills.length > 3 && (
                        <span className="px-2.5 py-1 bg-muted text-foreground text-xs font-bold rounded-md border border-border">
                          +{member.matched_skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}