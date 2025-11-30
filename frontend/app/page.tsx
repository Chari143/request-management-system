"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  useEffect(() => {
    if (user) router.replace("/requests");
  }, [user, router]);
  return (
    <div>
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <p className="mt-2">Use the navigation to sign in, create, approve, and close requests.</p>
    </div>
  );
}
