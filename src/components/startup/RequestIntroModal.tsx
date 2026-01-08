'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Loader2,
  CheckCircle,
  DollarSign,
  Calendar,
  Briefcase,
  Clock,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';

interface RequestIntroModalProps {
  startupName: string;
  startupSlug: string;
  askingPrice?: number;
  children: React.ReactNode;
}

interface AccessRequestStatus {
  hasRequested: boolean;
  requestId: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  createdAt: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
}

const BUDGET_RANGES = [
  { value: 'under_10k', label: 'Under $10K' },
  { value: '10k_25k', label: '$10K - $25K' },
  { value: '25k_50k', label: '$25K - $50K' },
  { value: '50k_100k', label: '$50K - $100K' },
  { value: '100k_plus', label: '$100K+' },
  { value: 'flexible', label: 'Flexible / Negotiable' },
];

const TIMELINES = [
  { value: 'asap', label: 'ASAP (within 2 weeks)' },
  { value: '1_month', label: 'Within 1 month' },
  { value: '3_months', label: 'Within 3 months' },
  { value: 'exploring', label: 'Just exploring' },
];

const BUYER_TYPES = [
  { value: 'first_time', label: 'First-time buyer' },
  { value: 'serial', label: 'Serial acquirer' },
  { value: 'portfolio', label: 'Portfolio builder' },
  { value: 'operator', label: 'Operator looking to run it' },
  { value: 'strategic', label: 'Strategic buyer (competitor/adjacent)' },
];

