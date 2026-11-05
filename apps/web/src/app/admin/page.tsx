import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createHash, timingSafeEqual } from "node:crypto";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin | G-PLAN", robots: { index: false, follow: false } };

type Enquiry = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  service: string;
  message: string;
  status: string;
  createdAt: string;
};

const COOKIE = "gplan_admin";
const adminKey = () => process.env.ADMIN_KEY ?? "";
const token = () => createHash("sha256").update("gplan-admin:" + adminKey()).digest("hex");

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

async function login(formData: FormData) {
  "use server";
  const given = String(formData.get("key") ?? "");
  if (adminKey().length < 16 || !same(given, adminKey())) redirect("/admin?error=1");
  (await cookies()).set(COOKIE, token(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect("/admin");
}

async function logout() {
  "use server";
  (await cookies()).delete(COOKIE);
  redirect("/admin");
}

async function setStatus(formData: FormData) {
  "use server";
  const jar = await cookies();
  if (!(adminKey().length >= 16 && same(jar.get(COOKIE)?.value ?? "", token()))) redirect("/admin");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  await fetch(`${process.env.API_URL ?? "http://localhost:4000"}/api/v1/admin/enquiries/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "x-admin-key": adminKey(), "content-type": "application/json" },
    body: JSON.stringify({ status }),
    cache: "no-store",
  });
  revalidatePath("/admin");
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const jar = await cookies();
  const authed = adminKey().length >= 16 && same(jar.get(COOKIE)?.value ?? "", token());

  if (!authed) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-sm">
          <h1 className="text-2xl font-semibold">G-PLAN Admin</h1>
          <p className="mt-2 text-sm text-slate-400">Enter the admin key to view enquiries.</p>
          <form action={login} className="mt-6">
            <input name="key" type="password" required placeholder="Admin key" className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm" />
            <button type="submit" className="mt-4 w-full rounded-full bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-900">Sign in</button>
          </form>
          {error && <p className="mt-4 rounded-lg bg-red-900/50 p-3 text-sm text-red-200">That key was not correct.</p>}
          {adminKey().length < 16 && <p className="mt-4 text-xs text-slate-500">ADMIN_KEY is not set for the web app yet.</p>}
        </div>
      </main>
    );
  }

  let enquiries: Enquiry[] = [];
  let failed = false;
  try {
    const res = await fetch(`${process.env.API_URL ?? "http://localhost:4000"}/api/v1/admin/enquiries`, {
      headers: { "x-admin-key": adminKey() },
      cache: "no-store",
    });
    if (!res.ok) failed = true;
    else enquiries = (await res.json()).data as Enquiry[];
  } catch {
    failed = true;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Enquiries ({enquiries.length})</h1>
          <form action={logout}>
            <button type="submit" className="rounded-full border border-white/20 px-4 py-2 text-xs">Sign out</button>
          </form>
        </div>
        {failed && <p className="mt-6 rounded-lg bg-red-900/50 p-3 text-sm text-red-200">Could not load enquiries. Check that the API is running.</p>}
        {!failed && enquiries.length === 0 && <p className="mt-6 text-sm text-slate-400">No enquiries yet.</p>}
        <ul className="mt-6 space-y-4">
          {enquiries.map((e) => (
            <li key={e.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{e.name}</p>
                <span className="rounded-full bg-emerald-900/60 px-3 py-1 text-xs text-emerald-200">{e.status}</span>
              </div>
              <p className="mt-1 text-sm text-slate-300">
                <a href={`mailto:${e.email}`} className="underline">{e.email}</a>
                {e.company ? ` · ${e.company}` : ""}
              </p>
              <p className="mt-3 text-xs uppercase tracking-wide text-amber-300">{e.service}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{e.message}</p>
              <p className="mt-3 text-xs text-slate-500">
                {new Date(e.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" })}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`mailto:${e.email}?subject=${encodeURIComponent("Re: your G-PLAN enquiry")}`} className="rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-900">Reply by email</a>
                {[["CONTACTED", "Mark contacted"], ["QUALIFIED", "Qualified"], ["CLOSED", "Close"], ["SPAM", "Spam"]].map(([s, label]) => (
                  <form key={s} action={setStatus}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="status" value={s} />
                    <button type="submit" disabled={e.status === s} className="rounded-full border border-white/20 px-4 py-2 text-xs disabled:opacity-40">{label}</button>
                  </form>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
