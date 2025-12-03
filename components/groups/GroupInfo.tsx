'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Users, UserMinus, LogOut, Loader2 } from 'lucide-react';
import { removeGroupMember, leaveGroup } from '@/app/actions/conversations';
import { useRouter } from 'next/navigation';

interface Member {
  user_id: string;
  role: 'admin' | 'member';
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface GroupInfoProps {
  conversationId: string;
  members: Member[];
  currentUserId: string;
  isAdmin: boolean;
}

export function GroupInfo({ conversationId, members, currentUserId, isAdmin }: GroupInfoProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeGroupMember(conversationId, userId);
      setRemovingUserId(null);
      // Refresh to update member list
      router.refresh();
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Failed to remove member');
    }
  };

  const handleLeaveGroup = async () => {
    setLeaving(true);
    try {
      await leaveGroup(conversationId);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Failed to leave group:', error);
      alert('Failed to leave group');
      setLeaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Users className="w-5 h-5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Group Members</DialogTitle>
            <DialogDescription>
              {members.length} member{members.length !== 1 ? 's' : ''} in this group
            </DialogDescription>
          </DialogHeader>

          {/* Member List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {members.map((member) => {
              const isCurrentUser = member.user_id === currentUserId;
              const canRemove = isAdmin && !isCurrentUser;

              return (
                <div
                  key={member.user_id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.profile.avatar_url || ''} />
                    <AvatarFallback>
                      {member.profile.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {member.profile.username}
                        {isCurrentUser && ' (You)'}
                      </p>
                      {member.role === 'admin' && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    {member.profile.display_name && (
                      <p className="text-sm text-muted-foreground truncate">
                        {member.profile.display_name}
                      </p>
                    )}
                  </div>

                  {canRemove && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRemovingUserId(member.user_id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Leave Group Button */}
          <div className="border-t pt-4 mt-4">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowLeaveDialog(true)}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Leave Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!removingUserId} onOpenChange={() => setRemovingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the group?
              They won't be able to see messages anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removingUserId && handleRemoveMember(removingUserId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Group Confirmation */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this group? You won't be able to see
              messages or rejoin unless an admin adds you back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={leaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveGroup}
              disabled={leaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {leaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Leaving...
                </>
              ) : (
                'Leave Group'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
