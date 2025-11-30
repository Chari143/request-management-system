"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function SignUpPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"EMPLOYEE" | "MANAGER">("EMPLOYEE");
  const [managerName, setManagerName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; name?: string; password?: string; managerName?: string }>({});

  const signUpSchema = z
    .object({
      email: z.string().min(1, "email is required").email("email is invalid"),
      name: z.string().min(2, "name must be at least 2 characters"),
      password: z.string().min(6, "password must be at least 6 characters"),
      role: z.enum(["EMPLOYEE", "MANAGER"]),
      managerName: z.string().optional(),
    })
    .superRefine((val, ctx) => {
      if (val.role === "EMPLOYEE") {
        if (!val.managerName || val.managerName.trim() === "") {
          ctx.addIssue({ code: "custom", path: ["managerName"], message: "manager name is required" });
        }
      }
    });

  

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      type SignupBody = { email: string; name: string; password: string; role: "EMPLOYEE" | "MANAGER"; managerName?: string };
      const body: SignupBody = { email, name, password, role };
      if (role === "EMPLOYEE" && managerName) body.managerName = managerName;

      const parsed = signUpSchema.safeParse({ email, name, password, role, managerName });
      if (!parsed.success) {
        const flat = parsed.error.flatten().fieldErrors as Record<string, string[]>;
        const fe: { email?: string; name?: string; password?: string; managerName?: string } = {};
        if (flat.email?.[0]) fe.email = flat.email[0];
        if (flat.name?.[0]) fe.name = flat.name[0];
        if (flat.password?.[0]) fe.password = flat.password[0];
        if (flat.managerName?.[0]) fe.managerName = flat.managerName[0];
        setFieldErrors(fe);
        return;
      }

      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.fieldErrors) {
          const serverFields = data.error.fieldErrors as Record<string, string[]>;
          const fe: { email?: string; name?: string; password?: string; managerName?: string } = {};
          if (serverFields.email?.[0]) fe.email = serverFields.email[0];
          if (serverFields.name?.[0]) fe.name = serverFields.name[0];
          if (serverFields.password?.[0]) fe.password = serverFields.password[0];
          if (serverFields.managerName?.[0]) fe.managerName = serverFields.managerName[0];
          setFieldErrors(fe);
          setError(null);
          return;
        }
        let errorMsg = "Signup failed";
        if (typeof data.error === "string") errorMsg = data.error;
        else if (typeof data.error === "object") errorMsg = JSON.stringify(data.error);
        throw new Error(errorMsg);
      }
      
      router.push("/signin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-10">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-semibold mb-4 text-center">Sign up</h1>
        <form onSubmit={submit} className="space-y-4">
          <input 
            className="w-full rounded border border-gray-200 px-3 py-2" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
            }} 
          />
          <div className="h-4">{fieldErrors.email && <p className="text-red-600 text-xs">{fieldErrors.email}</p>}</div>
          <input 
            className="w-full rounded border border-gray-200 px-3 py-2" 
            placeholder="Name" 
            value={name} 
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined }));
            }} 
          />
          <div className="h-4">{fieldErrors.name && <p className="text-red-600 text-xs">{fieldErrors.name}</p>}</div>
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
          <div className="h-4">{fieldErrors.password && <p className="text-red-600 text-xs">{fieldErrors.password}</p>}</div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Role</label>
            <select 
              className="w-full rounded border border-gray-200 px-3 py-2 bg-white" 
              value={role} 
              onChange={(e) => setRole(e.target.value as "EMPLOYEE" | "MANAGER")}
            > 
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>
          {role === "EMPLOYEE" && (
            <input 
              className="w-full rounded border border-gray-200 px-3 py-2" 
              placeholder="Manager name" 
              value={managerName} 
              onChange={(e) => {
                setManagerName(e.target.value);
                if (fieldErrors.managerName) setFieldErrors(prev => ({ ...prev, managerName: undefined }));
              }} 
            />
          )}
          {role === "EMPLOYEE" && (
            <div className="h-4">{fieldErrors.managerName && <p className="text-red-600 text-xs">{fieldErrors.managerName}</p>}</div>
          )}
          <div className="h-5">{error && <p className="text-red-600 text-sm text-center">{error}</p>}</div>
          <button 
            disabled={loading} 
            className="w-full rounded bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating..." : "Sign up"}
          </button>
        </form>
        <p className="text-xs text-zinc-500 mt-4 text-center">Create a manager account first, then employees with the manager name.</p>
      </div>
    </div>
  );
}
