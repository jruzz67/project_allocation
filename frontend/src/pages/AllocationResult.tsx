import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Users, CheckCircle, AlertCircle } from "lucide-react";

interface TeamMember {
  employee_id: number;
  employee_name: string;
  task_id: number;
  role: string;
  task_description: string;
  similarity: number;
  workload_after: number;
}

interface Allocation {
  status: string;
  selected_team?: TeamMember[];
  avg_similarity?: number;
  workload_std?: number;
  tasks_generated?: number;
  reason?: string;
  suggestions?: string[];
}

export default function AllocationResult() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<Allocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      runAllocation(Number(id));
    }
  }, [id]);

  const runAllocation = async (projectId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post(`/projects/${projectId}/allocate`);
      setResult(res.data);
    } catch (err: any) {
      console.error("Allocation failed", err);
      setError(err.response?.data?.reason || "Failed to allocate team");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-400 mx-auto mb-4"></div>
        Allocating team... (Gemini processing may take 10–20 seconds)
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="p-10 max-w-4xl mx-auto">
        <div className="glass p-8 text-center border border-red-500/30">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-red-400 mb-4">Allocation Failed</h2>
          <p className="text-slate-300 mb-6">{error || "Unknown error"}</p>
          <button
            onClick={() => runAllocation(Number(id))}
            className="bg-violet-600 hover:bg-violet-500 px-8 py-4 rounded-xl font-medium transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Users className="w-10 h-10 text-violet-400" />
          Allocation Result
        </h1>
        <div className="text-right">
          <p className="text-lg">
            Avg Similarity: <span className="font-bold text-violet-400">{result.avg_similarity?.toFixed(3) ?? "N/A"}</span>
          </p>
          <p className="text-lg">
            Workload Std: <span className="font-bold text-emerald-400">{result.workload_std?.toFixed(2) ?? "N/A"}</span>
          </p>
          {result.tasks_generated && (
            <p className="text-sm text-slate-400">Tasks generated: {result.tasks_generated}</p>
          )}
        </div>
      </div>

      {result.status === "success" && result.selected_team && result.selected_team.length > 0 ? (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {result.selected_team.map((member, index) => (
              <div key={index} className="glass p-6 hover:scale-[1.02] transition">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{member.employee_name}</h3>
                    <p className="text-violet-400 font-medium mb-3">{member.role}</p>
                    <p className="text-sm text-slate-300 mb-4 line-clamp-4">
                      {member.task_description}
                    </p>
                    <div className="flex justify-between text-sm">
                      <span>Similarity: <strong>{member.similarity.toFixed(3)}</strong></span>
                      <span>New Workload: <strong>{member.workload_after.toFixed(1)}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass p-8 text-center">
          <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold mb-4">No Team Assigned</h2>
          <p className="text-slate-300">{result.reason || "No feasible allocation found"}</p>
          {result.suggestions && result.suggestions.length > 0 && (
            <ul className="list-disc list-inside text-left max-w-md mx-auto mt-6 text-slate-400">
              {result.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}