"use client";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";

export default function NavBar() {
  const { user, logout } = useAuth();
  return (
    <nav className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
      <Link href="/" className="font-semibold text-2xl">Request Management</Link>
      <div className="flex items-center gap-3 text-sm">
        {user && <Link className="hover:underline" href="/requests">Requests</Link>}
        {user?.role === "MANAGER" && (
          <Link className="hover:underline" href="/approvals">Approvals</Link>
        )}
        {!user ? (
          <>
            <Link className="hover:underline" href="/signin">Sign in</Link>
            <Link className="hover:underline" href="/signup">Sign up</Link>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="rounded bg-zinc-200 px-2 py-1 text-xs">{user.role}</span>
            <button className="rounded bg-black text-white px-3 py-1" onClick={logout}>Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
}
