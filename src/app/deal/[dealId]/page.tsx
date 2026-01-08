'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Send,
  DollarSign,
  Calendar,
  Building,
  Mail,
  Phone,
  Share2,
  CheckCircle,
  Shield,
  Loader2,
  MessageSquare,
  AlertCircle,
  Lock,
  X,
} from 'lucide-react';

interface DealMessage {
  id: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface DealRoom {
  id: string;
  startupId: string;
  buyerId: string;
  founderId: string;
  status: 'OPEN' | 'CLOSED' | 'PAUSED';
  buyerEmail: string | null;
  buyerPhone: string | null;
  founderEmail: string | null;
  founderPhone: string | null;
  lastActivity: string;
  closedAt: string | null;
  closeReason: string | null;
  createdAt: string;
  startup: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    tagline: string;
    currentMRR: number;
    askingPrice: number | null;
    stage: string;
    verificationStatus: string;
  };
  introRequest: {
    id: string;
    companyName: string | null;
    budgetRange: string;
    timeline: string;
    buyerType: string;
    message: string;
    createdAt: string;
  };
  buyer: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    email: string;
  };
  founder: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    email: string;
  };
  messages: DealMessage[];
  userRole: 'buyer' | 'founder';
  currentUserId: string;
}

const budgetLabels: Record<string, string> = {
  under_10k: 'Under $10K',
  '10k_25k': '$10K - $25K',
  '25k_50k': '$25K - $50K',
  '50k_100k': '$50K - $100K',
  '100k_250k': '$100K - $250K',
  '100k_plus': '$100K+',
  '250k_plus': '$250K+',
};

const timelineLabels: Record<string, string> = {
  asap: 'ASAP',
  '1_month': '1 Month',
  '30_days': '30 Days',
  '30_60_days': '30-60 Days',
  '3_months': '3 Months',
  exploring: 'Exploring',
};

