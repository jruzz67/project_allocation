import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { CheckCircle2, Briefcase, Clock, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface TaskAssignment {
  project_name: string;
  role: string;
  task_description: string;
  workload_allocated: number;
  matched_skills: string[];
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get("/me/tasks");
      setTasks(res.data);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const totalLoad = tasks.reduce((sum, t) => sum + t.workload_allocated, 0);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
            <span className="text-3xl font-black">{user?.name?.charAt(0) || "E"}</span>
          </div>
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl md:text-4xl font-extrabold tracking-tight"
            >
              Welcome back, {user?.name?.split(' ')[0] || "Employee"}!
            </motion.h1>
            <p className="text-muted-foreground font-medium text-lg">Here are your active assignments.</p>
          </div>
        </div>

        {/* Load Summary Pill */}
        {!loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 bg-card border border-border px-5 py-3 rounded-2xl shadow-sm"
          >
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Clock size={20} className="stroke-[3]" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Allocated</p>
              <p className="text-xl font-extrabold">{totalLoad.toFixed(1)} <span className="text-muted-foreground text-base font-medium">hrs/week</span></p>
            </div>
          </motion.div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Briefcase size={20} className="stroke-[3]" />
          </div>
          <h2 className="text-xl font-bold">Your Task Board</h2>
          <span className="ml-2 bg-muted text-muted-foreground text-xs font-bold px-2.5 py-1 rounded-full">{tasks.length}</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-panel rounded-3xl p-6 h-64 animate-pulse bg-muted/20" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-12 text-center rounded-3xl flex flex-col items-center border border-dashed border-border"
          >
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mb-6">
              <CheckCircle2 size={40} className="stroke-[3]" />
            </div>
            <h2 className="text-2xl font-bold mb-3">You're all caught up!</h2>
            <p className="text-muted-foreground text-lg max-w-md">You currently have no tasks assigned to you. Enjoy your free time or reach out to your manager for new opportunities.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="group glass-panel p-8 rounded-3xl border border-border/50 hover:border-border transition-all shadow-sm flex flex-col h-full bg-card/50"
              >
                <div className="flex justify-between items-start mb-5">
                  <span className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow-sm">
                    {task.role}
                  </span>
                  <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                    <Zap size={14} className="fill-current" />
                    <span className="text-sm font-bold">
                      {task.workload_allocated}h
                    </span>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-3 leading-tight text-foreground">
                  {task.project_name}
                </h3>
                
                <p className="text-muted-foreground text-sm mb-8 flex-grow leading-relaxed">
                  {task.task_description}
                </p>
                
                {task.matched_skills.length > 0 && (
                  <div className="mt-auto pt-6 border-t border-border/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Matched Skills</p>
                    <div className="flex gap-2 flex-wrap">
                      {task.matched_skills.slice(0, 4).map((skill, si) => (
                        <span
                          key={si}
                          className="px-2.5 py-1 bg-muted/50 text-foreground text-xs font-semibold rounded-md border border-border"
                        >
                          {skill}
                        </span>
                      ))}
                      {task.matched_skills.length > 4 && (
                        <span className="px-2.5 py-1 text-muted-foreground text-xs font-semibold bg-muted rounded-md line-clamp-1 border border-transparent">
                          +{task.matched_skills.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
