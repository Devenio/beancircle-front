'use client';

export default function ChatRoomLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-40 mx-auto max-w-[430px] bg-background">{children}</div>;
}
