"use client";

import dynamic from "next/dynamic";

const Room = dynamic(() => import("./Room"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#070906]" />,
});

export function RoomClient(props: { prompt: boolean; onPrompt: () => void; lit: boolean }) {
  return <Room {...props} />;
}
