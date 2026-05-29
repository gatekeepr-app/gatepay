"use client";

import { useState } from "react";
import { Copy, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

const WIDGET_CODE = `<!-- GatePay Payment Widget — paste anywhere -->
<div id="gatepay-widget"></div>
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = { theme: { extend: { fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] } } } };
</script>
<script>
(function(){
  var API = "https://pay.darvizlabs.com";
  var KEY = "gk_YOUR_API_KEY_HERE";
  var MODE = "submit";
  var el = document.getElementById("gatepay-widget");

  function esc(s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; }

  function render() {
    el.innerHTML = \`
    <div class="max-w-md mx-auto p-6 font-sans">
      <div class="text-center mb-6">
        <div class="text-2xl font-bold tracking-tight">Gate<span class="text-blue-500">Pay</span></div>
        <div class="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-500">
          <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> Secure payments
        </div>
      </div>
      <div class="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg">
        <button onclick="gpTab('submit')" id="gp-t-sub" class="flex-1 py-2 rounded-md text-sm font-medium transition bg-white text-gray-900 shadow-sm">Submit</button>
        <button onclick="gpTab('verify')" id="gp-t-ver" class="flex-1 py-2 rounded-md text-sm font-medium transition text-gray-500">Verify</button>
      </div>
      <div id="gp-form-sub" class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Transaction Reference *</label>
          <input id="gp-ref" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" placeholder="e.g. INV-2026-00482">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Amount *</label>
            <input id="gp-amt" type="number" min="0" step="0.01" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" placeholder="0.00">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Currency</label>
            <select id="gp-cur" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
              <option>BDT</option><option>USD</option><option>EUR</option><option>INR</option><option>GBP</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">Method</label>
            <select id="gp-met" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
              <option value="">Select...</option><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="rocket">Rocket</option><option value="bank">Bank</option><option value="card">Card</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">User ID</label>
            <input id="gp-uid" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" placeholder="Optional">
          </div>
        </div>
        <button onclick="gpSubmit()" id="gp-sbtn" class="w-full py-2.5 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition">Submit Payment</button>
        <div id="gp-serr" class="hidden text-red-500 text-xs"></div>
      </div>
      <div id="gp-form-ver" class="hidden space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Transaction Reference *</label>
          <input id="gp-vref" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" placeholder="e.g. INV-2026-00482">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Amount (optional)</label>
          <input id="gp-vamt" type="number" min="0" step="0.01" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none" placeholder="Verify exact amount">
        </div>
        <button onclick="gpVerify()" id="gp-vbtn" class="w-full py-2.5 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition">Verify Payment</button>
        <div id="gp-verr" class="hidden text-red-500 text-xs"></div>
      </div>
      <div id="gp-res" class="hidden"></div>
      <div class="mt-4 text-center text-xs text-gray-400">Powered by <a href="https://pay.darvizlabs.com" target="_blank" class="text-blue-500 no-underline">GatePay</a></div>
    </div>\`;
  }

  window.gpTab = function(t) {
    document.getElementById("gp-form-sub").classList.toggle("hidden", t !== "submit");
    document.getElementById("gp-form-ver").classList.toggle("hidden", t !== "verify");
    document.getElementById("gp-t-sub").className = t === "submit" ? "flex-1 py-2 rounded-md text-sm font-medium transition bg-white text-gray-900 shadow-sm" : "flex-1 py-2 rounded-md text-sm font-medium transition text-gray-500";
    document.getElementById("gp-t-ver").className = t === "verify" ? "flex-1 py-2 rounded-md text-sm font-medium transition bg-white text-gray-900 shadow-sm" : "flex-1 py-2 rounded-md text-sm font-medium transition text-gray-500";
    document.getElementById("gp-res").classList.add("hidden");
  };

  async function gpFetch(path, body) {
    var r = await fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + KEY }, body: JSON.stringify(body) });
    var d = await r.json();
    if (!r.ok) throw new Error(d.error || "HTTP " + r.status);
    return d;
  }

  window.gpSubmit = async function() {
    var ref = document.getElementById("gp-ref").value.trim();
    var amt = parseFloat(document.getElementById("gp-amt").value);
    var e = document.getElementById("gp-serr"), b = document.getElementById("gp-sbtn");
    e.classList.add("hidden");
    if (!KEY || KEY === "gk_YOUR_API_KEY_HERE") { e.textContent = "Set your API key"; e.classList.remove("hidden"); return; }
    if (!ref) { e.textContent = "Reference required"; e.classList.remove("hidden"); return; }
    if (!amt || amt <= 0) { e.textContent = "Amount required"; e.classList.remove("hidden"); return; }
    b.disabled = true; b.innerHTML = '<span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>';
    try {
      var d = await gpFetch("/api/v1/public/transactions/submit", { transaction_ref: ref, amount: amt, currency: document.getElementById("gp-cur").value, method: document.getElementById("gp-met").value || undefined, external_user_id: document.getElementById("gp-uid").value.trim() || undefined, source: "widget" });
      document.getElementById("gp-res").innerHTML = '<div class="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-center"><div class="text-lg mb-1">&#10003;</div><div class="font-semibold text-sm">Payment Submitted</div><div class="text-xs mt-1 text-green-600">Recorded and pending verification.</div><div class="mt-2 px-3 py-1.5 bg-green-100 rounded font-mono text-xs">' + esc(ref) + '</div></div>';
      document.getElementById("gp-res").classList.remove("hidden");
      document.getElementById("gp-form-sub").classList.add("hidden");
    } catch(err) { e.textContent = err.message; e.classList.remove("hidden"); }
    finally { b.disabled = false; b.textContent = "Submit Payment"; }
  };

  window.gpVerify = async function() {
    var ref = document.getElementById("gp-vref").value.trim();
    var amt = document.getElementById("gp-vamt").value;
    var e = document.getElementById("gp-verr"), b = document.getElementById("gp-vbtn");
    e.classList.add("hidden");
    if (!KEY || KEY === "gk_YOUR_API_KEY_HERE") { e.textContent = "Set your API key"; e.classList.remove("hidden"); return; }
    if (!ref) { e.textContent = "Reference required"; e.classList.remove("hidden"); return; }
    b.disabled = true; b.innerHTML = '<span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>';
    var body = { transaction_ref: ref, business_name: "" };
    if (amt) body.amount = parseFloat(amt);
    try {
      var d = await gpFetch("/api/v1/public/transactions/verify", body);
      var ok = d.verified;
      document.getElementById("gp-res").innerHTML = '<div class="p-4 rounded-lg ' + (ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800") + ' text-center"><div class="text-lg mb-1">' + (ok ? "&#10003;" : "&#10007;") + '</div><div class="font-semibold text-sm">' + (ok ? "Payment Verified" : "Not Verified") + '</div><div class="text-xs mt-1 opacity-80">' + (ok ? "Transaction confirmed." : (d.reason || "Could not verify.")) + '</div><div class="mt-2 px-3 py-1.5 bg-black/5 rounded font-mono text-xs">' + esc(ref) + '</div></div>';
      document.getElementById("gp-res").classList.remove("hidden");
      document.getElementById("gp-form-ver").classList.add("hidden");
    } catch(err) { e.textContent = err.message; e.classList.remove("hidden"); }
    finally { b.disabled = false; b.textContent = "Verify Payment"; }
  };

  render();
})();
</script>`;

export default function WidgetPage() {
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState("gk_YOUR_API_KEY_HERE");

  const copy = async () => {
    await navigator.clipboard.writeText(WIDGET_CODE.replace("gk_YOUR_API_KEY_HERE", apiKey));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewCode = WIDGET_CODE.replace("gk_YOUR_API_KEY_HERE", "gk_demo_key_12345");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/docs/payments-api" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-3 w-3" /> Back to API docs
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Payment Widget</h1>
        <p className="mt-2 text-muted-foreground">
          One code block. Paste into any HTML page. It just works.
        </p>

        {/* API Key input */}
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <label className="block text-sm font-medium mb-2">Your API Key</label>
          <div className="flex gap-3">
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gk_..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-foreground/30"
            />
            <button onClick={copy} className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 transition">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy code"}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Replace with your actual key from <Link href="/admin/api-keys" className="text-primary hover:underline">API Keys</Link>.
          </p>
        </div>

        {/* Code block */}
        <div className="mt-6 rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
            <span className="text-xs font-medium text-muted-foreground">HTML — paste into your page</span>
            <button onClick={copy} className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-background transition-colors">
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto p-4 text-xs leading-relaxed max-h-96"><code className="font-mono text-foreground/70">{WIDGET_CODE}</code></pre>
        </div>

        {/* Live preview */}
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Live Preview</h2>
          <div className="rounded-xl border border-border bg-[#f9fafb] p-1">
            <div dangerouslySetInnerHTML={{ __html: previewCode }} />
          </div>
        </div>

        {/* How it works */}
        <div className="mt-10 rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">How it works</h2>
          <ol className="mt-4 space-y-3 text-sm text-muted-foreground list-decimal list-inside">
            <li>Copy the code block above</li>
            <li>Paste it anywhere in your HTML (before <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">&lt;/body&gt;</code>)</li>
            <li>Replace <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">gk_YOUR_API_KEY_HERE</code> with your key</li>
            <li>The widget renders automatically with submit/verify tabs</li>
          </ol>
          <div className="mt-4 rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground">
            <strong className="text-foreground">No dependencies.</strong> Tailwind CSS loads from CDN. No build step, no npm install, no framework required. Works with plain HTML, WordPress, Shopify, React, Vue, anything.
          </div>
        </div>
      </div>
    </div>
  );
}
