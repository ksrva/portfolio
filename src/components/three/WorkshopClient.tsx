"use client";

import dynamic from "next/dynamic";

const Workshop = dynamic(() => import("./Workshop"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#0b0805]" />,
});

export function WorkshopClient(props: { prompt: boolean; onPrompt: () => void; lit: boolean }) {
  return <Workshop {...props} />;
}
