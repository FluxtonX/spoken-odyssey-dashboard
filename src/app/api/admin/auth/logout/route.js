import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const token = (await cookies()).get("spoken_odyssey_admin_session")?.value;
  if (token) {
    try {
      const backendUrl = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001").replace(/\/$/, "");
      await fetch(`${backendUrl}/api/admin/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    } catch {}
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set("spoken_odyssey_admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
