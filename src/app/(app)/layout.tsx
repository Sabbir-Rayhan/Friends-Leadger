import { Header } from "@/components/Header";
import { getUnreadCount } from "@/data/queries";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unread = await getUnreadCount(user.id);
  return (
    <>
      <Header name={user.name} unread={unread} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
