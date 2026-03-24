import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Users, Plus, Trash2, Mail, Lock, AlertCircle, CheckCircle2, UserCircle2, Search, RotateCcw, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { cn } from "../lib/utils";

interface Employee {
  id: number;
  email: string;
  is_setup_complete: boolean;
  name?: string;
  description?: string;
  current_workload: number;
  capacity?: number;
  skills?: string;
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false); // New state for accordion

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/employees");
      setEmployees(res.data);
    } catch {
      toast.error("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const toastId = toast.loading(`Inviting ${form.email}...`);
    try {
      await api.post("/employees", {
        email: form.email,
        password: form.password
      });
      toast.success(`Account created for ${form.email}`, { id: toastId });
      setForm({ email: "", password: "" });
      setIsFormOpen(false); // Automatically close form on success
      fetchEmployees();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to add employee";
      toast.error(msg, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteEmployee = (emp: Employee) => {
    const previousEmployees = [...employees];
    
    setEmployees(employees.filter(e => e.id !== emp.id));

    const timeoutId = setTimeout(async () => {
      try {
        await api.delete(`/employees/${emp.id}`);
      } catch (err: any) {
        toast.error(err.response?.data?.detail || "Failed to delete employee. Restoring...");
        setEmployees(previousEmployees);
      }
    }, 5000);

    toast(
      (t) => (
        <div className="flex items-center justify-between w-full gap-6">
          <div className="flex flex-col">
            <span className="font-bold text-foreground">Employee Deleted</span>
            <span className="text-xs text-muted-foreground">{emp.email} removed</span>
          </div>
          <button
            onClick={() => {
              clearTimeout(timeoutId);
              setEmployees(previousEmployees);
              toast.dismiss(t.id);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg font-bold text-sm transition-colors"
          >
            <RotateCcw size={14} /> Undo
          </button>
        </div>
      ),
      { duration: 5000, id: `delete-${emp.id}` }
    );
  };

  const filteredEmployees = employees.filter(emp => {
    const q = searchQuery.toLowerCase();
    return emp.email.toLowerCase().includes(q) || (emp.name && emp.name.toLowerCase().includes(q));
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-sm">
            <Users size={28} />
          </div>
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl md:text-4xl font-black tracking-tight text-foreground"
            >
              Employee Directory
            </motion.h1>
            <p className="text-muted-foreground font-medium text-lg mt-1">Manage your team members and review their workloads.</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-12 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition font-semibold shadow-sm"
          />
        </div>
      </div>

      {/* Expandable Add Form */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-[2rem] border border-border shadow-sm bg-card overflow-hidden"
      >
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="w-full p-6 sm:p-8 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
        >
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <UserCircle2 className="text-primary" size={24} />
              Invite New Employee
            </h2>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              Create credentials for a new employee. They will complete their profile upon first login.
            </p>
          </div>
          <motion.div
            animate={{ rotate: isFormOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 ml-4 border border-primary/20"
          >
            <ChevronDown size={20} className="stroke-[2.5]" />
          </motion.div>
        </button>
        
        <AnimatePresence initial={false}>
          {isFormOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2">
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition font-semibold shadow-sm"
                        placeholder="employee@company.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Initial Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition font-semibold shadow-sm"
                        placeholder="temporary123"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !form.email || !form.password}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all w-full md:w-auto h-[52px] shadow-lg shadow-primary/20 hover:-translate-y-0.5"
                  >
                    <Plus size={20} />
                    {submitting ? "Inviting..." : "Send Invite"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Employee List */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-panel rounded-3xl p-6 h-56 animate-pulse bg-muted/20" />
            ))}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="glass-panel rounded-[2rem] border border-dashed p-12 text-center text-muted-foreground flex flex-col items-center">
            {searchQuery ? (
              <>
                <Search size={48} className="mb-4 text-muted-foreground/30" />
                <p className="font-bold text-xl text-foreground mb-1">No matches found</p>
                <p className="text-sm font-medium">No employees matched "{searchQuery}"</p>
              </>
            ) : (
              <>
                <Users size={48} className="mb-4 text-muted-foreground/30" />
                <p className="font-bold text-xl text-foreground mb-1">No employees added</p>
                <p className="text-sm font-medium">Use the form above to add your first team member.</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredEmployees.map((emp) => {
                let skillList: string[] = [];
                try {
                  skillList = emp.skills ? JSON.parse(emp.skills) : [];
                } catch {
                  skillList = [];
                }

                const capacity = emp.capacity || 0;
                const workloadPct = capacity > 0
                  ? Math.min(100, (emp.current_workload / capacity) * 100)
                  : 0;
                  
                const displayName = emp.name || emp.email.split('@')[0];

                return (
                  <motion.div
                    key={emp.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -4 }}
                    className="group glass-panel p-6 rounded-3xl transition-all relative flex flex-col h-full border border-border bg-card shadow-sm hover:shadow-lg hover:border-primary/30"
                  >
                    <button
                      onClick={() => deleteEmployee(emp)}
                      className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground p-2 rounded-xl transition-all z-10"
                      title="Delete employee"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="flex items-center gap-3 mb-2 pr-12">
                      <h3 className="text-xl font-black truncate text-foreground">{displayName}</h3>
                      {emp.is_setup_complete ? (
                        <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-muted-foreground text-sm font-medium mb-6 truncate">{emp.email}</p>

                    {!emp.is_setup_complete ? (
                      <div className="mt-auto h-[120px] flex flex-col items-center justify-center p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400">
                        <p className="font-bold text-center">Pending Registration</p>
                        <p className="text-xs text-center mt-2 max-w-[200px] leading-relaxed font-medium">Waiting for employee to login and upload their resume.</p>
                      </div>
                    ) : (
                      <div className="mt-auto">
                        <div className="mb-6 bg-background p-4 rounded-2xl border border-border">
                          <div className="flex justify-between text-[10px] font-black text-muted-foreground mb-3 uppercase tracking-widest">
                            <span>Capacity Usage</span>
                            <span className={cn(
                              workloadPct > 85 ? "text-destructive" :
                              workloadPct > 60 ? "text-amber-500" :
                              "text-emerald-500"
                            )}>{emp.current_workload.toFixed(1)} / {capacity} hrs</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden border border-border/50">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-1000 ease-out",
                                workloadPct > 85 ? "bg-destructive" :
                                workloadPct > 60 ? "bg-amber-500" :
                                "bg-emerald-500"
                              )}
                              style={{ width: `${workloadPct}%` }}
                            />
                          </div>
                        </div>

                        {skillList.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Extracted Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {skillList.slice(0, 5).map((skill, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md border border-primary/20"
                                >
                                  {skill}
                                </span>
                              ))}
                              {skillList.length > 5 && (
                                <span className="px-2.5 py-1 bg-muted text-foreground text-xs font-bold rounded-md border border-border">
                                  +{skillList.length - 5}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}