import { NextResponse } from "next/server";
import { requirePerson } from "@/lib/session";
import { requireOrigin, failure } from "@/lib/http";
import { perform, roomInput } from "@/lib/dataroom";

export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const person = await requirePerson();
    await perform(person, roomInput.parse(await request.json()));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
