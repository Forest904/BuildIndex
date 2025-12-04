import Header from "@/features/layout/components/Header";
import SpaceScene from "@/features/visualization/components/SpaceScene";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <Header />
      <main className="flex-1">
        <SpaceScene />
      </main>
    </div>
  );
}
