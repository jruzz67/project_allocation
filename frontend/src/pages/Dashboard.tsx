import { Users, FolderOpen, Award } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="p-10 max-w-7xl mx-auto">
      <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
        TeamForge
      </h1>
      <p className="text-slate-400 text-xl">Smart. Semantic. Optimized.</p>

      <div className="grid grid-cols-3 gap-6 mt-16">
        <Link to="/employees" className="glass rounded-3xl p-8 hover:scale-105 transition group">
          <Users className="w-12 h-12 text-violet-400 mb-6" />
          <h3 className="text-3xl font-semibold">Employees</h3>
          <p className="text-slate-400 mt-2">Manage profiles & resumes</p>
        </Link>

        <Link to="/projects" className="glass rounded-3xl p-8 hover:scale-105 transition group">
          <FolderOpen className="w-12 h-12 text-emerald-400 mb-6" />
          <h3 className="text-3xl font-semibold">Projects</h3>
          <p className="text-slate-400 mt-2">Upload project briefs</p>
        </Link>

        <div className="glass rounded-3xl p-8 bg-gradient-to-br from-violet-500/10 to-transparent">
          <Award className="w-12 h-12 text-amber-400 mb-6" />
          <h3 className="text-3xl font-semibold">Ready to allocate?</h3>
          <p className="text-slate-400 mt-2">See real optimization in action</p>
        </div>
      </div>
    </div>
  );
}