'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { InvestorPortfolio } from './InvestorPortfolio';

type Mode = 'investment' | 'board' | 'cap_table';
type Subscription = { subscription_id: string; full_name: string; share_class: string; num_shares: number;
  total_amount: number; amount_paid: number; status: string; created_by_admin: boolean };
type Member = { user_id: string; full_name: string; email: string; position: string; term_end_date: string; status: string; version: number };
type Candidate = Pick<Member,'user_id'|'full_name'|'email'>;
type Investor = Candidate & { person_id:string; contact_status:string; activation_status:string; phone: string | null; investment_purpose: string | null; version: number };
type Holding = { source_id: string; source_sheet: string; source_row: number; holder: string; kind: string; reference: string | null; quantity: number;
  source_status: string; reconciliation_status: string; source_date: string; review_note?: string | null; units_under_review?: number | null };
type Workspace = { subscriptions?: Subscription[]; members?: Member[]; investors?: Investor[];
  records?: Holding[]; positions?: {code:string;label:string}[]; offer?: {min_shares:number;price_per_share:number} };
const titles = {investment:'Investors and subscriptions',board:'Board appointments',cap_table:'Cap table reconciliation'};
const labels: Record<string,string> = {member_register:'Members register',early_subscription:'Early Class B subscriptions',
  safe_schedule:'SAFE schedule',form_reconciliation:'Form reconciliation'};
const units = (number: number) => new Intl.NumberFormat('en-ZA').format(number);
const money = (number: number) => new Intl.NumberFormat('en-ZA', {style:'currency', currency:'ZAR'}).format(number);
const website = process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://citizenbank.co.ls';

