"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { z } from "zod";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function SignInPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const signInSchema = z.object({
    email: z.string().min(1, "email is required").email("email is invalid"),
    password: z.string().min(6, "password must be at least 6 characters"),
  });

  useEffect(() => {
    if (user) router.replace("/requests");
  }, [user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const parsed = signInSchema.safeParse({ email, password });
      if (!parsed.success) {
        const flat = parsed.error.flatten().fieldErrors;
        const fe: { email?: string; password?: string } = {};
        if (flat.email?.[0]) fe.email = flat.email[0];
        if (flat.password?.[0]) fe.password = flat.password[0];
        setFieldErrors(fe);
        return;
      }
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.fieldErrors) {
          const serverFields = data.error.fieldErrors as Record<string, string[]>;
          const fe: { email?: string; password?: string } = {};
          if (serverFields.email?.[0]) fe.email = serverFields.email[0];
          if (serverFields.password?.[0]) fe.password = serverFields.password[0];
          setFieldErrors(fe);
          setError(null);
          return;
        }
        let errorMsg = "Login failed";
        if (typeof data.error === "string") errorMsg = data.error;
        else if (typeof data.error === "object") errorMsg = JSON.stringify(data.error);
        throw new Error(errorMsg);
      }

      login(data.token, data.user);
      router.push("/requests");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-10">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
        <form onSubmit={submit} className="space-y-4 w-full">
          <input 
            className="w-full rounded border border-gray-200 px-3 py-2" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
            }} 
          />
          <div className="h-4">
            {fieldErrors.email && <p className="text-red-600 text-xs">{fieldErrors.email}</p>}
          </div>
          <input 
            className="w-full rounded border border-gray-200 px-3 py-2" 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
            }} 
          />
          <div className="h-4">
            {fieldErrors.password && <p className="text-red-600 text-xs">{fieldErrors.password}</p>}
          </div>
          <div className="h-5">
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          </div>
          <button 
            disabled={loading} 
            className="w-full rounded bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 disabled:opacity-50 transition-colors"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
