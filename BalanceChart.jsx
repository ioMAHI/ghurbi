const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { useQueryClient, useQuery } from '@tanstack/react-query';
import { nowTimestamp } from '@/lib/formatDate';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Crown, Phone, StickyNote, ArrowRightLeft, Send } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

function getUserDisplay(email, allUsers) {
  const u = allUsers.find(u => u.email === email);
  return {
    name: u?.nickname || u?.full_name || email.split('@')[0],
    avatar: u?.avatar_url || '',
    phone: u?.phone || '',
    initials: (u?.full_name || email[0]).slice(0, 2).toUpperCase(),
  };
}

export default function BalanceChart({ members, paidMap, settledMap, perPerson, allUsers, tour, isManager, isClosed }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [noteText, setNoteText] = useState('');

  const { data: notes = [] } = useQuery({
    queryKey: ['memberNotes', tour.id],
    queryFn: () => db.entities.MemberNote.filter({ tour_id: tour.id }),
  });

  const balances = members.map(email => {
    const info = getUserDisplay(email, allUsers);
    const paid = (paidMap[email] || 0) + (settledMap[email] || 0);
    const diff = paid - perPerson;
    return { email, paid, diff, ...info };
  });

  balances.sort((a, b) => a.diff - b.diff);

  const maxAbs = Math.max(...balances.map(b => Math.abs(b.diff)), 1);

  const handleSettle = async (email) => {
    const diff = (paidMap[email] || 0) + (settledMap[email] || 0) - perPerson;
    if (diff >= 0) return;
    await db.entities.Settlement.create({
      tour_id: tour.id,
      member_email: email,
      amount: Math.abs(diff),
      settled_with: tour.manager_email,
      timestamp: nowTimestamp(),
    });
    queryClient.invalidateQueries({ queryKey: ['settlements', tour.id] });
    toast.success('Settlement recorded');
  };

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
      <Card className="p-4 border border-border space-y-3">
        <h3 className="text-sm font-bold">Tour Mate — {members.length}</h3>
        <div className="space-y-2.5">
          {balances.map(b => {
            const isDue = b.diff < -0.5;
            const isBalance = b.diff > 0.5;
            const width = Math.max((Math.abs(b.diff) / maxAbs) * 100, 8);
            const isMgr = tour.manager_email === b.email;
            const mNotes = memberNotes(b.email);

            return (
              <div key={b.email} className="space-y-1 cursor-pointer" onClick={() => openProfile(b.email)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="w-7 h-7 border border-border flex-shrink-0">
                      <AvatarImage src={b.avatar} />
                      <AvatarFallback className="text-[10px] bg-secondary">{b.initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium truncate">{b.name}</span>
                    {isMgr && <Crown className="w-3 h-3 text-primary flex-shrink-0" />}
                    {mNotes.length > 0 && <StickyNote className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-bold font-mono ${isDue ? 'text-destructive' : isBalance ? 'text-chart-1' : 'text-muted-foreground'}`}>
                      {isDue ? `Due ৳${Math.abs(Math.round(b.diff)).toLocaleString()}` :
                       isBalance ? `+৳${Math.round(b.diff).toLocaleString()}` :
                       '৳0'}
                    </span>
                    {isDue && isManager && !isClosed && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2"
                        onClick={(e) => { e.stopPropagation(); handleSettle(b.email); }}
                      >
                        Settle
                      </Button>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-sm overflow-hidden">
                  <div
                    className={`h-full rounded-sm transition-all ${isDue ? 'bg-destructive' : isBalance ? 'bg-chart-1' : 'bg-muted-foreground/30'}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

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

              {isManager && selectedMember !== user?.email && (
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