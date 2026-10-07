import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { PageState } from "@/platform/ui/PageState";
import { DataTable, PageHeader, Stat, Status } from "@/platform/ui/kit";
import { date, label, number } from "@/platform/format";
import * as api from "../api";
import { classesOf, filterCerts, fromRow, totals, type Cert } from "../logic";
import { RowActions } from "../components/RowActions";

const select = "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm";

export default function CertificateList() {
  const list = useQuery({ queryKey: ["certificates", "list"], queryFn: api.listCertificates, select: (d) => d.certificates.map(fromRow) });
  const [f, setF] = useState({ search: "", status: "all", shareClass: "all" });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Certificates" description="Share certificates that have been issued. Issue new ones from a completed subscription." />
      <PageState query={list} empty="No certificates have been issued yet.">
        {(rows) => {
          const t = totals(rows);
          const shown = filterCerts(rows, f);
          return (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Certificates" value={number(t.count)} />
                <Stat label="Active" value={number(t.active)} />
                <Stat label="Revoked" value={number(t.revoked)} />
                <Stat label="Shares certified" value={number(t.activeShares)} hint="active certificates" />
              </div>
              <div className="mb-4 grid gap-3 sm:grid-cols-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label htmlFor="cert-search" className="text-sm font-medium leading-none">Search</label>
                  <Input id="cert-search" placeholder="Holder name or certificate number" value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="cert-status" className="text-sm font-medium leading-none">Status</label>
                  <select id="cert-status" className={select} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
                    <option value="all">Any status</option><option value="active">Active</option><option value="revoked">Revoked</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="cert-class" className="text-sm font-medium leading-none">Share class</label>
                  <select id="cert-class" className={select} value={f.shareClass} onChange={(e) => setF({ ...f, shareClass: e.target.value })}>
                    <option value="all">Any class</option>
                    {classesOf(rows).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {shown.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nothing matches these filters.</p> : (
                <DataTable rows={shown} rowKey={(r) => r.id} columns={[
                  { key: "number", header: "Certificate", cell: (r: Cert) => <span className="font-mono text-xs">{r.number}</span> },
                  { key: "holder", header: "Holder", cell: (r) => r.holder },
                  { key: "shares", header: "Shares", cell: (r) => <>{number(r.shares)} <span className="text-xs text-muted-foreground">{label(r.shareClass)}</span></>, className: "text-right" },
                  { key: "issued", header: "Issued", cell: (r) => date(r.issued), className: "hidden sm:table-cell" },
                  { key: "status", header: "Status", cell: (r) => <Status value={r.status} /> },
                  { key: "actions", header: "", cell: (r) => <RowActions cert={r} />, className: "w-10" },
                ]} />
              )}
            </>
          );
        }}
      </PageState>
    </div>
  );
}
