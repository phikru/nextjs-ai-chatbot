import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';
import { ChatOverview } from '@/components/chat-overview';
import { HomepageHeader } from '@/components/homepage-header';

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen w-full">
      <HomepageHeader user={session.user} />
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <ChatOverview user={session?.user} />
      </div>
    </div>
  );
}
