import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { convertToUIMessages } from '@/lib/utils';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  const chat = await getChatById({ id });
  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  // If chat doesn't exist, treat it as a new chat
  if (!chat) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={chatModelFromCookie?.value || DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler />
      </>
    );
  }

  // Existing chat - check permissions
  if (chat.visibility === 'private') {
    if (!session.user) {
      redirect('/');
    }

    if (session.user.id !== chat.userId) {
      redirect('/');
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const uiMessages = convertToUIMessages(messagesFromDb);

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={uiMessages}
        initialChatModel={chatModelFromCookie?.value || DEFAULT_CHAT_MODEL}
        initialVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
        session={session}
        autoResume={true}
        initialLastContext={chat.lastContext ?? undefined}
      />
      <DataStreamHandler />
    </>
  );
}
