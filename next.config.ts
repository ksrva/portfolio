import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* The dev-tools badge sits over the bottom-left corner of the scene, which
     is a full-bleed canvas with no chrome of its own — there's nowhere for it
     to go that isn't in the way. It only ever appears in development, so this
     changes nothing about the deployed site.

     Compile and runtime errors are still surfaced; this hides the indicator,
     not the diagnostics. */
  devIndicators: false,
};

export default nextConfig;
