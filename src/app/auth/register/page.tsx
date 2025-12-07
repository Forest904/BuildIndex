'use client';

import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(undefined);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.message ?? "Registration failed");
      }

      setMessage("Registered. Redirecting...");
      router.push("/");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-6 py-12">
      <Link href="/" className="text-sm text-cyan-200 hover:text-cyan-100">
        Back to viewer
      </Link>
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-8 shadow-xl backdrop-blur">
        <h1 className="text-2xl font-semibold text-slate-50">Register</h1>
        <p className="mt-2 text-sm text-slate-400">Create an account to save favourites later.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="username">
              Username
            </label>
            <Input
              id="username"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="nebula-fan"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300" htmlFor="password">
              Password (min 8 characters)
            </label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-cyan-500/80 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create account"}
          </button>
        </form>
        <p className="mt-3 text-xs text-slate-500">
          Already registered? <Link href="/auth/login" className="text-cyan-200">Login</Link>
        </p>
        {message && <p className="mt-4 text-xs text-amber-300">{message}</p>}
      </div>
    </div>
  );
}
