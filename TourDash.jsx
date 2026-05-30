const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, LayoutDashboard, MessageCircle, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import DashOverview from '@/components/dash/DashOverview';
import ChatTab from '@/components/dash/ChatTab';
import MapTab from '@/components/dash/MapTab';
import { Link } from 'react-router-dom';

export default function TourDash() {
  const { tourId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tour, isLoading } = useQuery({
    queryKey: ['tour', tourId],
    queryFn: async () => {
      const tours = await db.entities.Tour.filter({ id: tourId });
      return tours[0] || null;
    },
  });

  const copyCode = () => {
    if (tour?.join_code) {
      navigator.clipboard.writeText(tour.join_code);
      toast.success('Join code copied!');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-muted-foreground">Tour not found</p>
        <Link to="/" className="text-primary text-sm mt-2 inline-block">Go home</Link>
      </div>
    );
  }

  const isClosed = tour.status === 'closed';
  const isManager = tour.manager_email === user?.email;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Sub-header */}
      <div className="px-4 py-2.5 border-b border-border bg-background flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div className="min-w-0">
            <h2 className="text-sm font-bold truncate">{tour.name}</h2>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span>{tour.members?.length || 0} members</span>
              {isClosed && <span className="text-destructive font-semibold">• CLOSED</span>}
            </div>
          </div>
        </div>
        <button onClick={copyCode} className="flex items-center gap-1 text-xs bg-secondary px-2 py-1 rounded-md font-mono font-bold">
          {tour.join_code} <Copy className="w-3 h-3" />
        </button>
      </div>

      {/* Tab content */}
      <Tabs defaultValue="dash" className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="dash" className="gap-1 text-xs">
              <LayoutDashboard className="w-3.5 h-3.5" /> Dash
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1 text-xs">
              <MessageCircle className="w-3.5 h-3.5" /> Chat
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-1 text-xs">
              <MapPin className="w-3.5 h-3.5" /> Map
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dash" className="flex-1 overflow-y-auto mt-0">
          <DashOverview tour={tour} user={user} isManager={isManager} isClosed={isClosed} />
        </TabsContent>
        <TabsContent value="chat" className="flex-1 overflow-hidden mt-0">
          <ChatTab tour={tour} user={user} isClosed={isClosed} />
        </TabsContent>
        <TabsContent value="map" className="flex-1 overflow-hidden mt-0">
          <MapTab tour={tour} user={user} isClosed={isClosed} />
        </TabsContent>
      </Tabs>
    </div>
  );
}