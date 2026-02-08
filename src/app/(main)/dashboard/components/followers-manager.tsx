"use client";

import React, { useState } from 'react';
import { useAccount } from '@/context/account-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export function FollowersManager() {
  const { followerAccounts } = useAccount();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');

  const generateOauthLink = (id: string) => {
    const url = `${window.location.origin}/api/alice/oauth/vendor/start?accountId=${encodeURIComponent(id)}`;
    navigator.clipboard?.writeText(url).then(() => toast({ title: 'Link copied', description: `OAuth link for ${id} copied to clipboard.` }));
  };

  const openPasteDialog = (id: string) => {
    setSelected(id);
    setTokenInput('');
    setOpen(true);
  };

  const submitToken = async () => {
    if (!selected) return;
    try {
      const res = await fetch('/api/followers/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: selected, clientId: selected, apiKey: '', accessToken: tokenInput }),
      });
      const body = await res.json();
      if (body.ok) {
        toast({ title: 'Saved', description: `Token saved for ${selected}` });
        setOpen(false);
      } else {
        toast({ title: 'Failed', description: body.message || 'Unable to save token' });
      }
    } catch (e) {
      toast({ title: 'Error', description: String(e) });
    }
  };

  const testConnect = async (id: string) => {
    try {
      const res = await fetch(`/api/followers/test-connect?followerId=${encodeURIComponent(id)}`);
      const body = await res.json();
      if (body.ok) toast({ title: 'Connected', description: `${id} connection OK (${body.sampleCount} items)` });
      else toast({ title: 'Connection failed', description: body.message || 'Check token' });
    } catch (e) {
      toast({ title: 'Error', description: String(e) });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary">Manage Followers</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paste follower token</DialogTitle>
            <DialogDescription>Paste an OAuth access_token or session token for the selected follower.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <div>Follower: {selected}</div>
            <Input value={tokenInput} onChange={e => setTokenInput((e.target as HTMLInputElement).value)} placeholder="Paste access_token / sessionToken here" />
            <div className="flex gap-2">
              <Button onClick={submitToken}>Save Token</Button>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-2">
        {followerAccounts.map(f => (
          <div key={f.id} className="flex items-center justify-between p-3 border rounded">
            <div>
              <div className="font-medium">{f.name || f.id}</div>
              <div className="text-sm text-muted-foreground">{f.id}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => generateOauthLink(f.id)}>Generate OAuth Link</Button>
              <Button size="sm" onClick={() => openPasteDialog(f.id)}>Paste/Update Token</Button>
              <Button size="sm" variant="outline" onClick={() => testConnect(f.id)}>Test Connect</Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default FollowersManager;
