import { NextResponse } from "next/server";
import { requirePerson } from "@/lib/session";
import { requireOrigin, failure } from "@/lib/http";
import { changeRoles, roleChange } from "@/lib/users";

export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const person = await requirePerson();
    await changeRoles(person, roleChange.parse(await request.json()));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
