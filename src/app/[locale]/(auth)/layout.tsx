export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex h-full min-h-full flex-1 flex-col overflow-x-hidden bg-[#0a0705]">
      {children}
    </main>
  );
}
