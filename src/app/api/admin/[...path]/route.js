import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const backendUrl = () => (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001").replace(/\/$/, "");

async function proxy(request, context) {
  const token = (await cookies()).get("spoken_odyssey_admin_session")?.value;
  if (!token) return NextResponse.json({ success: false, message: "Admin sign-in required." }, { status: 401 });

  const { path = [] } = await context.params;
  const target = `${backendUrl()}/api/admin/${path.map(encodeURIComponent).join("/")}${new URL(request.url).search}`;
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(request.headers.get("content-type") ? { "Content-Type": request.headers.get("content-type") } : {}),
      },
      ...(request.method === "GET" || request.method === "HEAD" ? {} : { body: await request.text() }),
      cache: "no-store",
    });
    const payload = await upstream.json();
    return NextResponse.json(payload, { status: upstream.status, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ success: false, message: "Could not connect to the admin service." }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
