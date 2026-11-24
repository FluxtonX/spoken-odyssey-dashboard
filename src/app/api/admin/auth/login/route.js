import { NextResponse } from "next/server";

const backendUrl = () => (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001").replace(/\/$/, "");

export async function POST(request) {
  try {
    const body = await request.json();
    const upstream = await fetch(`${backendUrl()}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const payload = await upstream.json();
    if (!upstream.ok || !payload.success) return NextResponse.json(payload, { status: upstream.status });
    const response = NextResponse.json({ success: true, data: payload.data });
    response.cookies.set("spoken_odyssey_admin_session", payload.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch {
    return NextResponse.json({ success: false, message: "Could not connect to the admin service." }, { status: 502 });
  }
}
