import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePerson } from "@/lib/session";
import { requireOrigin, failure } from "@/lib/http";
import { review, subscribe, withdraw } from "@/lib/subscription-store";
import { reviewInput, subscribeInput, withdrawInput } from "@/lib/subscriptions";

const input = z.discriminatedUnion("action", [subscribeInput, withdrawInput, reviewInput]);

export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const person = await requirePerson();
    const body = input.parse(await request.json());
    if (body.action === "subscribe") return NextResponse.json(await subscribe(person, body));
    if (body.action === "withdraw") await withdraw(person, body.id, body.version);
    else await review(person, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
