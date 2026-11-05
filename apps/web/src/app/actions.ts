"use server";

export type EnquiryState = { status: "idle" | "success" | "error"; message: string };

export async function submitEnquiry(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  const payload = Object.fromEntries(formData.entries());
  const api = process.env.API_URL ?? "http://localhost:4000";
  try {
    const res = await fetch(`${api}/api/v1/enquiries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (res.status === 400) return { status: "error", message: "Please check your details and try again." };
    if (!res.ok) return { status: "error", message: "We could not save your enquiry right now. Please try again later." };
    return { status: "success", message: "Thank you! Your enquiry has been received. We will be in touch soon." };
  } catch {
    return { status: "error", message: "We could not reach the server. Please try again later." };
  }
}
