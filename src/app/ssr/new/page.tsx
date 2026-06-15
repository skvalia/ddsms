"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ChevronLeft, Loader2 } from "lucide-react";
import type { Party, Dssr } from "@/types/database";

function NewSsrForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [userName, setUserName] = useState("User");
  const [userId, setUserId] = useState("");
  const [parties, setParties] = useState<Party[]>([]);
  const [dssrs, setDssrs] = useState<Dssr[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    ssr_number: "",
    sample_no: "",
    party_id: "",
    dssr_id: "",
    design_number: "",
    fabric: "",
    yarn: "",
    sample_type: "",
    machine: "",
    operator: "",
    sample_purpose: "",
    remarks: "",
    dyeing_required: false,
    dyeing_name: "",
  });

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? "");
      const { data: profile } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", auth.user?.id ?? "")
        .maybeSingle();
      setUserName(profile?.full_name || auth.user?.email || "User");

      const [{ data: p }, { data: d }] = await Promise.all([
        supabase.from("parties").select("*").order("name"),
        supabase.from("dssr").select("*").order("dssr_number"),
      ]);
      setParties((p as Party[]) ?? []);
      setDssrs((d as Dssr[]) ?? []);

      const dssrParam = searchParams.get("dssr");
      if (dssrParam) {
        const match = (d as Dssr[] | null)?.find((row) => row.id === dssrParam);
        if (match) {
          setForm((prev) => ({
            ...prev,
            dssr_id: match.id,
            design_number: match.design_number || prev.design_number,
            party_id: match.party_id || prev.party_id,
          }));
        }
      }
    })();
  }, [supabase, searchParams]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.ssr_number.trim()) {
      setError("SSR Number is required");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("ssr")
      .insert({
        ssr_number: form.ssr_number.trim(),
        sample_no: form.sample_no || null,
        party_id: form.party_id || null,
        dssr_id: form.dssr_id || null,
        design_number: form.design_number || null,
        fabric: form.fabric || null,
        yarn: form.yarn || null,
        sample_type: form.sample_type || null,
        machine: form.machine || null,
        operator: form.operator || null,
        sample_purpose: form.sample_purpose || null,
        remarks: form.remarks || null,
        dyeing_required: form.dyeing_required,
        dyeing_name: form.dyeing_name || null,
        status: "YTR",
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    await supabase.from("activity_logs").insert({
      entity_type: "ssr",
      entity_id: data.id,
      action: "created",
      description: `SSR ${form.ssr_number} created`,
      created_by: userId,
    });

    router.push(`/ssr/${data.id}`);
  }

  return (
    <AppShell userName={userName}>
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-(--color-ink-soft) mb-4 -ml-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="font-(family-name:--font-display) text-2xl font-semibold tracking-tight mb-1">
          New Sample (SSR)
        </h1>
        <p className="text-sm text-(--color-ink-soft) mb-6">
          Add a new sample execution to the Sampling Status Register
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="SSR Number *">
              <input
                value={form.ssr_number}
                onChange={(e) => update("ssr_number", e.target.value)}
                required
                className="input"
                placeholder="e.g. 25261"
              />
            </Field>
            <Field label="Sample No">
              <input
                value={form.sample_no}
                onChange={(e) => update("sample_no", e.target.value)}
                className="input"
                placeholder="e.g. SMP-066"
              />
            </Field>
          </div>

          <Field label="Design Number">
            <input
              value={form.design_number}
              onChange={(e) => update("design_number", e.target.value)}
              className="input"
              placeholder="e.g. KB-8-1007878"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Party">
              <select
                value={form.party_id}
                onChange={(e) => update("party_id", e.target.value)}
                className="input"
              >
                <option value="">Select party</option>
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Linked DSSR">
              <select
                value={form.dssr_id}
                onChange={(e) => update("dssr_id", e.target.value)}
                className="input"
              >
                <option value="">None</option>
                {dssrs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.dssr_number} {d.design_number ? `– ${d.design_number}` : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Fabric">
              <input
                value={form.fabric}
                onChange={(e) => update("fabric", e.target.value)}
                className="input"
                placeholder="e.g. Royalty 44&quot;"
              />
            </Field>
            <Field label="Yarn">
              <input
                value={form.yarn}
                onChange={(e) => update("yarn", e.target.value)}
                className="input"
                placeholder="e.g. 150/2 Fluffy Bright"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Sample Type">
              <select
                value={form.sample_type}
                onChange={(e) => update("sample_type", e.target.value)}
                className="input"
              >
                <option value="">Select type</option>
                <option value="Schiffli">Schiffli</option>
                <option value="Aari">Aari</option>
                <option value="Multy">Multy</option>
              </select>
            </Field>
            <Field label="Machine">
              <input
                value={form.machine}
                onChange={(e) => update("machine", e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Operator">
              <input
                value={form.operator}
                onChange={(e) => update("operator", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Sample Purpose">
              <input
                value={form.sample_purpose}
                onChange={(e) => update("sample_purpose", e.target.value)}
                className="input"
                placeholder="e.g. Party Approval"
              />
            </Field>
          </div>

          <Field label="Remarks">
            <textarea
              value={form.remarks}
              onChange={(e) => update("remarks", e.target.value)}
              className="input min-h-20"
            />
          </Field>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dyeing_required"
              checked={form.dyeing_required}
              onChange={(e) => update("dyeing_required", e.target.checked)}
              className="w-4 h-4 rounded accent-(--color-thread)"
            />
            <label htmlFor="dyeing_required" className="text-sm font-medium">
              Dyeing required
            </label>
          </div>

          {form.dyeing_required && (
            <Field label="Dyeing Unit">
              <input
                value={form.dyeing_name}
                onChange={(e) => update("dyeing_name", e.target.value)}
                className="input"
                placeholder="e.g. Chur Textile"
              />
            </Field>
          )}

          {error && (
            <p className="text-sm text-(--color-status-issue) bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-(--color-thread) text-white rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99] transition-transform"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Sample
          </button>
        </form>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--color-line);
          background: var(--color-paper);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px var(--color-thread);
          border-color: transparent;
        }
      `}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 text-(--color-ink-soft)">{label}</label>
      {children}
    </div>
  );
}

export default function NewSsrPage() {
  return (
    <Suspense fallback={null}>
      <NewSsrForm />
    </Suspense>
  );
}
