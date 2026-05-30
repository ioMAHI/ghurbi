const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Crown, Phone, StickyNote, ArrowRightLeft, Send } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

function getUserDisplay(email, allUsers) {
  const u = allUsers.find(u => u.email === email);
  return {
    name: u?.nickname || u?.full_name || email.split('@')[0],
    avatar: u?.avatar_url || '',
    phone: u?.phone || '',
    initials: (u?.full_name || email[0]).slice(0, 2).toUpperCase(),
  };
}

export default function MemberRoster({ tour, allUsers, isManager }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [noteText, setNoteText] = useState('');

  const { data: notes = [] } = useQuery({
    queryKey: ['memberNotes', tour.id],
    queryFn: () => db.entities.MemberNote.filter({ tour_id: tour.id }),
  });

  const openProfile = (email) => {
    setSelectedMember(email);
    setNoteText('');
    setProfileOpen(true);
  };

  const addNote = async () => {
    if (!noteText.trim() || !selectedMember) return;
    await db.entities.MemberNote.create({
      tour_id: tour.id,
      target_email: selectedMember,
      note_text: noteText.trim(),
      author_email: user.email,
    });
    queryClient.invalidateQueries({ queryKey: ['memberNotes', tour.id] });
    setNoteText('');
    toast.success('Note added');
  };

  const transferManager = async (email) => {
    await db.entities.Tour.update(tour.id, { manager_email: email });
    queryClient.invalidateQueries({ queryKey: ['tour', tour.id] });
    queryClient.invalidateQueries({ queryKey: ['tours'] });
    toast.success('Manager role transferred');
    setProfileOpen(false);
  };

  const memberNotes = (email) => notes.filter(n => n.target_email === email);
  const sel = selectedMember ? getUserDisplay(selectedMember, allUsers) : null;

  return (
    <>
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Members</h3>
        {tour.members?.map(email => {
          const info = getUserDisplay(email, allUsers);
          const mNotes = memberNotes(email);
          const isMgr = tour.manager_email === email;

          return (
            <Card
              key={email}
              className="p-3 border border-border active:scale-[0.98] transition-transform cursor-pointer"
              onClick={() => openProfile(email)}
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-9 h-9 border border-border flex-shrink-0">
                  <AvatarImage src={info.avatar} />
                  <AvatarFallback className="text-xs bg-secondary">{info.initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold truncate">{info.name}</span>
                    {isMgr && <Crown className="w-3 h-3 text-primary flex-shrink-0" />}
                  </div>
                  {mNotes.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {mNotes.map(n => (
                        <p key={n.id} className="text-[10px] text-muted-foreground flex items-start gap-1">
                          <StickyNote className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" />
                          <span className="break-words">{n.note_text}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Member Profile</DialogTitle>
          </DialogHeader>
          {sel && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <Avatar className="w-14 h-14 border-2 border-border">
                  <AvatarImage src={sel.avatar} />
                  <AvatarFallback className="text-lg bg-secondary">{sel.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{sel.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedMember}</p>
                  {sel.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {sel.phone}
                    </p>
                  )}
                  {tour.manager_email === selectedMember && (
                    <Badge className="mt-1 text-[10px]">Tour Manager</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground">Notes</h4>
                {memberNotes(selectedMember).map(n => (
                  <div key={n.id} className="bg-secondary rounded-md px-3 py-1.5">
                    <p className="text-xs">{n.note_text}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">by {getUserDisplay(n.author_email, allUsers).name}</p>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Add note..."
                    className="h-9 text-sm"
                  />
                  <Button size="sm" onClick={addNote} disabled={!noteText.trim()} className="h-9">
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {isManager && selectedMember !== user.email && (
                <Button
                  variant="outline"
                  className="w-full gap-2 text-sm"
                  onClick={() => transferManager(selectedMember)}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Transfer Manager Role
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}