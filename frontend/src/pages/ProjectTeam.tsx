// src/pages/ProjectTeam.tsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Users, AlertCircle } from "lucide-react";

interface TeamMember {
  employee_id: number;
  employee_name: string;
  role: string;
  task_description: string;
  similarity: number;
  workload_after: number;
}

export default function ProjectTeam() {
  const { project_id } = useParams<{ project_id: string }>();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project_id) fetchTeam();
  }, [project_id]);

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${project_id}/team`);
      setTeam(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-400 mx-auto mb-4"></div>
          <p className="text-xl">Loading team...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-slate-300 mb-6">{error}</p>
          <button
            onClick={fetchTeam}
            className="bg-violet-600 hover:bg-violet-500 px-8 py-4 rounded-xl font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-10 flex items-center gap-3">
        <Users className="w-10 h-10 text-violet-400" />
        Allocated Team
      </h1>

      {team.length === 0 ? (
        <div className="text-center text-slate-400 text-xl py-20">
          No team allocated for this project yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((m) => (
            <div key={m.employee_id} className="glass p-6 rounded-3xl">
              <h3 className="text-xl font-bold mb-2">{m.employee_name}</h3>
              <p className="text-violet-400 font-medium mb-3">{m.role}</p>
              <p className="text-slate-300 mb-4">{m.task_description}</p>
              <div className="flex justify-between text-sm pt-4 border-t border-slate-700">
                <span>Similarity: <strong>{m.similarity.toFixed(3)}</strong></span>
                <span>Workload: <strong>{m.workload_after.toFixed(1)}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}