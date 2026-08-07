"use client";

import dynamic from "next/dynamic";

// Dynamic import komponen utama agar recharts tidak ikut di bundle utama
const StatisticsContent = dynamic(() => import("./StatisticsContent"), {
  ssr: false,
  loading: () => <p className="p-4">Memuat data statistik...</p>,
});

export default function StatisticsPage() {
  return <StatisticsContent />;
}
