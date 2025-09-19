import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';
import { ChatOverview } from '@/components/chat-overview';

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <ChatOverview user={session?.user} />
      </div>
    </div>
  );
}
