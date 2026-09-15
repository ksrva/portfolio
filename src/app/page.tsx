import fs from "node:fs";
import path from "node:path";
import { StreetClient } from "@/components/three/StreetClient";

/* The alley gallery hangs whatever is sitting in public/sketches. Read here,
   at build time, rather than guessed at in the browser: useTexture throws on
   a file that isn't there, so the client is only ever handed names that
   actually exist. Drop an image in, rebuild, and a frame fills itself. */
function sketches(): string[] {
  try {
    return fs
      .readdirSync(path.join(process.cwd(), "public", "sketches"))
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort();
  } catch {
    return [];
  }
}

export default function Home() {
  return <StreetClient sketches={sketches()} />;
}
