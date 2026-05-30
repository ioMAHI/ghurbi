const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from 'react';

import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export default function Login() {
  const handleGoogleLogin = () => {
    db.auth.loginWithProvider('google', '/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <img
            src="https://media.db.com/images/public/6a1a9f6b2e44e54ff7b008bb/2081e9fa7_20260530_142010.png"
            alt="ghurbi?"
            className="h-16 mx-auto object-contain"
          />
          <p className="text-sm text-muted-foreground">Manage tour expenses in BDT</p>
        </div>

        <Button
          onClick={handleGoogleLogin}
          className="w-full h-12 text-base font-semibold gap-3"
          size="lg"
        >
          <LogIn className="w-5 h-5" />
          Sign in with Google
        </Button>

        <p className="text-xs text-muted-foreground">
          By signing in, you agree to the terms of service.
        </p>
      </div>
    </div>
  );
}