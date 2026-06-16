import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 min-h-screen w-full transition-all duration-300 md:pl-64">
        <div className="w-full min-h-screen p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
