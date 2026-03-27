import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, Bot, Users, Sparkles, Code2, 
  ChevronDown, CheckCircle2, Zap, BarChart3, Shield, Globe 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

// --- FAQ Component ---
const faqs = [
  {
    question: "How does the AI semantic matching actually work?",
    answer: "We use advanced Large Language Models (LLMs) to read your project requirement PDFs. Instead of simple keyword matching, the AI understands context. It knows that 'experience with React' is highly relevant to 'Next.js frontend development', allowing for much smarter resource allocation."
  },
  {
    question: "Can I override the AI's recommendations?",
    answer: "Absolutely. TeamForge is designed as a powerful co-pilot, not an autopilot. You can always review the AI's suggested team, re-roll the allocation, or manually adjust workloads before finalizing the deployment."
  },
  {
    question: "Is my organization's data secure?",
    answer: "Yes. We use a strict multi-tenant architecture. Your project briefs, employee resumes, and allocation data are completely isolated from other organizations. We do not use your proprietary data to train public models."
  },
  {
    question: "How does the workload balancing feature prevent burnout?",
    answer: "Every employee profile has a set weekly capacity. Before the AI recommends an engineer for a new project, it calculates their active allocations. If assigning a task pushes an engineer over their capacity, the AI will prioritize a different, available team member."
  }
];

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border border-border bg-card rounded-2xl overflow-hidden shadow-sm hover:border-primary/30 transition-colors"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="font-bold text-lg text-foreground">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground border border-border"
        >
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-6 text-muted-foreground font-medium leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30 selection:text-primary">
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 flex flex-col items-center text-center px-6">
        
        {/* Dynamic Background Visuals */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex justify-center">
          {/* 1. Architectural Grid Background */}
          <div 
            className="absolute inset-0 opacity-[0.15] dark:opacity-[0.07]"
            style={{
              backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
              backgroundSize: '4rem 4rem',
              maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, #000 60%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, #000 60%, transparent 100%)'
            }}
          />
          
          {/* 2. Glowing Orbs */}
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/30 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse-slow"></div>
          <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] bg-fuchsia-500/20 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-float" style={{ animationDelay: "2s" }}></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 backdrop-blur-md text-sm font-bold text-primary mb-8 border border-primary/20 shadow-sm"
          >
            <Sparkles size={16} />
            <span>TeamForge AI 2.0 is now live</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[1.1]"
          >
            Supercharge your <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-primary via-fuchsia-500 to-emerald-500 bg-clip-text text-transparent drop-shadow-sm">
               Project Allocation
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 font-medium leading-relaxed"
          >
            Stop matching engineers by guesswork. Use Semantic AI to instantly map your team's exact skills to the workloads they actually need.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full"
          >
            <Link
              to="/auth"
              className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground px-10 py-5 rounded-2xl text-lg font-bold overflow-hidden transition-all shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Free Trial <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <a
              href="https://github.com/jruzz67/project_allocation/blob/main/frontend/README.md"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-card px-10 py-5 rounded-2xl text-lg font-bold hover:bg-muted transition-all text-foreground border border-border shadow-sm hover:-translate-y-1"
            >
              <Code2 size={24} />
              Read the Docs
            </a>
          </motion.div>
        </div>
      </section>

      {/* --- SOCIAL PROOF LOGOS --- */}
      <section className="border-y border-border/50 bg-muted/30 py-10 overflow-hidden relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">Trusted by engineering teams at</p>
          <div className="flex flex-wrap justify-center gap-10 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="text-2xl font-black font-serif tracking-tighter">AcmeCorp</span>
            <span className="text-2xl font-black tracking-widest uppercase">Globex</span>
            <span className="text-2xl font-black italic">Initech</span>
            <span className="text-2xl font-black tracking-tight">Soylent</span>
            <span className="text-2xl font-black font-mono">Massive Dynamic</span>
          </div>
        </div>
      </section>

      {/* --- FEATURE GRID --- */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Built for scale. Designed for humans.</h2>
            <p className="text-xl text-muted-foreground font-medium">Everything you need to manage a massive engineering workforce without the spreadsheets.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-panel p-10 rounded-[2rem] hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 text-blue-500">
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">AI Semantic Matching</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">Our Gemini integration maps complex PDF project requirements directly to your engineers' resumes automatically. Say goodbye to keyword matching.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-panel p-10 rounded-[2rem] transform md:-translate-y-8 hover:-translate-y-10 transition-transform duration-300 border-primary/20 shadow-xl shadow-primary/5"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20 text-primary">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">Workload Balancing</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">Keep your team sane. The AI calculates exact current hours and remaining capacity before ever recommending a new assignment, preventing burnout instantly.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-panel p-10 rounded-[2rem] hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 text-emerald-500">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">Enterprise Security</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">Multi-tenant architecture ensures complete security, preventing data crossover between organizations. Your IP and employee data never leaks.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (Timeline) --- */}
      <section className="py-24 bg-card border-y border-border/50 relative z-10 overflow-hidden">
        {/* Dot Pattern Background for this section */}
        <div 
          className="absolute inset-0 opacity-[0.15] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(hsl(var(--foreground)) 1.5px, transparent 1.5px)`,
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute right-0 top-0 w-1/3 h-full bg-primary/5 blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="mb-20">
            <span className="text-primary font-black uppercase tracking-widest text-sm mb-2 block">Workflow</span>
            <h2 className="text-4xl md:text-5xl font-black">How TeamForge Works</h2>
          </div>

          <div className="space-y-12 relative">
            {/* Connecting line */}
            <div className="absolute left-8 md:left-1/2 top-10 bottom-10 w-1 bg-border rounded-full hidden md:block"></div>

            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="md:w-1/2 md:text-right md:pr-16 order-2 md:order-1">
                <h3 className="text-3xl font-bold mb-4">1. Define the Mission</h3>
                <p className="text-muted-foreground text-lg font-medium">Upload your project brief as a PDF. Tell us how large the team needs to be and the estimated weekly hours required.</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-2xl shadow-lg border-4 border-background shrink-0 order-1 md:order-2 z-10 relative md:absolute md:left-1/2 md:-translate-x-1/2">
                1
              </div>
              <div className="md:w-1/2 order-3 hidden md:block"></div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="md:w-1/2 order-3 md:order-1 hidden md:block"></div>
              <div className="w-16 h-16 rounded-2xl bg-fuchsia-500 text-white flex items-center justify-center font-black text-2xl shadow-lg border-4 border-background shrink-0 order-1 md:order-2 z-10 relative md:absolute md:left-1/2 md:-translate-x-1/2">
                2
              </div>
              <div className="md:w-1/2 md:pl-16 order-2 md:order-3">
                <h3 className="text-3xl font-bold mb-4">2. AI Semantic Analysis</h3>
                <p className="text-muted-foreground text-lg font-medium">Our Gemini engine instantly breaks down the project into specific roles and required skills, cross-referencing your entire employee database in seconds.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="md:w-1/2 md:text-right md:pr-16 order-2 md:order-1">
                <h3 className="text-3xl font-bold mb-4">3. Deploy the Dream Team</h3>
                <p className="text-muted-foreground text-lg font-medium">Review the AI's allocation. See exactly why each person was chosen, verify their workload capacity, and deploy them with one click.</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-2xl shadow-lg border-4 border-background shrink-0 order-1 md:order-2 z-10 relative md:absolute md:left-1/2 md:-translate-x-1/2">
                3
              </div>
              <div className="md:w-1/2 order-3 hidden md:block"></div>
            </div>
          </div>
        </div>
      </section>

      {/* --- IMPACT STATS --- */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="text-center p-8 glass-panel rounded-[2rem] border-transparent bg-transparent shadow-none hover:bg-card hover:border-border transition-colors">
              <Zap className="w-10 h-10 text-amber-500 mx-auto mb-4" />
              <p className="text-5xl font-black text-foreground mb-2">10x</p>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Faster Allocation</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-center p-8 glass-panel rounded-[2rem] border-transparent bg-transparent shadow-none hover:bg-card hover:border-border transition-colors">
              <BarChart3 className="w-10 h-10 text-primary mx-auto mb-4" />
              <p className="text-5xl font-black text-foreground mb-2">98%</p>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Match Accuracy</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-center p-8 glass-panel rounded-[2rem] border-transparent bg-transparent shadow-none hover:bg-card hover:border-border transition-colors">
              <Users className="w-10 h-10 text-fuchsia-500 mx-auto mb-4" />
              <p className="text-5xl font-black text-foreground mb-2">-40%</p>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Burnout Reduction</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="text-center p-8 glass-panel rounded-[2rem] border-transparent bg-transparent shadow-none hover:bg-card hover:border-border transition-colors">
              <Globe className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
              <p className="text-5xl font-black text-foreground mb-2">24/7</p>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Global Sync</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- FAQs --- */}
      <section className="py-24 bg-card border-t border-border/50 relative z-10">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg font-medium">Everything you need to know about the product and data privacy.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* --- BOTTOM CTA --- */}
      <section className="py-32 relative z-10 px-6">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-primary to-fuchsia-600 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              Ready to build the <br /> perfect team?
            </h2>
            <p className="text-white/80 text-xl font-medium mb-10 max-w-2xl mx-auto">
              Join hundreds of forward-thinking engineering organizations who are leaving spreadsheets behind.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-3 bg-white text-primary px-10 py-5 rounded-2xl text-lg font-black hover:scale-105 transition-transform shadow-xl"
            >
              Create Your Organization Free
            </Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-border py-12 bg-background relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black bg-gradient-to-r from-primary to-fuchsia-500 bg-clip-text text-transparent">TF.</span>
            <span className="text-muted-foreground font-medium">© 2026 TeamForge AI. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-bold text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="https://github.com/jruzz67/project_allocation/blob/main/frontend/README.md" className="hover:text-foreground transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}