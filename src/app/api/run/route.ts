import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const headers = new Headers();
  headers.set("Accept", `image/jpeg`);
  headers.set(
    "Content-Type",
    req.headers.get("Content-Type") || "application/json",
  );
  const url = new URL("/run", "http://0.0.0.0:8080");
  const body = await req.text();

  const res = await fetch(url.toString(), {
    body: body,
    method: req.method,
    headers,
  });

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
}
