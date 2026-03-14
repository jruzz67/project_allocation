import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface TeamMember {
  employee_id: number;
  employee_name: string;
  role: string;
  task_description: string;
  similarity: number;
  workload_after: number;
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
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AllocationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    allocateTeam();
  }, [project_id]);

  const allocateTeam = async () => {
    setLoading(true);
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="w-16 h-16 text-violet-500 animate-spin mb-6" />
        <h2 className="text-2xl font-semibold mb-2">Allocating Team...</h2>
        <p className="text-slate-400 max-w-md text-center">
          Generating tasks with Gemini • Running optimization • Assigning team members
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
        <h2 className="text-2xl font-bold mb-4 text-red-400">Allocation Failed</h2>
        <p className="text-slate-300 mb-8 text-center max-w-lg">{error}</p>
        <button
          onClick={() => allocateTeam()}
          className="bg-violet-600 hover:bg-violet-500 px-8 py-4 rounded-xl font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!result || result.status !== "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6">
        <AlertCircle className="w-16 h-16 text-amber-500 mb-6" />
        <h2 className="text-2xl font-bold mb-4">Unexpected Result</h2>
        <pre className="bg-slate-900 p-4 rounded-lg text-sm max-w-2xl overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
          Allocation Result
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl"
        >
          Back to Projects
        </button>
      </div>

      <div className="glass p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 p-6 rounded-xl">
            <h3 className="text-lg font-medium mb-2">Avg Similarity</h3>
            <p className="text-3xl font-bold text-violet-400">
              {result.avg_similarity?.toFixed(3)}
            </p>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-xl">
            <h3 className="text-lg font-medium mb-2">Workload Std</h3>
            <p className="text-3xl font-bold text-emerald-400">
              {result.workload_std?.toFixed(2)}
            </p>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-xl">
            <h3 className="text-lg font-medium mb-2">Tasks Generated</h3>
            <p className="text-3xl font-bold">{result.tasks_generated}</p>
          </div>
        </div>

        <div className="space-y-8">
          {result.selected_team?.map((member) => (
            <div key={member.employee_id} className="glass p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{member.employee_name}</h3>
                  <p className="text-violet-400 font-medium">{member.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Similarity</p>
                  <p className="text-2xl font-bold text-violet-400">
                    {member.similarity.toFixed(3)}
                  </p>
                </div>
              </div>
              <p className="text-slate-300 mb-4">{member.task_description}</p>
              <p className="text-sm text-emerald-400">
                New Workload: {member.workload_after.toFixed(1)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-6">
        <button
          onClick={() => allocateTeam()}
          className="bg-amber-600 hover:bg-amber-500 px-8 py-4 rounded-xl font-medium flex items-center gap-2"
        >
          <RotateCw size={18} />
          Re-allocate
        </button>
        <button
          onClick={() => navigate(`/projects/${project_id}/team`)}
          className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-xl font-medium flex items-center gap-2"
        >
          <Eye size={18} />
          View Saved Team
        </button>
      </div>
    </div>
  );
}