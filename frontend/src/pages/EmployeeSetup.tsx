import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiForm } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { UploadCloud, FileText, Lock, Clock, ArrowRight, Loader2, Target, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

export default function EmployeeSetup() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const { updateUser, user } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    capacity: 40,
    new_password: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== "application/pdf") {
        toast.error("Please upload a PDF file");
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        toast.error("File size must be under 10MB");
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please upload your resume");
      return;
    }
    
    if (formData.new_password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append("name", formData.name);
    data.append("capacity", formData.capacity.toString());
    data.append("new_password", formData.new_password);
    data.append("file", file);

    const toastId = toast.loading("Extracting skills from your resume...");

    try {
      await apiForm.post("/employees/setup", data);
      updateUser({ is_setup_complete: true, name: formData.name });
      toast.success("Setup complete! Welcome to TeamForge.", { id: toastId });
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Setup failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-foreground bg-background transition-colors duration-300">
      {/* Left Form Section */}
      <div className="w-full lg:w-3/5 flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-24 relative z-10 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl mx-auto"
        >
          <div className="mb-10">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20 text-primary shadow-sm">
              <Target size={24} />
            </div>
            <h1 className="text-4xl font-black mb-3 tracking-tight text-foreground">
              Complete Your Profile
            </h1>
            <p className="text-muted-foreground text-lg font-medium">
              Welcome aboard. Please provide your details so our semantic engine can match you with the perfect tasks.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm font-medium"
                    placeholder="Jane Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Weekly Capacity (Hours)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                    <input
                      type="number"
                      required
                      min="1"
                      max="168"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 40 })}
                      className="w-full bg-card border border-border rounded-xl pl-12 pr-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Set New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={formData.new_password}
                      onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                      className="w-full bg-card border border-border rounded-xl pl-12 pr-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm font-medium"
                      placeholder="At least 6 characters"
                    />
                  </div>
                </div>
              </div>

              {/* Resume Drag & Drop Zone */}
              <div>
                <label className="block text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Resume (PDF)</label>
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-3xl h-[284px] p-6 flex flex-col items-center justify-center text-center transition-all duration-300 group cursor-pointer",
                    file 
                      ? "border-primary bg-primary/5 shadow-inner" 
                      : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
                  )}
                  onClick={() => document.getElementById("resume-upload")?.click()}
                >
                  <input
                    id="resume-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  
                  {file ? (
                    <motion.div 
                      className="flex flex-col items-center"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mb-4 relative shadow-lg">
                        <FileText size={32} />
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-1 border-2 border-background text-white">
                          <CheckCircle2 size={16} />
                        </div>
                      </div>
                      <p className="text-foreground font-bold mb-1 truncate w-[200px]">{file.name}</p>
                      <p className="text-muted-foreground text-sm font-medium">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • Ready
                      </p>
                      <p className="text-primary text-sm font-bold mt-4 group-hover:underline">
                        Click to change
                      </p>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-background border border-border rounded-2xl flex items-center justify-center mb-4 text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors shadow-sm">
                        <UploadCloud size={32} />
                      </div>
                      <p className="text-foreground font-bold mb-1">Upload your resume</p>
                      <p className="text-muted-foreground text-sm max-w-[200px] font-medium">
                        PDF up to 10MB. We'll automatically extract your skills.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing Resume...
                </>
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Right Graphic Section */}
      <div className="hidden lg:flex w-2/5 relative overflow-hidden bg-muted/30 items-center justify-center border-l border-border">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[30%] left-[10%] w-[80%] h-[80%] bg-primary/20 blur-[130px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse-slow"></div>
          <div className="absolute -bottom-[20%] right-[20%] w-[60%] h-[60%] bg-emerald-500/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-float" style={{ animationDelay: "1s" }}></div>
        </div>
        
        <div className="relative z-10 p-12 max-w-md w-full">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-10 rounded-[2.5rem] border border-border/50 shadow-2xl"
          >
            <div className="space-y-8">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border">
                  <span className="text-foreground font-black">1</span>
                </div>
                <p className="text-foreground font-semibold text-lg">Upload your experience</p>
              </div>
              <div className="h-6 w-px bg-border ml-6"></div>
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border">
                  <span className="text-foreground font-black">2</span>
                </div>
                <p className="text-foreground font-semibold text-lg">Set your capacity</p>
              </div>
              <div className="h-6 w-px bg-border ml-6"></div>
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <span className="text-primary-foreground font-black">3</span>
                </div>
                <p className="text-foreground font-black text-lg">Start receiving perfect matches</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}