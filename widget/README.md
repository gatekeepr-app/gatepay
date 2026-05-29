# GatePay Payment Widget

Drop-in payment widget for any website. One script tag, your API key, done.

## Quick Start

### Option 1: Script Tag (recommended)

```html
<script
  src="https://pay.darvizlabs.com/widget/gatepay.min.js"
  data-api-key="gk_YOUR_KEY_HERE"
  data-mode="submit">
</script>
```

### Option 2: Iframe

```html
<iframe
  src="https://pay.darvizlabs.com/widget/gatepay.html?key=gk_YOUR_KEY_HERE&mode=submit"
  width="460"
  height="600"
  frameborder="0"
  style="border:none;border-radius:12px;">
</iframe>
```

### Option 3: JavaScript Config

```html
<script>
  window.GatePayConfig = {
    apiKey: "gk_YOUR_KEY_HERE",
    mode: "submit",
    theme: "light"
  };
</script>
<script src="https://pay.darvizlabs.com/widget/gatepay.min.js"></script>
```

## Configuration

### Data Attributes (script tag)

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `data-api-key` | Yes | — | Your GatePay API key |
| `data-mode` | No | `submit` | `submit` or `verify` |
| `data-theme` | No | `light` | `light` or `dark` |
| `data-api` | No | `https://pay.darvizlabs.com` | API base URL |
| `data-amount` | No | — | Pre-fill amount |
| `data-currency` | No | `BDT` | Pre-fill currency |
| `data-method` | No | — | Pre-fill payment method |
| `data-ref` | No | — | Pre-fill transaction reference |

### JavaScript Config

```js
window.GatePayConfig = {
  apiKey: "gk_...",      // Required
  mode: "submit",        // "submit" | "verify"
  theme: "light",        // "light" | "dark"
  api: "https://..."     // Custom API URL
};
```

## Modes

### Submit Mode
Lets users submit a payment transaction. Fields:
- Transaction reference (required)
- Amount (required)
- Currency (default: BDT)
- Payment method (bKash, Nagad, Rocket, Bank, Card, Other)
- External user ID (optional)
- Notes (optional)

### Verify Mode
Lets users verify a transaction exists. Fields:
- Transaction reference (required)
- Amount (optional, for exact match)

## Styling

The widget is fully self-contained — no external CSS or JS dependencies. It uses system fonts and a clean design that works on any site.

Customize colors via CSS variables:

```css
:root {
  --gp-primary: #3b82f6;
  --gp-bg: #ffffff;
  --gp-text: #111827;
  --gp-muted: #6b7280;
  --gp-border: #e5e7eb;
  --gp-radius: 12px;
}
```

## React / Vue / Next.js

### React

```jsx
import { useEffect, useRef } from "react";

export default function PaymentWidget({ apiKey }) {
  const ref = useRef(null);
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://pay.darvizlabs.com/widget/gatepay.min.js";
    script.dataset.apiKey = apiKey;
    script.dataset.mode = "submit";
    ref.current.appendChild(script);
    return () => script.remove();
  }, [apiKey]);
  return <div ref={ref} />;
}
```

### Vue

```vue
<template>
  <div ref="widget"></div>
</template>

<script setup>
import { ref, onMounted } from "vue";
const widget = ref(null);
onMounted(() => {
  const s = document.createElement("script");
  s.src = "https://pay.darvizlabs.com/widget/gatepay.min.js";
  s.dataset.apiKey = "gk_YOUR_KEY";
  s.dataset.mode = "submit";
  widget.value.appendChild(s);
});
</script>
```

## Files

- `gatepay.min.js` — Embeddable script (creates widget on page)
- `gatepay.html` — Standable HTML page (for iframe or direct link)

## API Key

Get your API key from the GatePay admin dashboard at `https://pay.darvizlabs.com/admin/api-keys`.

## Security

- API keys are sent via HTTPS only
- Keys are hashed server-side — never stored in plaintext
- Rate limited per key (100 req/min)
- CSRF protection on all endpoints
