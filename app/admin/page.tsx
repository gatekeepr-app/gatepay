"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Users, Briefcase, FileText, Wallet, ArrowRight } from "lucide-react";
import { formatDate, formatMoney } from "@/lib/admin/format";
import { DashboardBanner } from "@/components/dashboard/banner";
import { useUser } from "@/components/admin/UserProvider";

export default function DashboardPage() {
  const user = useUser();
  const clients = useQuery(api.clients.list);
  const projects = useQuery(api.projects.list);
  const invoices = useQuery(api.invoices.list);
  const leads = useQuery(api.leads.list);
  const transactions = useQuery(api.transactions.list);

  const unverifiedCount = transactions?.filter((t) => !t.verifiedAt).length ?? 0;
  const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;
  const recentTransactions = transactions?.slice(0, 5) ?? [];
  const recentLeads = leads?.slice(0, 5) ?? [];

  return (
    <div className="p-6">
      <h1 className="text-2xl pb-4 font-semibold">Dashboard</h1>
      <DashboardBanner userName={user?.name ?? "Admin"} />

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Clients" value={clients?.length ?? "…"} href="/admin/clients" />
        <StatCard icon={Briefcase} label="Projects" value={projects?.length ?? "…"} href="/admin/projects" />
        <StatCard icon={FileText} label="Invoices" value={invoices?.length ?? "…"} href="/admin/invoices" />
        <StatCard
          icon={Wallet}
          label="Unverified"
          value={unverifiedCount}
          href="/admin/transactions"
          accent={unverifiedCount > 0}
        />
      </div>

      {/* Revenue + Recent activity */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Revenue card */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Total revenue</h2>
            <Link href="/admin/transactions" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          <div className="mt-3 text-3xl font-semibold">{formatMoney(totalRevenue)}</div>
          <div className="mt-1 text-xs text-muted-foreground">{transactions?.length ?? 0} transactions</div>
        </div>

        {/* Recent leads */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent leads</h2>
            <Link href="/admin/leads" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No leads yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recentLeads.map((lead) => (
                <li key={lead._id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{lead.name}</div>
                    <div className="text-xs text-muted-foreground">{lead.email}</div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${lead.status === "new" ? "bg-blue-100 text-blue-700" : "bg-muted"}`}>{lead.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent transactions */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Recent transactions</h2>
            <Link href="/admin/transactions" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {recentTransactions.map((tx) => (
                <li key={tx._id}>
                  <Link href={`/admin/transactions/${tx._id}`} className="flex items-center justify-between py-3 text-sm hover:underline">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">{tx.transactionRef}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${tx.verifiedAt ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {tx.verifiedAt ? "verified" : "pending"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{formatDate(new Date(tx.createdAt))}</span>
                      <span className="font-medium">{formatMoney(tx.amount, tx.currency)}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, href, accent }: { icon: any; label: string; value: string | number; href: string; accent?: boolean }) {
  return (
    <Link href={href} className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${accent ? "bg-yellow-100" : "bg-muted"}`}>
          <Icon className={`h-5 w-5 ${accent ? "text-yellow-700" : "text-muted-foreground"}`} />
        </div>
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </Link>
  );
}