export function RequestIntroModal({
  startupName,
  startupSlug,
  askingPrice,
  children,
}: RequestIntroModalProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<AccessRequestStatus>({
    hasRequested: false,
    requestId: null,
    status: null,
    createdAt: null,
    reviewedAt: null,
    reviewNote: null,
  });

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [message, setMessage] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [timeline, setTimeline] = useState('');
  const [buyerType, setBuyerType] = useState('');
  const [operatorPlan, setOperatorPlan] = useState('');
  const [linkedin, setLinkedin] = useState('');

  // Fetch existing request status when modal opens
  useEffect(() => {
    if (open && session?.user?.id) {
      setIsLoading(true);
      fetch(`/api/startups/${startupSlug}/intro-request`)
        .then((res) => res.json())
        .then((data) => {
          setAccessStatus(data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [open, session?.user?.id, startupSlug]);

  const handleSubmit = async () => {
    if (!companyName || !message || !budgetRange || !timeline || !buyerType) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/startups/${startupSlug}/intro-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          message,
          budgetRange,
          timeline,
          buyerType,
          operatorPlan,
          linkedin,
        }),
      });

      if (res.ok) {
        setIsSubmitted(true);
        setAccessStatus({
          ...accessStatus,
          hasRequested: true,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        });
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to send request');
      }
    } catch (err) {
      console.error('Failed to submit intro request:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && !accessStatus.hasRequested) {
      // Reset form on close only if user hasn't submitted yet
      setTimeout(() => {
        setIsSubmitted(false);
        setCompanyName('');
        setMessage('');
        setBudgetRange('');
        setTimeline('');
        setBuyerType('');
        setOperatorPlan('');
        setLinkedin('');
      }, 300);
    }
  };

  // Render status-based content
  const renderStatusContent = () => {
    if (isLoading) {
      return (
        <div className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-muted-foreground">Checking status...</p>
        </div>
      );
    }

    // Already submitted (just now)
    if (isSubmitted) {
      return (
        <div className="py-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <DialogTitle className="text-xl mb-2">Request Sent!</DialogTitle>
          <DialogDescription className="mb-6">
            The founder of <strong>{startupName}</strong> will receive your intro request.
            They typically respond within 24-48 hours.
          </DialogDescription>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      );
    }

    // Has existing request
    if (accessStatus.hasRequested) {
      // Pending
      if (accessStatus.status === 'PENDING') {
        return (
          <div className="py-8 text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Request Pending</DialogTitle>
            <DialogDescription className="mb-4">
              Your intro request for <strong>{startupName}</strong> is being reviewed by the founder.
            </DialogDescription>
            {accessStatus.createdAt && (
              <p className="text-xs text-muted-foreground mb-6">
                Submitted {formatDistanceToNow(new Date(accessStatus.createdAt), { addSuffix: true })}
              </p>
            )}
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <Clock className="h-3 w-3 mr-1" />
              Awaiting Review
            </Badge>
            <div className="mt-6">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        );
      }

      // Approved
      if (accessStatus.status === 'APPROVED') {
        return (
          <div className="py-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Access Granted!</DialogTitle>
            <DialogDescription className="mb-4">
              Your intro request for <strong>{startupName}</strong> has been approved.
              You now have access to deal details.
            </DialogDescription>
            {accessStatus.reviewNote && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm text-green-700 mb-4 mx-auto max-w-sm">
                <p className="font-medium">Note from founder:</p>
                <p className="italic">"{accessStatus.reviewNote}"</p>
              </div>
            )}
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Approved
            </Badge>
            <div className="mt-6">
              <Button onClick={() => setOpen(false)}>View Deal Details</Button>
            </div>
          </div>
        );
      }

      // Rejected
      if (accessStatus.status === 'REJECTED') {
        return (
          <div className="py-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Request Not Approved</DialogTitle>
            <DialogDescription className="mb-4">
              Unfortunately, your request for <strong>{startupName}</strong> was not approved at this time.
            </DialogDescription>
            {accessStatus.reviewNote && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-sm text-red-700 mb-4 mx-auto max-w-sm">
                <p className="font-medium">Reason:</p>
                <p className="italic">"{accessStatus.reviewNote}"</p>
              </div>
            )}
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <XCircle className="h-3 w-3 mr-1" />
              Not Approved
            </Badge>
            <div className="mt-6">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        );
      }
    }

    // No existing request - show form
    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-green-600" />
            Request Intro to {startupName}
          </DialogTitle>
          <DialogDescription>
            Tell the founder what you're looking for. We'll verify you as a serious buyer.
          </DialogDescription>
        </DialogHeader>

        {/* Asking Price Reference */}
        {askingPrice && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200 -mt-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span className="text-sm">
              Asking price: <strong className="text-blue-700">${(askingPrice / 1000).toFixed(0)}K</strong>
            </span>
          </div>
        )}

        <div className="space-y-4 py-4">
          {/* Company or Fund Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName">
              Company or fund name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="companyName"
              placeholder="e.g., Acme Capital, My Holding Co, or Individual Buyer"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          {/* Why You? / Message */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Why you? <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Tell the founder why you're the right buyer. Include your background, relevant experience, and what excites you about this product..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Be specific about your interest and experience. Good messages get faster responses.
            </p>
          </div>

          {/* Budget Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budget range <span className="text-red-500">*</span>
            </Label>
            <Select value={budgetRange} onValueChange={setBudgetRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select your budget range" />
              </SelectTrigger>
              <SelectContent>
                {BUDGET_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline <span className="text-red-500">*</span>
            </Label>
            <Select value={timeline} onValueChange={setTimeline}>
              <SelectTrigger>
                <SelectValue placeholder="When are you looking to close?" />
              </SelectTrigger>
              <SelectContent>
                {TIMELINES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Buyer Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              What type of buyer are you? <span className="text-red-500">*</span>
            </Label>
            <Select value={buyerType} onValueChange={setBuyerType}>
              <SelectTrigger>
                <SelectValue placeholder="Select buyer type" />
              </SelectTrigger>
              <SelectContent>
                {BUYER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operator Plan (optional) */}
          <div className="space-y-2">
            <Label htmlFor="operatorPlan">
              Operator plan (optional)
            </Label>
            <Textarea
              id="operatorPlan"
              placeholder="If you plan to operate this yourself, describe your vision: How would you grow it? What would you change? What would you keep?"
              value={operatorPlan}
              onChange={(e) => setOperatorPlan(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Founders love hearing concrete plans for their baby.
            </p>
          </div>

          {/* LinkedIn (optional) */}
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn profile (optional but recommended)</Label>
            <Input
              id="linkedin"
              type="url"
              placeholder="https://linkedin.com/in/yourprofile"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Adding your LinkedIn helps founders trust you faster.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-xs text-muted-foreground">Your info is shared only with this founder.</p>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !companyName || !message || !budgetRange || !timeline || !buyerType}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Request
              </>
            )}
          </Button>
        </div>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">{renderStatusContent()}</DialogContent>
    </Dialog>
  );
}

// Export a status badge component for use in other places
export function AccessRequestStatusBadge({
  status,
}: {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
}) {
  if (!status) return null;

  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Pending Review
        </Badge>
      );
    case 'APPROVED':
      return (
        <Badge className="bg-green-100 text-green-700">
          <CheckCircle className="h-3 w-3 mr-1" />
          Access Granted
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Not Approved
        </Badge>
      );
    default:
      return null;
  }
}
