// src/pages/Landing.tsx
import { motion } from "framer-motion";
import { 
  Users, 
  Building2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Eye               // ← FIXED: added Eye icon import
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 md:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(139,92,246,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(34,197,94,0.08),transparent_50%)]" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-violet-950/40 border border-violet-500/30 rounded-full mb-8 backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
              <span className="text-sm font-medium text-violet-300">AI-Powered Team Allocation</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-8 bg-gradient-to-r from-white via-violet-200 to-emerald-200 bg-clip-text text-transparent">
              Build Smarter Teams<br />Instantly
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 max-w-4xl mx-auto mb-12 leading-relaxed">
              Semantic matching + real workload optimization — perfect for employees finding great projects and organizations building high-performing teams.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                to="/employees"
                className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-10 py-6 rounded-2xl font-bold text-lg shadow-2xl shadow-violet-900/40 transition-all hover:scale-[1.03] hover:shadow-violet-900/60"
              >
                <Users className="w-6 h-6" />
                I'm an Employee
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>

              <Link
                to="/projects"
                className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-10 py-6 rounded-2xl font-bold text-lg shadow-2xl shadow-emerald-900/40 transition-all hover:scale-[1.03] hover:shadow-emerald-900/60"
              >
                <Building2 className="w-6 h-6" />
                I'm an Organization
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 md:px-12 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why Teams Love TeamForge
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Built for real-world use — powered by AI, embeddings, and optimization.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Intelligent Matching",
                desc: "Resume and task embeddings find the perfect fit — beyond simple keywords.",
                color: "violet",
              },
              {
                icon: ShieldCheck,
                title: "Workload-Safe Allocation",
                desc: "Never over-assign — respects real capacity and current load.",
                color: "emerald",
              },
              {
                icon: Sparkles,
                title: "AI Task Generation",
                desc: "Gemini creates detailed, accurate roles and tasks automatically.",
                color: "amber",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass rounded-3xl p-8 border border-white/5 hover:border-white/20 transition-all group backdrop-blur-sm"
              >
                <div className={`w-16 h-16 rounded-2xl bg-${f.color}-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`w-8 h-8 text-${f.color}-400`} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                <p className="text-slate-300 text-lg">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Two Paths Section */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Employee Path */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-10 border border-violet-500/20 hover:border-violet-500/40 transition-all backdrop-blur-sm"
          >
            <div className="w-20 h-20 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-8">
              <Users className="w-10 h-10 text-violet-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              For Employees
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Showcase your skills, get matched to real projects, and see your current allocations.
            </p>
            <ul className="space-y-4 text-lg text-slate-200 mb-10">
              <li className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-violet-400" /> Semantic resume matching
              </li>
              <li className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-violet-400" /> View your assigned projects & tasks
              </li>
              <li className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-violet-400" /> Track your workload
              </li>
            </ul>
            <Link
              to="/employees"
              className="inline-flex items-center gap-3 bg-violet-600 hover:bg-violet-500 px-10 py-5 rounded-2xl font-bold text-lg transition-all hover:scale-[1.02]"
            >
              Get Started as Employee
              <ArrowRight className="w-6 h-6" />
            </Link>
          </motion.div>

          {/* Organization Path */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all backdrop-blur-sm"
          >
            <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8">
              <Building2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
              For Organizations
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Create projects, auto-generate tasks, and get optimized team allocations instantly.
            </p>
            <ul className="space-y-4 text-lg text-slate-200 mb-10">
              <li className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-emerald-400" /> AI-generated detailed roles
              </li>
              <li className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> Capacity-aware allocation
              </li>
              <li className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-emerald-400" /> View & re-allocate teams anytime
              </li>
            </ul>
            <Link
              to="/projects"
              className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 px-10 py-5 rounded-2xl font-bold text-lg transition-all hover:scale-[1.02]"
            >
              Get Started as Organization
              <ArrowRight className="w-6 h-6" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-slate-800 text-center text-slate-500">
        <p>© {new Date().getFullYear()} TeamForge — Powered by AI + Optimization</p>
      </footer>
    </div>
  );
}