export default function DealRoomPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = use(params);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [dealRoom, setDealRoom] = useState<DealRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  // Share contact modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePhone, setSharePhone] = useState('');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (sessionStatus === 'authenticated') {
      fetchDealRoom();
    }
  }, [sessionStatus, dealId, router]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dealRoom?.messages]);

  const fetchDealRoom = async () => {
    try {
      const res = await fetch(`/api/deal/${dealId}`);
      if (res.ok) {
        const data = await res.json();
        setDealRoom(data);
      } else if (res.status === 403 || res.status === 404) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching deal room:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const res = await fetch(`/api/deal/${dealId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        setNewMessage('');
        fetchDealRoom(); // Refresh to get new message
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleShareContact = async () => {
    setSharing(true);
    try {
      const res = await fetch(`/api/deal/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'share_contact',
          email: shareEmail || null,
          phone: sharePhone || null,
        }),
      });

      if (res.ok) {
        setShowShareModal(false);
        fetchDealRoom();
      }
    } catch (error) {
      console.error('Error sharing contact:', error);
    } finally {
      setSharing(false);
    }
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-96 bg-gray-200 rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (!dealRoom) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-5xl text-center">
          <h1 className="text-2xl font-bold">Deal room not found</h1>
          <Link href="/dashboard">
            <Button className="mt-4">Back to Dashboard</Button>
          </Link>
        </main>
      </div>
    );
  }

  const otherParty = dealRoom.userRole === 'buyer' ? dealRoom.founder : dealRoom.buyer;
  const myContactShared = dealRoom.userRole === 'buyer'
    ? dealRoom.buyerEmail || dealRoom.buyerPhone
    : dealRoom.founderEmail || dealRoom.founderPhone;
  const theirContactShared = dealRoom.userRole === 'buyer'
    ? dealRoom.founderEmail || dealRoom.founderPhone
    : dealRoom.buyerEmail || dealRoom.buyerPhone;

  const isClosed = dealRoom.status === 'CLOSED';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back button */}
        <Link href={dealRoom.userRole === 'founder' ? '/founder/inbox' : '/dashboard'}>
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to {dealRoom.userRole === 'founder' ? 'Inbox' : 'Dashboard'}
          </Button>
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {dealRoom.startup.logo ? (
              <img
                src={dealRoom.startup.logo}
                alt={dealRoom.startup.name}
                className="w-14 h-14 rounded-lg object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {dealRoom.startup.name[0]}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Deal Room: {dealRoom.startup.name}
                {dealRoom.startup.verificationStatus === 'VERIFIED' && (
                  <Badge className="bg-blue-100 text-blue-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground">{dealRoom.startup.tagline}</p>
            </div>
          </div>
          {isClosed && (
            <Badge variant="secondary" className="bg-gray-200 text-gray-700">
              <Lock className="w-3 h-3 mr-1" />
              Closed
            </Badge>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={otherParty.image || undefined} />
                      <AvatarFallback>
                        {otherParty.name?.[0] || otherParty.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {otherParty.name || otherParty.username || 'Anonymous'}
                      </CardTitle>
                      <CardDescription>
                        {dealRoom.userRole === 'buyer' ? 'Founder' : 'Potential Buyer'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    <Shield className="w-3 h-3 mr-1" />
                    Private
                  </Badge>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Initial Request Info */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-orange-700 text-sm font-medium mb-2">
                    <MessageSquare className="w-4 h-4" />
                    Initial Request
                  </div>
                  <p className="text-sm text-gray-700">
                    {dealRoom.introRequest.message}
                  </p>
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {budgetLabels[dealRoom.introRequest.budgetRange] || dealRoom.introRequest.budgetRange}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {timelineLabels[dealRoom.introRequest.timeline] || dealRoom.introRequest.timeline}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                {dealRoom.messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  dealRoom.messages.map((msg) => {
                    const isMe = msg.senderId === dealRoom.currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isMe
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isMe ? 'text-orange-100' : 'text-gray-500'
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Message Input */}
              {!isClosed ? (
                <div className="border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[44px] max-h-32 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="border-t p-4 bg-gray-50 text-center text-muted-foreground">
                  <Lock className="h-4 w-4 inline mr-2" />
                  This deal room is closed
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Deal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Deal Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Startup</span>
                  <Link
                    href={`/startup/${dealRoom.startup.slug}`}
                    className="font-medium text-orange-600 hover:underline"
                  >
                    {dealRoom.startup.name}
                  </Link>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">MRR</span>
                  <span className="font-semibold">
                    ${dealRoom.startup.currentMRR.toLocaleString()}
                  </span>
                </div>
                {dealRoom.startup.askingPrice && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Asking</span>
                    <span className="font-semibold">
                      ${dealRoom.startup.askingPrice.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Budget</span>
                  <Badge variant="secondary">
                    {budgetLabels[dealRoom.introRequest.budgetRange] || dealRoom.introRequest.budgetRange}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Timeline</span>
                  <Badge variant="secondary">
                    {timelineLabels[dealRoom.introRequest.timeline] || dealRoom.introRequest.timeline}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Contact Sharing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Contact Info
                </CardTitle>
                <CardDescription>
                  Share your contact details to communicate outside this platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Their Contact */}
                {theirContactShared && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-700 font-medium mb-2">
                      {otherParty.name}'s Contact:
                    </p>
                    {dealRoom.userRole === 'buyer' ? (
                      <>
                        {dealRoom.founderEmail && (
                          <p className="text-sm flex items-center gap-2">
                            <Mail className="w-4 h-4 text-green-600" />
                            {dealRoom.founderEmail}
                          </p>
                        )}
                        {dealRoom.founderPhone && (
                          <p className="text-sm flex items-center gap-2 mt-1">
                            <Phone className="w-4 h-4 text-green-600" />
                            {dealRoom.founderPhone}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        {dealRoom.buyerEmail && (
                          <p className="text-sm flex items-center gap-2">
                            <Mail className="w-4 h-4 text-green-600" />
                            {dealRoom.buyerEmail}
                          </p>
                        )}
                        {dealRoom.buyerPhone && (
                          <p className="text-sm flex items-center gap-2 mt-1">
                            <Phone className="w-4 h-4 text-green-600" />
                            {dealRoom.buyerPhone}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* My Contact */}
                {myContactShared ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700 font-medium mb-2">
                      Your shared contact:
                    </p>
                    {dealRoom.userRole === 'buyer' ? (
                      <>
                        {dealRoom.buyerEmail && (
                          <p className="text-sm flex items-center gap-2">
                            <Mail className="w-4 h-4 text-blue-600" />
                            {dealRoom.buyerEmail}
                          </p>
                        )}
                        {dealRoom.buyerPhone && (
                          <p className="text-sm flex items-center gap-2 mt-1">
                            <Phone className="w-4 h-4 text-blue-600" />
                            {dealRoom.buyerPhone}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        {dealRoom.founderEmail && (
                          <p className="text-sm flex items-center gap-2">
                            <Mail className="w-4 h-4 text-blue-600" />
                            {dealRoom.founderEmail}
                          </p>
                        )}
                        {dealRoom.founderPhone && (
                          <p className="text-sm flex items-center gap-2 mt-1">
                            <Phone className="w-4 h-4 text-blue-600" />
                            {dealRoom.founderPhone}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowShareModal(true)}
                    variant="outline"
                    className="w-full gap-2"
                    disabled={isClosed}
                  >
                    <Share2 className="h-4 w-4" />
                    Share My Contact
                  </Button>
                )}

                {!theirContactShared && !myContactShared && (
                  <p className="text-xs text-center text-muted-foreground">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    Contact info is only visible to deal room participants
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/startup/${dealRoom.startup.slug}`}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Building className="h-4 w-4" />
                    View Startup Page
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Share Contact Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Contact Info</DialogTitle>
            <DialogDescription>
              This information will only be visible to {otherParty.name || 'the other party'} in this deal room.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number (optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={sharePhone}
                onChange={(e) => setSharePhone(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleShareContact}
              disabled={!shareEmail || sharing}
              className="gap-2"
            >
              {sharing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              Share Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
