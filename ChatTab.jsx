const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useRef, useEffect } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Clock } from 'lucide-react';
import { nowTimestamp, formatTimestamp } from '@/lib/formatDate';
import { pushToOutbox, isOnline, getOutbox } from '@/lib/offlineSync';

export default function ChatTab({ tour, user, isClosed }) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [localPending, setLocalPending] = useState([]);
  const scrollRef = useRef(null);

  const { data: messages = [] } = useQuery({
    queryKey: ['chat', tour.id],
    queryFn: () => db.entities.ChatMessage.filter({ tour_id: tour.id }, 'created_date', 500),
    refetchInterval: 3000,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, localPending]);

  const sendMessage = async () => {
    if (!message.trim() || isClosed) return;
    const nickname = user.nickname || user.full_name || 'User';
    const avatar = user.avatar_url || '';
    const ts = nowTimestamp();
    const payload = {
      tour_id: tour.id,
      sender_email: user.email,
      sender_nickname: nickname,
      sender_avatar: avatar,
      content: message.trim(),
      timestamp: ts,
    };

    if (isOnline()) {
      await db.entities.ChatMessage.create(payload);
      queryClient.invalidateQueries({ queryKey: ['chat', tour.id] });
    } else {
      pushToOutbox({ type: 'chat', data: payload });
      setLocalPending(prev => [...prev, { ...payload, _pending: true }]);
    }
    setMessage('');
  };

  const allMessages = [...messages, ...localPending];

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {allMessages.map((msg, i) => {
          const isMe = msg.sender_email === user.email;
          return (
            <div key={msg.id || i} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              {!isMe && (
                <Avatar className="w-7 h-7 border border-border flex-shrink-0 mt-0.5">
                  <AvatarImage src={msg.sender_avatar} />
                  <AvatarFallback className="text-[10px] bg-secondary">
                    {(msg.sender_nickname || '?')[0]}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <p className="text-[10px] font-medium text-muted-foreground mb-0.5 px-1">{msg.sender_nickname}</p>
                )}
                <div className={`rounded-2xl px-3 py-2 text-sm ${
                  isMe ? 'bg-primary text-primary-foreground rounded-tr-md' : 'bg-secondary rounded-tl-md'
                }`}>
                  {msg.content}
                </div>
                <div className="flex items-center gap-1 px-1 mt-0.5">
                  <span className="text-[9px] text-muted-foreground">
                    {formatTimestamp(msg.timestamp || msg.created_date)}
                  </span>
                  {msg._pending && (
                    <span className="text-[9px] text-primary flex items-center gap-0.5">
                      <Clock className="w-2 h-2" /> Pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {allMessages.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">No messages yet</div>
        )}
      </div>

      {!isClosed && (
        <div className="border-t border-border p-3 flex gap-2">
          <Input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="h-10"
          />
          <Button onClick={sendMessage} disabled={!message.trim()} className="h-10 w-10 p-0 flex-shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}