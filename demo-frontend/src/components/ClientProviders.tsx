"use client";

import Script from "next/script";

export default function ClientProviders() {
  return (
    <Script id="crm-debugger">
      {`
        window.__crmEvents = [];
        window.addEventListener("crm:lead-sent", (event) => {
          window.__crmEvents.push(event.detail);
        });
      `}
    </Script>
  );
}
