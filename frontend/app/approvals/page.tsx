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
};

export default function ApprovalsPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [error, setError] = useState<string | null>(null);
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

  const approve = async (id: number) => {
    if (!token) return;
    try { 
      const res = await fetch(`${API_URL}/api/requests/${id}/approve`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to approve");
      await load(); 
    } catch (err: unknown) { setError(err instanceof Error ? err.message : String(err)); }
  };
  const reject = async (id: number) => {
    if (!token) return;
    try { 
      const res = await fetch(`${API_URL}/api/requests/${id}/reject`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ reason: "Not acceptable" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject");
      await load(); 
    } catch (err: unknown) { setError(err instanceof Error ? err.message : String(err)); }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
      {user?.role !== "MANAGER" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
          Only managers can approve or reject requests.
        </div>
      )}
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>}
      
      {initialLoading ? (
        <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-xl border border-gray-100">Loading pending approvals...</p>
      ) : requests.filter(r => r.status === "PENDING_APPROVAL").length === 0 ? (
        <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-xl border border-gray-100">No pending approvals found.</p>
      ) : (
        <ul className="space-y-4">
          {requests.filter(r => r.status === "PENDING_APPROVAL").map(r => (
            <li key={r.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 transition-all hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg text-gray-900">{r.title}</h3>
                  <p className="text-gray-600">{r.description}</p>
                </div>
                {user?.role === "MANAGER" && (
                  <div className="flex gap-2 shrink-0">
                    <button 
                      className="rounded-lg bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium transition-colors shadow-sm" 
                      onClick={() => approve(r.id)}
                    >
                      Approve
                    </button>
                    <button 
                      className="rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 text-sm font-medium transition-colors shadow-sm" 
                      onClick={() => reject(r.id)}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
