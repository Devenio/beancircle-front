export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh min-h-[100dvh] overflow-x-hidden bg-[#0a0705]">
      {children}
    </main>
  );
}
