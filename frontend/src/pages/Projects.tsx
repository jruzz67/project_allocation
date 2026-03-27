import { useState, useEffect } from "react";
import { api, apiForm } from "../lib/api";
import { UploadZone } from "../components/ui/UploadZone";
import { FolderOpen, Plus, Play, Eye, RotateCw, Trash2, LayoutGrid, Search, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { cn } from "../lib/utils";

interface Project {
  id: number;
  description: string;
  required_team_size: number;
  project_load: number;
  status?: string;
}

function projectLabel(description: string, maxLen = 60): string {
  const firstLine = description.split(/\n/)[0].trim();
  const label = firstLine || description;
  return label.length > maxLen ? label.slice(0, maxLen) + "…" : label;
}

export default function Projects() {
  const navigate = useNavigate();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({ teamSize: 5, load: 10 });
  const [pdf, setPdf] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 6;

  useEffect(() => {
    loadProjects(true);
  }, []);

  const loadProjects = async (reset = false) => {
    const currentSkip = reset ? 0 : skip;
    try {
      const all = await api.get(`/projects?skip=${currentSkip}&limit=${LIMIT}`);
      
      if (all.data.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (reset) {
        setAllProjects(all.data);
      } else {
        setAllProjects(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newProjs = all.data.filter((p: Project) => !existingIds.has(p.id));
          return [...prev, ...newProjs];
        });
      }
      
      setSkip(currentSkip + LIMIT);
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdf) {
      toast.error("Please upload a PDF first");
      return;
    }

    setSubmitting(true);
    const data = new FormData();
    data.append("required_team_size", form.teamSize.toString());
    data.append("project_load", form.load.toString());
    data.append("file", pdf);

    const toastId = toast.loading("Analyzing project requirements...");
    try {
      await apiForm.post("/projects", data);
      toast.success("Project created successfully!", { id: toastId });
      setForm({ teamSize: 5, load: 10 });
      setPdf(null);
      loadProjects(true);
    } catch {
      toast.error("Failed to create project", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProject = (projectId: number) => {
    // 1. Save current states
    const previousAll = [...allProjects];
    
    // 2. Optimistic UI Update (Instant removal)
    setAllProjects(allProjects.filter(p => p.id !== projectId));

    // 3. Start 5-second timer
    const timeoutId = setTimeout(async () => {
      try {
        await api.delete(`/projects/${projectId}`);
      } catch (err: any) {
        toast.error("Failed to delete project. Restoring...");
        setAllProjects(previousAll);
      }
    }, 5000);

    // 4. Show Undo Toast
    toast(
      (t) => (
        <div className="flex items-center justify-between w-full gap-6">
          <div className="flex flex-col">
            <span className="font-bold text-foreground">Project Archived</span>
            <span className="text-xs text-muted-foreground">Resources have been freed</span>
          </div>
          <button
            onClick={() => {
              clearTimeout(timeoutId); // Cancel deletion
              setAllProjects(previousAll); // Put it back
              toast.dismiss(t.id);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg font-bold text-sm transition-colors"
          >
            <RotateCcw size={14} /> Undo
          </button>
        </div>
      ),
      { duration: 5000, id: `delete-proj-${projectId}` }
    );
  };

  // Derived states with search filter applied
  const filteredAll = allProjects.filter(p => projectLabel(p.description).toLowerCase().includes(searchQuery.toLowerCase()));
  const unallocated = filteredAll.filter((p) => p.status === "Unallocated");
  const pendingReview = filteredAll.filter((p) => p.status === "Pending Review");
  const activeDeployments = filteredAll.filter((p) => p.status === "Active");

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-sm">
            <LayoutGrid size={28} />
          </div>
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl md:text-4xl font-black tracking-tight text-foreground"
            >
              Organization Dashboard
            </motion.h1>
            <p className="text-muted-foreground font-medium text-lg mt-1">Manage your active projects and deployments.</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-12 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition font-semibold shadow-sm"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Create Project Form (Bento Layout) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-1 glass-panel rounded-[2rem] p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Plus size={20} className="stroke-[3]" />
            </div>
            <h2 className="text-xl font-black">New Project</h2>
          </div>

          <form onSubmit={createProject} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Required Team Size</label>
                <input
                  type="number"
                  min="1"
                  value={form.teamSize}
                  onChange={(e) => setForm({ ...form, teamSize: +e.target.value })}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-semibold shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Load per Person (hrs)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={form.load}
                  onChange={(e) => setForm({ ...form, load: +e.target.value })}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-semibold shadow-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Project Brief (PDF)</label>
              <UploadZone
                onFile={setPdf}
                label={pdf ? pdf.name : "Drop PDF here"}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !pdf}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 disabled:opacity-50 transition-all hover:-translate-y-0.5 mt-2"
            >
              {submitting ? "Analyzing..." : "Create Project"}
            </button>
          </form>
        </motion.div>

        {/* Right Column: Project Grid */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Unallocated Projects Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                <FolderOpen size={20} className="stroke-[2.5]" />
              </div>
              <h2 className="text-xl font-bold">Awaiting Allocation</h2>
              <span className="ml-2 bg-muted text-foreground text-xs font-black px-3 py-1 rounded-full border border-border">{unallocated.length}</span>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 gap-5">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="glass-panel rounded-3xl p-6 h-56 animate-pulse bg-muted/20" />
                ))}
              </div>
            ) : unallocated.length === 0 ? (
              <div className="glass-panel rounded-[2rem] border border-dashed p-12 text-center text-muted-foreground flex flex-col items-center">
                <FolderOpen size={48} className="mb-4 text-muted-foreground/30" />
                <p className="font-bold text-xl text-foreground mb-1">
                  {searchQuery ? "No matching projects" : "No pending projects"}
                </p>
                <p className="text-sm font-medium">
                  {searchQuery ? "Try a different search term." : "Create a new project brief to see it here."}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-5">
                <AnimatePresence>
                  {unallocated.map((p) => (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.02 }}
                      className="group glass-panel rounded-3xl p-6 border border-border hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between h-56 relative overflow-hidden bg-card"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full group-hover:bg-primary/20 transition-colors pointer-events-none"></div>
                      
                      <div className="relative z-10">
                        <h3 className="text-lg font-black mb-4 text-foreground line-clamp-2 leading-snug">
                          {projectLabel(p.description)}
                        </h3>
                        <div className="flex gap-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          <span className="bg-background border border-border px-3 py-1.5 rounded-lg">Team: {p.required_team_size}</span>
                          <span className="bg-background border border-border px-3 py-1.5 rounded-lg">Load: {p.project_load}h</span>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-4 relative z-10 w-full pt-5 border-t border-border/50">
                        <Link
                          to={`/projects/${p.id}/allocate`}
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:-translate-y-0.5"
                        >
                          <Play size={16} className="fill-current" /> Allocate
                        </Link>
                        <button
                          onClick={() => deleteProject(p.id)}
                          className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground px-4 py-2.5 rounded-xl transition-colors shrink-0 flex items-center justify-center"
                          title="Delete project"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {hasMore && !loading && unallocated.length > 0 && (
              <div className="flex justify-center mt-10 w-full mb-8">
                <button 
                  onClick={() => {
                    setLoading(true);
                    loadProjects(false);
                  }}
                  className="bg-card hover:bg-muted text-foreground px-8 py-3.5 rounded-xl font-bold transition-all border border-border shadow-sm flex items-center gap-2 hover:-translate-y-0.5"
                >
                  Load More Pending Projects...
                </button>
              </div>
            )}
          </section>

          {/* Pending Review Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                <RotateCw size={20} className="stroke-[2.5]" />
              </div>
              <h2 className="text-xl font-bold">Pending Review</h2>
              <span className="ml-2 bg-muted text-foreground text-xs font-black px-3 py-1 rounded-full border border-border">{pendingReview.length}</span>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 gap-5">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="glass-panel rounded-3xl p-6 h-56 animate-pulse bg-muted/20" />
                ))}
              </div>
            ) : pendingReview.length === 0 ? (
              <div className="hidden"></div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-5 mb-10">
                <AnimatePresence>
                  {pendingReview.map((p) => (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.02 }}
                      className="group glass-panel rounded-3xl p-6 border border-purple-500/30 hover:border-purple-500/60 transition-all shadow-sm flex flex-col justify-between h-[260px] relative overflow-hidden bg-card"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full group-hover:bg-purple-500/20 transition-colors pointer-events-none"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>
                          <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Awaiting Approval</span>
                        </div>
                        <h3 className="text-lg font-black mb-4 text-foreground line-clamp-2 leading-snug">
                          {projectLabel(p.description)}
                        </h3>
                      </div>

                      <div className="flex flex-col gap-2 relative z-10 w-full pt-4 border-t border-border/50">
                        <Link
                          to={`/projects/${p.id}/allocate`}
                          className="w-full bg-purple-500 text-white hover:bg-purple-600 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:-translate-y-0.5"
                        >
                          <Eye size={16} /> Review Allocation
                        </Link>
                        <button
                          onClick={() => deleteProject(p.id)}
                          className="w-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground px-4 py-2.5 rounded-xl transition-colors shrink-0 flex items-center justify-center font-bold text-sm"
                        >
                          <Trash2 size={16} className="mr-2"/> Discard
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>

          {/* Allocated Projects Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <Play size={20} className="stroke-[2.5]" />
              </div>
              <h2 className="text-xl font-bold">Active Deployments</h2>
              <span className="ml-2 bg-muted text-foreground text-xs font-black px-3 py-1 rounded-full border border-border">{activeDeployments.length}</span>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 gap-5">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="glass-panel rounded-3xl p-6 h-56 animate-pulse bg-muted/20" />
                ))}
              </div>
            ) : activeDeployments.length === 0 ? (
              <div className="glass-panel rounded-[2rem] border border-dashed p-12 text-center text-muted-foreground flex flex-col items-center">
                <Play size={48} className="mb-4 text-muted-foreground/30" />
                <p className="font-bold text-xl text-foreground mb-1">
                  {searchQuery ? "No matching projects" : "No active deployments"}
                </p>
                <p className="text-sm font-medium">
                  {searchQuery ? "Try a different search term." : "Approve an allocation to activate a project."}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-5">
                <AnimatePresence>
                  {activeDeployments.map((p) => (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.02 }}
                      className="group glass-panel rounded-3xl p-6 border border-emerald-500/20 hover:border-emerald-500/50 transition-all shadow-sm flex flex-col justify-between h-[280px] relative overflow-hidden bg-card"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full group-hover:bg-emerald-500/20 transition-colors pointer-events-none"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                        </div>
                        <h3 className="text-lg font-black mb-4 text-foreground line-clamp-2 leading-snug">
                          {projectLabel(p.description)}
                        </h3>
                        <div className="flex gap-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          <span className="bg-background border border-border px-3 py-1.5 rounded-lg">Team: {p.required_team_size}</span>
                          <span className="bg-background border border-border px-3 py-1.5 rounded-lg">Load: {p.project_load}h</span>
                        </div>
                      </div>

                      <div className="flex gap-2 relative z-10 w-full pt-5 border-t border-border/50 flex-wrap mt-auto">
                        <Link
                          to={`/projects/${p.id}/team`}
                          className="flex-1 min-w-[120px] bg-card text-foreground hover:bg-muted px-3 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-border shadow-sm"
                        >
                          <Eye size={16} /> Team
                        </Link>
                        <button
                          onClick={() => navigate(`/projects/${p.id}/allocate`)}
                          className="flex-1 min-w-[120px] bg-card text-foreground hover:bg-muted px-3 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-border shadow-sm"
                        >
                          <RotateCw size={16} /> Re-roll
                        </button>
                        <button
                          onClick={() => deleteProject(p.id)}
                          className="w-full mt-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center font-bold text-sm gap-2"
                        >
                          <Trash2 size={16} /> Archive Project
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}