"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Scissors, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        setMessage(
          "Account created. Check your email to confirm, then sign in."
        );
        setMode("signin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Signature mark */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-(--color-thread) flex items-center justify-center mb-4 rotate-3">
            <Scissors className="w-7 h-7 text-white -rotate-3" strokeWidth={2.25} />
          </div>
          <h1 className="font-(family-name:--font-display) text-2xl font-semibold tracking-tight">
            DDSMS
          </h1>
          <p className="text-sm text-(--color-ink-soft) mt-1 text-center">
            Design Development &amp; Sampling
          </p>
        </div>

        <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-6 shadow-sm">
          <div className="flex gap-1 mb-6 bg-(--color-paper) rounded-lg p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "signin"
                  ? "bg-(--color-surface) text-(--color-ink) shadow-sm"
                  : "text-(--color-ink-soft)"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "signup"
                  ? "bg-(--color-surface) text-(--color-ink) shadow-sm"
                  : "text-(--color-ink-soft)"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium mb-1.5">
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-thread) focus:border-transparent"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-thread) focus:border-transparent"
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-thread) focus:border-transparent"
                placeholder="••••••••"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>

            {error && (
              <p className="text-sm text-(--color-status-issue) bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {message && (
              <p className="text-sm text-(--color-status-done) bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-(--color-thread) text-white rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99] transition-transform"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-(--color-ink-soft) mt-6">
          Replaces notebooks, Excel registers &amp; WhatsApp photo threads
        </p>
      </div>
    </div>
  );
}
