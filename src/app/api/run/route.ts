import { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { createClient } from "@vercel/kv";

const API_URL = process.env?.API_URL || "http://localhost:8080";
const API_TOKEN = process.env?.API_TOKEN || "";

const kv =
  process.env?.KV_REST_API_URL && process.env?.KV_REST_API_TOKEN
    ? createClient({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
    : null;

const ratelimit = kv
  ? new Ratelimit({
      redis: kv,
      // 10 requests from the same IP in 1 second
      limiter: Ratelimit.slidingWindow(100, "1 s"),
    })
  : null;

export async function POST(req: NextRequest) {
  const ip = req.ip ?? "::1";

  if (ratelimit) {
    const { remaining } = await ratelimit.limit(ip);

    if (remaining < 1) {
      return new Response("Too many requests", {
        status: 429,
      });
    }
  }

  const headers = new Headers();
  headers.set("Accept", `image/jpeg`);
  headers.set("Authorization", `Bearer ${API_TOKEN}`);
  headers.set(
    "Content-Type",
    req.headers.get("Content-Type") || "application/json",
  );
  const url = new URL("/run", API_URL);
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
