'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import { useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Chat } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';
import useSWRInfinite from 'swr/infinite';
import { LoaderIcon, PlusIcon, MoreHorizontalIcon, TrashIcon } from './icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

export interface ChatHistory {
  chats: Array<Chat>;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats,
  );
};

export function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: ChatHistory,
) {
  if (previousPageData && previousPageData.hasMore === false) {
    return null;
  }

  if (pageIndex === 0) return `/api/history?limit=${PAGE_SIZE}`;

  const firstChatFromPage = previousPageData.chats.at(-1);

  if (!firstChatFromPage) return null;

  return `/api/history?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}`;
}

function ChatCard({
  chat,
  onDelete,
}: {
  chat: Chat;
  onDelete: (chatId: string) => void;
}) {
  const router = useRouter();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleChatClick = () => {
    router.push(`/chat/${chat.id}`);
  };

  return (
    <Card
      className="group cursor-pointer transition-shadow hover:shadow-md"
      onClick={handleChatClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-2 text-lg font-medium">
            {chat.title}
          </CardTitle>
          <DropdownMenu modal={true}>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreHorizontalIcon />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end">
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
                onSelect={(e) => {
                  e.stopPropagation();
                  onDelete(chat.id);
                }}
              >
                <TrashIcon />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground">
          {formatDate(new Date(chat.createdAt))}
        </p>
      </CardContent>
    </Card>
  );
}

function ChatSection({
  title,
  chats,
  onDelete,
}: {
  title: string;
  chats: Chat[];
  onDelete: (chatId: string) => void;
}) {
  if (chats.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {chats.map((chat) => (
          <ChatCard key={chat.id} chat={chat} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

export function ChatOverview({ user }: { user: User | undefined }) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<ChatHistory>(getChatHistoryPaginationKey, fetcher, {
    fallbackData: [],
  });

  const hasReachedEnd = paginatedChatHistories
    ? paginatedChatHistories.some((page) => page.hasMore === false)
    : false;

  const hasEmptyChatHistory = paginatedChatHistories
    ? paginatedChatHistories.every((page) => page.chats.length === 0)
    : false;

  const handleDelete = async () => {
    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Chat wird gelöscht...',
      success: () => {
        mutate((chatHistories) => {
          if (chatHistories) {
            return chatHistories.map((chatHistory) => ({
              ...chatHistory,
              chats: chatHistory.chats.filter((chat) => chat.id !== deleteId),
            }));
          }
        });

        return 'Chat erfolgreich gelöscht';
      },
      error: 'Fehler beim Löschen des Chats',
    });

    setShowDeleteDialog(false);
  };

  const handleNewChat = () => {
    const newChatId = generateUUID();
    router.push(`/chat/${newChatId}`);
  };

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold">Willkommen beim Chatbot</h1>
        <p className="max-w-md text-center text-muted-foreground">
          Melden Sie sich an, um Ihre Chats zu speichern und frühere
          Unterhaltungen zu verwalten.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ihre Chats</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre Unterhaltungen
            </p>
          </div>
          <Button onClick={handleNewChat} size="lg">
            <PlusIcon />
            <span className="ml-2">Neuer Chat</span>
          </Button>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Heute</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 w-3/4 rounded bg-muted" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 w-1/2 rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hasEmptyChatHistory) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold">Keine Chats vorhanden</h1>
        <p className="max-w-md text-center text-muted-foreground">
          Sie haben noch keine Unterhaltungen gestartet. Beginnen Sie Ihren
          ersten Chat!
        </p>
        <Button onClick={handleNewChat} size="lg">
          <PlusIcon />
          <span className="ml-2">Ersten Chat starten</span>
        </Button>
      </div>
    );
  }

  const chatsFromHistory = paginatedChatHistories
    ? paginatedChatHistories.flatMap(
        (paginatedChatHistory) => paginatedChatHistory.chats,
      )
    : [];

  const groupedChats = groupChatsByDate(chatsFromHistory);

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ihre Chats</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre Unterhaltungen
            </p>
          </div>
          <Button onClick={handleNewChat} size="lg">
            <PlusIcon />
            <span className="ml-2">Neuer Chat</span>
          </Button>
        </div>

        <div className="space-y-8">
          <ChatSection
            title="Heute"
            chats={groupedChats.today}
            onDelete={(chatId) => {
              setDeleteId(chatId);
              setShowDeleteDialog(true);
            }}
          />

          <ChatSection
            title="Gestern"
            chats={groupedChats.yesterday}
            onDelete={(chatId) => {
              setDeleteId(chatId);
              setShowDeleteDialog(true);
            }}
          />

          <ChatSection
            title="Letzte 7 Tage"
            chats={groupedChats.lastWeek}
            onDelete={(chatId) => {
              setDeleteId(chatId);
              setShowDeleteDialog(true);
            }}
          />

          <ChatSection
            title="Letzten 30 Tage"
            chats={groupedChats.lastMonth}
            onDelete={(chatId) => {
              setDeleteId(chatId);
              setShowDeleteDialog(true);
            }}
          />

          <ChatSection
            title="Älter als 30 Tage"
            chats={groupedChats.older}
            onDelete={(chatId) => {
              setDeleteId(chatId);
              setShowDeleteDialog(true);
            }}
          />
        </div>

        <motion.div
          onViewportEnter={() => {
            if (!isValidating && !hasReachedEnd) {
              setSize((size) => size + 1);
            }
          }}
        />

        {hasReachedEnd ? (
          <div className="flex w-full flex-row items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            Sie haben das Ende Ihrer Chat-Historie erreicht.
          </div>
        ) : (
          <div className="flex flex-row items-center justify-center gap-2 py-8 text-muted-foreground">
            <div className="animate-spin">
              <LoaderIcon />
            </div>
            <div>Chats werden geladen...</div>
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sind Sie sich sicher?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Der Chat wird
              dauerhaft gelöscht und von unseren Servern entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
