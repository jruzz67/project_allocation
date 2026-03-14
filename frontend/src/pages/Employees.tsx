// src/pages/Employees.tsx
import { useState, useEffect } from "react";
import { api, apiForm } from "../lib/api";
import { UploadZone } from "../components/ui/UploadZone";
import { Users, Plus } from "lucide-react";

interface Employee {
  id: number;
  name: string;
  description: string;
  current_workload: number;
  capacity: number;
}

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    current_workload: 0,
    capacity: 40,
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/employees");
      setEmployees(res.data);
    } catch (err) {
      console.error("Failed to fetch employees", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) {
      alert("Please upload a resume PDF");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("current_workload", form.current_workload.toString());
    formData.append("capacity", form.capacity.toString());
    formData.append("file", pdfFile);

    try {
      await apiForm.post("/employees", formData);
      alert("Employee added!");
      setForm({ name: "", current_workload: 0, capacity: 40 });
      setPdfFile(null);
      fetchEmployees();
    } catch (err) {
      console.error("Add failed", err);
      alert("Failed to add employee");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Users className="w-10 h-10 text-violet-400" />
          Employees
        </h1>
      </div>

      {/* Add Form */}
      <div className="glass p-8 mb-12 rounded-3xl">
        <h2 className="text-2xl font-semibold mb-6">Add New Employee</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Current Workload</label>
              <input
                type="number"
                value={form.current_workload}
                onChange={(e) => setForm({ ...form, current_workload: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Capacity</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-violet-500"
                min="1"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Resume PDF</label>
            <UploadZone
              onFile={setPdfFile}
              label={pdfFile ? pdfFile.name : "Upload Resume PDF"}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !pdfFile}
            className="bg-violet-600 hover:bg-violet-500 px-8 py-4 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 transition w-full md:w-auto"
          >
            <Plus size={20} />
            {submitting ? "Adding..." : "Add Employee"}
          </button>
        </form>
      </div>

      {loading ? (
        <p className="text-center text-slate-400">Loading employees...</p>
      ) : employees.length === 0 ? (
        <p className="text-center text-slate-400">No employees yet. Add one above.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((emp) => (
            <div key={emp.id} className="glass p-6 rounded-3xl hover:scale-[1.02] transition">
              <h3 className="text-xl font-semibold mb-2">{emp.name}</h3>
              <p className="text-slate-400 text-sm mb-4 line-clamp-3">{emp.description}</p>
              <div className="flex justify-between text-sm">
                <span>Workload: {emp.current_workload} / {emp.capacity}</span>
                <span className="text-violet-400">ID: {emp.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}