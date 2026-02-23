import dynamic from "next/dynamic";
import SiteHeader from "@/components/site/SiteHeader";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center bg-slate-100">
      <p className="text-sm text-slate-400">Laster kart…</p>
    </div>
  ),
});

export default function KartPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader variant="dark" />
      <MapView />
    </div>
  );
}