async function request<T>(operation: string, data?: Record<string,unknown>): Promise<T> {
  const response = await fetch('/api/institutional-operations', {
    method: 'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({operation,data}),
    signal: AbortSignal.timeout(30000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) throw new Error(result?.error || 'The operation could not be confirmed. Retry.');
  return result as T;
}

export function InstitutionalWorkspace({ mode }: { mode: Mode }) {
  const [data, setData] = useState<Workspace>();
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('member_register');
  const [action, setAction] = useState<'subscribe'|'appoint'|'edit'|'payment'|'investor'>();
  const [portfolio,setPortfolio] = useState<string>();
  const [investor, setInvestor] = useState<Investor>();
  const [selected, setSelected] = useState<Member>();
  const [subscription, setSubscription] = useState<Subscription>();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [busy, setBusy] = useState(false);
  const operationKey = useRef('');
  const dialog = useRef<HTMLDialogElement>(null);

  const load = useCallback(async () => {
    setError('');
    try { setData(await request<Workspace>(mode+'.list')); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not load records.'); }
  }, [mode]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (action && !dialog.current?.open) dialog.current?.showModal();
    if (!action && dialog.current?.open) dialog.current.close();
  }, [action]);

  function open(next: typeof action) {
    setFormError('');
    setCandidates([]);
    operationKey.current = crypto.randomUUID();
    setAction(next);
  }

  async function findCandidates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    setBusy(true);
    try {
      const value = new FormData(event.currentTarget).get('search');
      const result = await request<{candidates:Candidate[]}>('board.candidates',{search:value});
      setCandidates(result.candidates);
      if (!result.candidates.length) setFormError('No active registered candidates match that search.');
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Candidate search failed.');
    } finally { setBusy(false); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !action) return;
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    setBusy(true);
    setFormError('');
    try {
      let message = 'Saved.';
      if (action === 'subscribe') {
        const result = await request<{subscription_id?:string}>('investment.subscribe', {
          ...form, num_shares:Number(form.num_shares), share_class:'Class B', payment_method:'bank_transfer',
          idempotency_key:operationKey.current,
        });
        if (!result.subscription_id) throw new Error('The subscription reference was not confirmed. Retry.');
        message = 'Subscription '+result.subscription_id+' saved. Confirmation queued.';
      } else if (action === 'payment') {
        const result = await request<{success:boolean;document_issues:string[]}>('investment.payment', {
          ...form, amount:Number(form.amount), subscription_id:subscription?.subscription_id,
        });
        if (!result.success) throw new Error('Payment could not be confirmed.');
        message = result.document_issues?.length ? 'Payment saved. Review pending documents on the website.' : 'Payment recorded.';
      } else if (action === 'investor') {
        const result = await request<{saved:boolean}>('investment.update', {...form,user_id:investor?.user_id,version:investor?.version});
        if (!result.saved) throw new Error('The investor update could not be confirmed.');
      } else {
        const result = action === 'appoint'
          ? await request<{success:boolean}>('board.appoint',{...form, term_years:Number(form.term_years)})
          : await request<{saved:boolean}>('board.update',{...form,user_id:selected?.user_id,version:selected?.version});
        if (!('success' in result ? result.success : result.saved)) throw new Error('The board change could not be confirmed.');
      }
      setAction(undefined);
      setNotice(message);
      await load();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'The save could not be confirmed.');
    } finally { setBusy(false); }
  }

  const matches = (...values: (string | null | undefined)[]) => values.some(value => value?.toLowerCase().includes(search.trim().toLowerCase()));
  const records = data?.records || [];
  const positions = data?.positions || [];

  return <section className="panel">
    <h1>{titles[mode]}</h1>
    <div className="button-row">
      <a className="button" href={'/workspaces/'+(mode==='board'?'governance':'invest')}>Back to workspace</a>
      {mode==='investment' && data?.offer && <button className="button primary" onClick={()=>open('subscribe')}>Subscribe on behalf</button>}
      {mode==='board' && data && <button className="button primary" onClick={()=>open('appoint')}>Appoint board member</button>}
      {mode!=='cap_table' && <a className="button" href={website+(mode==='board'?'/back-office-board-members':'/back-office-subscriptions')}>Open website back office</a>}
    </div>
    {error && <p role="alert">{error} <button className="button" onClick={()=>void load()}>Retry</button></p>}
    {notice && <p role="status">{notice}</p>}
    {!data && !error && <p role="status">Loading records…</p>}
    {data && <label>Search <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, email or reference"/></label>}
    {mode==='investment' && data && <>
      <h2>Subscriptions</h2>
      {(data.subscriptions||[]).filter(s=>matches(s.full_name,s.subscription_id)).map(s=><article className="activity-row" key={s.subscription_id}>
        <strong>{s.full_name}</strong><small>{s.subscription_id} · {units(s.num_shares)} shares · {s.status} · {money(s.amount_paid)} of {money(s.total_amount)} paid</small>
        {s.created_by_admin && s.status!=='cancelled' && s.amount_paid<s.total_amount && <button className="button" onClick={()=>{setSubscription(s);open('payment');}}>Record payment</button>}
      </article>)}
      {!data.subscriptions?.length && <p>No subscriptions recorded.</p>}
      <h2>Investor profiles</h2>
      {(data.investors||[]).filter(p=>matches(p.full_name,p.email)).map(p=><article className="activity-row" key={p.user_id}><strong>{p.full_name}</strong><small>{p.email||'Contact details needed'} · {p.activation_status}</small><button className="button" onClick={()=>setPortfolio(p.person_id)}>View portfolio</button><button className="button" onClick={()=>{setInvestor(p);open('investor');}}>Edit investor details</button></article>)}
      <p><a className="button" href="/cap-table">Open cap table reconciliation</a></p>
    </>}
    {mode==='board' && data && <>
      {(data.members||[]).filter(m=>matches(m.full_name,m.email,m.position)).map(m=><article className="activity-row" key={m.user_id}>
        <strong>{m.full_name}</strong><small>{positions.find(p=>p.code===m.position)?.label||m.position} · {m.status} · {m.term_end_date||'Term end pending'}</small>
        <button className="button" onClick={()=>{setSelected(m);open('edit');}}>Edit appointment</button>
      </article>)}
      {!data.members?.length && <p>No board appointments recorded.</p>}
    </>}
    {mode==='cap_table' && data && <>
      <p>Working records for reconciliation. Only the members register contributes to the working share total. Subscription and SAFE schedules are separate evidence. The live Class A, B and C allocation is managed separately.</p>
      <p><strong>{units(records.filter(r=>r.kind==='member_register').reduce((sum,r)=>sum+Number(r.quantity),0))}</strong> shares in the working register</p>
      <label>Source schedule <select value={kind} onChange={e=>setKind(e.target.value)}>{Object.entries(labels).map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label>
      {records.filter(r=>r.kind===kind && matches(r.holder,r.reference)).map(r=><article className="activity-row" key={JSON.stringify([r.source_id,r.source_sheet,r.source_row])}>
        <strong>{r.holder}</strong><small>{units(r.quantity)} {r.kind==='member_register'?'shares':'source units'} · {r.reference||'No reference'} · {r.source_date} / row {r.source_row}</small>
        <small>{r.source_status} · {r.reconciliation_status.replaceAll('_',' ')}</small>
        {r.review_note && <p>{r.units_under_review ? <strong>{units(r.units_under_review)} units under review. </strong> : null}{r.review_note}</p>}
      </article>)}
      {!records.length && <p>No working register has been loaded.</p>}
    </>}
    {portfolio&&<InvestorPortfolio personId={portfolio} onClose={()=>setPortfolio(undefined)}/>}
    <dialog ref={dialog} className="panel" onCancel={event=>{event.preventDefault();if(!busy)setAction(undefined);}}>
      {action && <>
        <h2>{action==='subscribe'?'Subscribe on behalf':action==='payment'?'Record verified payment':action==='appoint'?'Appoint board member':action==='investor'?'Edit investor details':'Edit appointment'}</h2>
        {action==='appoint' && <form className="readiness-form" onSubmit={findCandidates}><label>Find registered user<input name="search" required minLength={2} placeholder="Example: name or email"/></label><button className="button" disabled={busy}>Search</button></form>}
        <form key={action+String(selected?.user_id||'')} className="readiness-form" onSubmit={save}>
          {action==='subscribe' && <>
            <label>Full name<input name="full_name" required placeholder="Example: Thabo Mokoena"/></label>
            <label>Email<input name="email" type="email" required placeholder="name@example.com"/></label>
            <label>Identity or registration reference<input name="id_number" required placeholder="Example: passport or company number"/></label>
            <label>Phone<input name="phone" type="tel" required placeholder="+266 5000 0000"/></label>
            <label>Class B shares<input name="num_shares" type="number" required min={1} placeholder={String(data?.offer?.min_shares||1000)}/></label>
          </>}
          {action==='investor' && <>
            <p>{investor?.full_name} · {investor?.email}</p>
            <label>Phone<input name="phone" type="tel" maxLength={30} defaultValue={investor?.phone||''} placeholder="+266 5000 0000"/></label>
            <label>Investment purpose<textarea name="investment_purpose" maxLength={300} defaultValue={investor?.investment_purpose||''} placeholder="Example: Long-term ownership"/></label>
          </>}
          {action==='payment' && <>
            <p>{subscription?.subscription_id} · {subscription?.full_name}</p>
            <label>Amount received (ZAR)<input name="amount" type="number" step="0.01" min="0.01" required placeholder="500.00"/></label>
            <label>Payment reference<input name="payment_reference" required placeholder="Example: Bank transfer reference"/></label>
            <label>Note<textarea name="notes" placeholder="Example: Matched to receiving bank statement"/></label>
            <label><input type="checkbox" required/> I verified this payment against the bank record.</label>
          </>}
          {action==='appoint' && <>
            <label>Candidate<select name="user_id" required defaultValue=""><option value="">Select a search result</option>{candidates.map(c=><option value={c.user_id} key={c.user_id}>{c.full_name} ({c.email})</option>)}</select></label>
            <label>Term in years<input name="term_years" type="number" min={1} max={10} defaultValue={3} required/></label>
          </>}
          {(action==='appoint'||action==='edit') && <label>Board position<select name="position" required defaultValue={positions.find(p=>p.code===selected?.position||p.label===selected?.position)?.code||''}><option value="">Select a position</option>{positions.map(p=><option key={p.code} value={p.code}>{p.label}</option>)}</select></label>}
          {action==='edit' && <>
            <label>Term end<input name="term_end_date" type="date" required defaultValue={selected?.term_end_date}/></label>
            <label>Status<select name="status" defaultValue={selected?.status}>{['active','inactive','resigned','removed'].map(status=><option key={status}>{status}</option>)}</select></label>
          </>}
          {formError && <p role="alert">{formError}</p>}
          <div className="button-row"><button className="button primary" disabled={busy||(action==='appoint'&&!candidates.length)}>{busy?'Please wait…':'Save'}</button><button className="button" type="button" disabled={busy} onClick={()=>setAction(undefined)}>Cancel</button></div>
        </form>
      </>}
    </dialog>
  </section>;
}
