"use client";
import { useActionState } from "react";
import { submitEnquiry, type EnquiryState } from "./actions";

export default function EnquiryForm(){
 const [state, formAction, pending] = useActionState(submitEnquiry, { status: "idle", message: "" } as EnquiryState);
 return <form className="rounded-2xl border border-white/10 bg-white/[.05] p-6" action={formAction}>
  <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm text-slate-200">Your name<input name="name" required minLength={2} maxLength={100} className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-3 text-white outline-none focus:border-gold" placeholder="Full name"/></label><label className="text-sm text-slate-200">Email address<input name="email" type="email" required className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-3 text-white outline-none focus:border-gold" placeholder="you@company.com"/></label></div>
  <label className="mt-4 block text-sm text-slate-200">Company (optional)<input name="company" maxLength={120} className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-3 text-white outline-none focus:border-gold" placeholder="Company name"/></label>
  <label className="mt-4 block text-sm text-slate-200">What do you need?<select name="service" required className="mt-2 w-full rounded-lg border border-white/15 bg-[#172630] px-3 py-3 text-white outline-none focus:border-gold"><option value="">Choose a service</option><option>AI Marketing</option><option>Creative Studio</option><option>Business Automation</option><option>Business Intelligence</option><option>AI Marketing Cloud</option><option>Other</option></select></label>
  <label className="mt-4 block text-sm text-slate-200">Tell us about your goals<textarea name="message" required minLength={10} maxLength={3000} rows={4} className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-3 text-white outline-none focus:border-gold" placeholder="What would you like to achieve?"/></label>
  <button disabled={pending} className="mt-5 w-full rounded-full bg-gold px-6 py-4 text-sm font-bold text-ink transition hover:bg-amber-300">{pending ? "Sending..." : "Send enquiry →"}</button>{state.message && <p role="status" className={`mt-4 rounded-lg p-3 text-sm ${state.status === "success" ? "bg-emerald-900/50 text-emerald-200" : "bg-red-900/50 text-red-200"}`}>{state.message}</p>}<p className="mt-3 text-xs text-slate-400">Submitting this form sends your details to G-PLAN for follow-up. A privacy notice and consent controls should be added before public production launch.</p>
 </form>
}
