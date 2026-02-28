import dynamic from "next/dynamic";
const AppShell = dynamic(() => import("@/components/AppShell"), { ssr: false });

export default function Page() {
  return (
    <main className="min-h-[calc(100vh-56px)] safe-bottom">
      <AppShell />
    </main>
  );
}
