import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Building2, User, Lock, Mail, ArrowRight, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"org" | "employee">("org");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailError(false);

    try {
      if (isLogin) {
        const endpoint = role === "org" ? "/auth/org/login" : "/auth/employee/login";
        const res = await api.post(endpoint, {
          email: formData.email,
          password: formData.password,
        });
        
        const { access_token, user_id, name, is_setup_complete } = res.data;
        login(access_token, { user_id, role, name, is_setup_complete });
        
        toast.success(`Welcome back, ${name || "User"}!`);
        
        if (role === "employee" && !is_setup_complete) {
          navigate("/setup");
        } else {
          navigate("/projects"); 
        }
      } else {
        const res = await api.post("/auth/org/signup", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
        
        const { access_token, user_id, name } = res.data;
        login(access_token, { user_id, role: "org", name });
        
        toast.success("Organization created successfully!");
        navigate("/projects");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Authentication failed";
      toast.error(errorMsg);
      
      // Visual validation if email is taken or incorrect
      if (errorMsg.toLowerCase().includes("email") || errorMsg.toLowerCase().includes("incorrect")) {
        setEmailError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-foreground bg-background transition-colors duration-300">
      {/* Left Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 xl:p-24 relative z-10">
        
        <Link to="/" className="absolute top-8 left-8 text-2xl font-black bg-gradient-to-r from-primary via-fuchsia-500 to-emerald-500 bg-clip-text text-transparent tracking-tight hover:opacity-80 transition-opacity">
          TF.
        </Link>
        
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-10">
            <h1 className="text-4xl font-black mb-3 tracking-tight text-foreground">
              {isLogin ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-muted-foreground text-lg font-medium">
              {isLogin ? "Enter your details to access your dashboard." : "Set up your organization in minutes."}
            </p>
          </div>

          {/* Role Toggle for Login */}
          {isLogin && (
            <div className="flex bg-muted/30 p-1.5 rounded-2xl mb-8 border border-border shadow-inner">
              <button
                type="button"
                onClick={() => { setRole("org"); setEmailError(false); }}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                  role === "org" 
                    ? "bg-card shadow-sm text-foreground border border-border/50" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Building2 size={18} /> Organization
              </button>
              <button
                type="button"
                onClick={() => { setRole("employee"); setEmailError(false); }}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                  role === "employee" 
                    ? "bg-card shadow-sm text-foreground border border-border/50" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <User size={18} /> Employee
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence>
              {!isLogin && role === "org" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Organization Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-card border border-border rounded-xl px-12 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-semibold shadow-sm"
                      placeholder="Acme Corp"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div animate={emailError ? { x: [-5, 5, -5, 5, 0] } : {}} transition={{ duration: 0.3 }}>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex justify-between">
                Email Address
                {emailError && <span className="text-destructive flex items-center gap-1"><AlertCircle size={12}/> Email Taken</span>}
              </label>
              <div className="relative">
                <Mail className={cn("absolute left-4 top-3.5 w-5 h-5 transition-colors", emailError ? "text-destructive" : "text-muted-foreground")} />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setEmailError(false); }}
                  className={cn(
                    "w-full bg-card border rounded-xl px-12 py-3.5 text-foreground focus:outline-none focus:ring-2 transition-all font-semibold shadow-sm",
                    emailError ? "border-destructive focus:ring-destructive/50" : "border-border focus:ring-primary/50 focus:border-primary"
                  )}
                  placeholder={role === "employee" ? "employee@acme.com" : "admin@acme.com"}
                />
              </div>
            </motion.div>

            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-card border border-border rounded-xl px-12 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-semibold shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group mt-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 text-lg"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setRole("org"); 
                setFormData({ name: "", email: "", password: "" });
                setEmailError(false);
              }}
              className="text-muted-foreground hover:text-foreground font-bold text-sm transition-colors border-b border-transparent hover:border-foreground pb-0.5"
            >
              {isLogin ? "Need an organization account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Right Graphic Section */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-muted/30 items-center justify-center border-l border-border">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-primary/20 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse-slow"></div>
          <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-emerald-500/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-float" style={{ animationDelay: "1s" }}></div>
        </div>
        
        <div className="relative z-10 glass-panel p-12 rounded-[2.5rem] max-w-lg mx-8 border border-border shadow-2xl">
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-primary/30">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-foreground mb-6 leading-tight">
            "TeamForge transformed how we allocate our engineers."
          </h2>
          <p className="text-muted-foreground text-lg mb-8 font-medium">
            The intelligent semantic matching engine ensures that the right people with the right skills are always working on the exact tasks that need them most, eliminating burnout and maximizing delivery speed.
          </p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-fuchsia-500 rounded-full flex items-center justify-center text-white font-black text-lg border-2 border-background shadow-md">
              S
            </div>
            <div>
              <p className="text-foreground font-black">Sarah Jenkins</p>
              <p className="text-muted-foreground text-sm font-semibold">VP of Engineering, Innovate Inc.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}