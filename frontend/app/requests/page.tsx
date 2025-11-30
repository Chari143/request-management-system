"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Request = {
  id: number;
  title: string;
  description: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "CLOSED";
  createdAt: string;
  createdBy: { name: string; email: string };
  assignedTo: { name: string; email: string };
};

export default function RequestsPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [managerName, setManagerName] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [fieldErrorManagerName, setFieldErrorManagerName] = useState<string | undefined>(undefined);
  const [initialLoading, setInitialLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/requests`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load requests");
      setRequests(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally { setInitialLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!token) router.replace("/");
  }, [token, router]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);
    setFieldErrorManagerName(undefined);
    try {
      const res = await fetch(`${API_URL}/api/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, managerName })
      });
      
      const data = await res.json();
      if (!res.ok) {
         if (data.error?.fieldErrors?.managerName?.[0]) {
           setFieldErrorManagerName(data.error.fieldErrors.managerName[0]);
           return;
         }
         let errorMsg = typeof data.error === "string" ? data.error : "Failed to create request";
         throw new Error(errorMsg);
      }

      setTitle("");
      setDescription("");
      setManagerName("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const close = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/requests/${id}/close`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to close request");
      await load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : String(err)); }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
      
      {user?.role === "EMPLOYEE" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Request</h2>
          <form onSubmit={create} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input 
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                placeholder="e.g., Leave Request" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-h-[100px]" 
                placeholder="Detailed description..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manager Name</label>
              <input 
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                placeholder="Manager name" 
                value={managerName} 
                onChange={(e) => {
                  setManagerName(e.target.value);
                  if (fieldErrorManagerName) setFieldErrorManagerName(undefined);
                }} 
              />
              <div className="h-4">
                {fieldErrorManagerName && (<p className="text-red-600 text-xs">{fieldErrorManagerName}</p>)}
              </div>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex justify-end">
              <button 
                disabled={loading} 
                className="rounded-lg bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 disabled:opacity-50 transition-colors font-medium"
              >
                {loading ? "Creating..." : "Create Request"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Request History</h2>
        {initialLoading ? (
          <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-xl border border-gray-100">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-xl border border-gray-100">No requests found.</p>
        ) : (
          <ul className="space-y-4">
            {requests.map(r => (
              <li key={r.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 transition-all hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">{r.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        r.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        r.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        r.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-gray-600">{r.description}</p>
                    <div className="flex gap-6 text-sm text-gray-500 pt-2">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">From:</span> 
                        <span>{r.createdBy.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">To:</span> 
                        <span>{r.assignedTo.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  {user?.role === "EMPLOYEE" && r.status === "APPROVED" && (
                    <button 
                      className="shrink-0 rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium transition-colors shadow-sm" 
                      onClick={() => close(r.id)}
                    >
                      Close Request
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
