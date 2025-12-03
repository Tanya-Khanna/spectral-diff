"use client";

import { useEffect, useState } from "react";

export default function SpookyFX() {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    // lightning flash shortly after load
    const t1 = setTimeout(() => setFlash(true), 450);
    const t2 = setTimeout(() => setFlash(false), 520);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <>
      {/* Fog + noise (pointer-events none so it never blocks clicks) */}
      <div className="pointer-events-none fixed inset-0 z-10 opacity-70">
        <div className="absolute inset-0 spooky-noise" />
        <div className="absolute -inset-32 spooky-fog" />
        <div className="absolute -inset-64 spooky-fog2" />
      </div>

      {/* Lightning flash */}
      {flash && (
        <div className="pointer-events-none fixed inset-0 z-20 bg-white/20 animate-[spookyFlash_120ms_ease-out_1]" />
      )}
    </>
  );
}
