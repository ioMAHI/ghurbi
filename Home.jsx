const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, UserPlus, Archive } from 'lucide-react';
import TourCard from '@/components/home/TourCard';
import CreateTourDialog from '@/components/home/CreateTourDialog';
import JoinTourDialog from '@/components/home/JoinTourDialog';

export default function Home() {
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const { data: allTours = [] } = useQuery({
    queryKey: ['tours'],
    queryFn: () => db.entities.Tour.list('-created_date', 100),
  });

  const myTours = allTours.filter(t => t.members?.includes(user?.email));
  const activeTours = myTours.filter(t => t.status === 'active');
  const upcomingTours = myTours.filter(t => t.status === 'upcoming');
  const closedTours = myTours.filter(t => t.status === 'closed');

  return (
    <div className="px-4 py-5 max-w-lg mx-auto">
      <div className="flex gap-2 mb-5">
        <Button onClick={() => setCreateOpen(true)} className="flex-1 h-11 font-semibold gap-2">
          <Plus className="w-4 h-4" /> Create Tour
        </Button>
        <Button onClick={() => setJoinOpen(true)} variant="outline" className="flex-1 h-11 font-semibold gap-2">
          <UserPlus className="w-4 h-4" /> Join Tour
        </Button>
      </div>

      <Tabs defaultValue="home">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="home">Home</TabsTrigger>
          <TabsTrigger value="archive" className="gap-1">
            <Archive className="w-3.5 h-3.5" /> Archive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="home" className="space-y-3 mt-0">
          {activeTours.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Tour</h2>
              {activeTours.map(t => <TourCard key={t.id} tour={t} />)}
            </div>
          )}
          {upcomingTours.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</h2>
              {upcomingTours.map(t => <TourCard key={t.id} tour={t} />)}
            </div>
          )}
          {activeTours.length === 0 && upcomingTours.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">No active or upcoming tours</p>
              <p className="text-xs mt-1">Create or join a tour to get started</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="archive" className="space-y-3 mt-0">
          {closedTours.length > 0 ? (
            closedTours.map(t => <TourCard key={t.id} tour={t} />)
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">No archived tours</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateTourDialog open={createOpen} onOpenChange={setCreateOpen} />
      <JoinTourDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </div>
  );
}