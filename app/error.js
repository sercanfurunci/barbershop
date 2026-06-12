"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6" style={{ background: "#F6F3EE" }}>
      <p className="text-[15px]" style={{ color: "#44403C" }}>Bir şeyler ters gitti. Lütfen sayfayı yenileyin.</p>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-lg text-[13px] font-medium"
        style={{ background: "#111111", color: "#fff" }}
      >
        Yenile
      </button>
    </div>
  );
}
