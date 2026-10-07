import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
export interface Props {
  email: string;
  name: string;
  idNumber: string;
  phone: string;
  emailCheckStatus: "unchecked" | "checking" | "exists" | "new";
  existingUserInfo: { name: string; userId: string } | null;
  errors: { email?: string; name?: string; idNumber?: string; phone?: string };
  emailLocked?: boolean;
  onEmailChange: (email: string) => void;
  onNameChange: (name: string) => void;
  onIdNumberChange: (idNumber: string) => void;
  onPhoneChange: (phone: string) => void;
  onNext: () => void;
}


export function SubscriberInfoStep(props: Props) {
  const [editing, setEditing] = useState('email');
  const fields = [
    { key: 'email', label: 'Email address', value: props.email, type: 'email', autocomplete: 'email', change: props.onEmailChange, error: props.errors.email },
    { key: 'name', label: 'Full name', value: props.name, type: 'text', autocomplete: 'name', change: props.onNameChange, error: props.errors.name },
    { key: 'idNumber', label: 'Identity number', value: props.idNumber, type: 'text', autocomplete: 'off', change: props.onIdNumberChange, error: props.errors.idNumber },
    { key: 'phone', label: 'Phone number', value: props.phone, type: 'tel', autocomplete: 'tel', change: props.onPhoneChange, error: props.errors.phone },
  ];
  const question = fields.find(field => field.key === editing);
  return <Card>
    <CardHeader><CardTitle>Who is subscribing?</CardTitle><CardDescription>We use existing details where available. Only the email address is required here.</CardDescription></CardHeader>
    <CardContent className="space-y-5">
      <dl className="space-y-3">{fields.map(field => <div key={field.key} className="flex items-center justify-between gap-3">
        <div className="min-w-0 break-words"><dt className="text-sm text-muted-foreground">{field.label}{field.key !== 'email' && ' (optional)'}</dt><dd>{field.value || 'Not supplied'}</dd></div>
        <Button type="button" variant="ghost" onClick={() => setEditing(field.key)} disabled={field.key === 'email' && props.emailLocked} aria-label={'Edit ' + field.label.toLowerCase()}>Edit</Button>
      </div>)}</dl>
      {question && <div className="rounded-lg border border-border bg-background p-4 space-y-3">
        <Label htmlFor={'subscriber-' + question.key}>What is the subscriber’s {question.label.toLowerCase()}?</Label>
        <Input key={question.key} autoFocus id={'subscriber-' + question.key} type={question.type} autoComplete={question.autocomplete} value={question.value} onChange={event => question.change(event.target.value)} disabled={question.key === 'email' && props.emailLocked} aria-invalid={Boolean(question.error)} aria-describedby={question.error ? 'subscriber-error' : undefined}/>
        {question.error && <p id="subscriber-error" role="alert" className="text-sm text-destructive">{question.error}</p>}
        <Button type="button" variant="outline" onClick={() => setEditing('')}>Done</Button>
      </div>}
      <div role="status" className="text-sm text-muted-foreground">
        {props.emailCheckStatus === 'checking' && 'Looking up existing details…'}
        {props.emailCheckStatus === 'exists' && props.existingUserInfo && 'Existing Citizen profile found: ' + props.existingUserInfo.name}
        {props.emailCheckStatus === 'new' && 'An invitation will be sent after the subscription is created.'}
      </div>
      <Button type="button" className="w-full sm:w-auto" onClick={props.onNext} disabled={!props.email.trim() || !props.email.includes('@') || Boolean(props.errors.email) || props.emailCheckStatus === 'checking'}>Continue to share selection</Button>
    </CardContent>
  </Card>;
}
