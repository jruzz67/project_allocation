import { useState, useEffect } from "react";
import { api, apiForm } from "../lib/api";
import { UploadZone } from "../components/ui/UploadZone";
import { FolderOpen, Plus, Play, Eye, RotateCw } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface Project {
  id: number;
  description: string;
  required_team_size: number;
  project_load: number;
}

export default function Projects() {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allocated, setAllocated] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ teamSize: 5, load: 10 });
  const [pdf, setPdf] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const [all, alloc] = await Promise.all([
        api.get("/projects"),
        api.get("/projects/allocated"),
      ]);
      setAllProjects(all.data);
      setAllocated(alloc.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdf) return alert("Please upload a PDF");

    setSubmitting(true);
    const data = new FormData();
    data.append("required_team_size", form.teamSize.toString());
    data.append("project_load", form.load.toString());
    data.append("file", pdf);

    try {
      await apiForm.post("/projects", data);
      setForm({ teamSize: 5, load: 10 });
      setPdf(null);
      loadProjects();
    } catch {
      alert("Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  const unallocated = allProjects.filter(
    (p) => !allocated.some((a) => a.id === p.id)
  );

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto">
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl md:text-6xl font-extrabold mb-3 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-emerald-400 bg-clip-text text-transparent"
      >
        TeamForge
      </motion.h1>
      <p className="text-xl text-slate-400 mb-16">AI-Powered • Semantic • Optimized</p>

      {/* Create Project Form */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-3xl p-8 md:p-10 mb-16 shadow-2xl border border-white/5"
      >
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-4">
          <Plus className="w-9 h-9 text-emerald-400" />
          Create New Project
        </h2>

        <form onSubmit={createProject} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium mb-3 text-slate-300">Team Size</label>
              <input
                type="number"
                min="1"
                value={form.teamSize}
                onChange={(e) => setForm({ ...form, teamSize: +e.target.value })}
                className="w-full bg-slate-800/70 border border-slate-600 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-3 text-slate-300">Load per Person (hours)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={form.load}
                onChange={(e) => setForm({ ...form, load: +e.target.value })}
                className="w-full bg-slate-800/70 border border-slate-600 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3 text-slate-300">Project Brief (PDF)</label>
            <UploadZone
              onFile={setPdf}
              label={pdf ? pdf.name : "Drag & drop or click to upload PDF"}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !pdf}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-10 py-5 rounded-2xl font-bold text-lg shadow-xl disabled:opacity-50 transition-all transform hover:scale-[1.02]"
          >
            {submitting ? "Creating..." : "Create Project"}
          </button>
        </form>
      </motion.section>

      {/* Allocated Projects */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-4">
          <Play className="w-9 h-9 text-violet-400" />
          Allocated Projects
        </h2>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass rounded-3xl p-6 h-64 animate-pulse bg-slate-800/50" />
            ))}
          </div>
        ) : allocated.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xl">
            No projects allocated yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allocated.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                className="glass rounded-3xl p-6 border border-violet-500/10 hover:border-violet-500/40 transition-all shadow-xl"
              >
                <h3 className="text-xl font-semibold mb-4 line-clamp-2 text-white/90 group-hover:text-white transition">
                  {p.description}
                </h3>
                <div className="flex justify-between text-sm mb-6 text-slate-300">
                  <span>Team: {p.required_team_size}</span>
                  <span>Load: {p.project_load}h</span>
                </div>
                <div className="flex gap-4">
                  <Link
                    to={`/projects/${p.id}/team`}
                    className="flex-1 bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-500 hover:to-indigo-500 px-6 py-3 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <Eye size={18} />
                    View Team
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm("Re-allocate this project? This will replace the current team.")) {
                        api.post(`/projects/${p.id}/allocate`).then(() => {
                          alert("Re-allocated successfully!");
                          loadProjects();
                        }).catch(() => alert("Re-allocation failed"));
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-amber-600/80 to-orange-600/80 hover:from-amber-500 hover:to-orange-500 px-6 py-3 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <RotateCw size={18} />
                    Re-allocate
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Unallocated Projects */}
      <section>
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-4">
          <FolderOpen className="w-9 h-9 text-emerald-400" />
          Unallocated Projects
        </h2>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass rounded-3xl p-6 h-64 animate-pulse bg-slate-800/50" />
            ))}
          </div>
        ) : unallocated.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xl">
            No unallocated projects yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unallocated.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                className="glass rounded-3xl p-6 border border-emerald-500/10 hover:border-emerald-500/40 transition-all shadow-xl"
              >
                <h3 className="text-xl font-semibold mb-4 line-clamp-2 text-white/90 group-hover:text-white transition">
                  {p.description}
                </h3>
                <div className="flex justify-between text-sm mb-6 text-slate-300">
                  <span>Team: {p.required_team_size}</span>
                  <span>Load: {p.project_load}h</span>
                </div>
                <Link
                  to={`/projects/${p.id}/allocate`}
                  className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-6 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                  <Play size={20} />
                  Allocate Team
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}