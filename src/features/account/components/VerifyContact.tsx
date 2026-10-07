import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAction } from "@/platform/ui/actions";
import { sendCode, verifyCode } from "../api";

/** Confirms an email address or mobile number with a 6-digit code. Shows "Verified" once done. */
export default function VerifyContact({ type, value, verified }: { type: "email" | "mobile"; value: string; verified: boolean }) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const contact = { contact_type: type, contact_value: value } as const;
  const send = useAction(() => sendCode(contact), { success: "Code sent", onDone: () => setSent(true) });
  const verify = useAction(() => verifyCode({ ...contact, otp_code: code }), { success: type === "email" ? "Email verified" : "Mobile number verified", refresh: [["account"]], onDone: () => setCode("") });
  const name = type === "email" ? "Email" : "Mobile number";

  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0"><div className="text-xs text-muted-foreground">{name}</div><div className="truncate text-sm font-medium">{value || "Not provided"}</div></div>
        {verified ? <span className="inline-flex items-center gap-1 text-sm text-emerald-400"><CheckCircle2 className="h-4 w-4" aria-hidden />Verified</span>
          : <Button size="sm" variant="outline" disabled={!value || send.isPending} onClick={() => send.mutate(undefined)}>{sent ? "Send again" : "Send code"}</Button>}
      </div>
      {!verified && sent && (
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); verify.mutate(undefined); }}>
          <Input aria-label={`${name} verification code`} inputMode="numeric" maxLength={6} placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          <Button type="submit" size="sm" disabled={code.length !== 6 || verify.isPending}>Verify</Button>
        </form>
      )}
    </div>
  );
}
