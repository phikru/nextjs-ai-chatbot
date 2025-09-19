'use client';

import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import type { User } from 'next-auth';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from './toast';
import { LoaderIcon } from './icons';

export function HomepageHeader({ user }: { user: User }) {
  const { data, status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <header className="border-b bg-background">
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Chatbot</h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-auto items-center gap-2 px-3 py-2"
                data-testid="user-nav-button"
              >
                {status === 'loading' ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin">
                      <LoaderIcon />
                    </div>
                    <span className="text-sm">Laden...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {user.image && (
                      <Image
                        src={user.image}
                        alt={user.name || 'User'}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    )}
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">
                        {user.name || user.email}
                      </span>
                      {user.name && user.email && (
                        <span className="text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              data-testid="user-nav-menu"
              side="bottom"
              align="end"
              className="w-56"
            >
              <DropdownMenuItem
                data-testid="user-nav-item-theme"
                className="cursor-pointer"
                onSelect={() =>
                  setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
                }
              >
                {`Toggle ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild data-testid="user-nav-item-auth">
                <button
                  type="button"
                  className="w-full cursor-pointer"
                  onClick={() => {
                    if (status === 'loading') {
                      toast({
                        type: 'error',
                        description:
                          'Checking authentication status, please try again!',
                      });

                      return;
                    }

                    signOut({
                      redirectTo: '/',
                    });
                  }}
                >
                  Sign out
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
