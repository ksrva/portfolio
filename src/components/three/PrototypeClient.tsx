"use client";

import dynamic from "next/dynamic";

/* three.js can't render on the server, so the whole scene is loaded
   client-side only. Kept in its own client component because `ssr: false`
   isn't allowed from a Server Component. */
const StreetScene = dynamic(() => import("./StreetScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[100svh] w-full items-center justify-center bg-[#070c14]">
      <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-paper/40">
        Building the street…
      </p>
    </div>
  ),
});

export function PrototypeClient() {
  return <StreetScene />;
}
