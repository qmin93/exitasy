'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  CheckCircle,
  DollarSign,
  Clock,
  Users,
  Briefcase,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const BUDGET_RANGES = [
  { value: 'under_10k', label: 'Under $10K' },
  { value: '10k_25k', label: '$10K - $25K' },
  { value: '25k_50k', label: '$25K - $50K' },
  { value: '50k_100k', label: '$50K - $100K' },
  { value: '100k_plus', label: '$100K+' },
];

const TIMELINES = [
  { value: 'asap', label: 'As soon as possible' },
  { value: '1_month', label: 'Within 1 month' },
  { value: '3_months', label: 'Within 3 months' },
  { value: 'exploring', label: 'Just exploring' },
];

const BUYER_TYPES = [
  { value: 'first_time', label: 'First-time Buyer', description: 'Looking to acquire my first business' },
  { value: 'serial', label: 'Serial Acquirer', description: 'Have acquired businesses before' },
  { value: 'operator', label: 'Operator/Builder', description: 'Want to run and grow the business' },
  { value: 'investor', label: 'Investor/Fund', description: 'Investing on behalf of a fund or group' },
];

const BENEFITS = [
  {
    icon: DollarSign,
    title: 'Full Deal Access',
    description: 'View detailed financials, unit economics, and founder contact info',
  },
  {
    icon: Users,
    title: 'Request Introductions',
    description: 'Connect directly with founders of startups you\'re interested in',
  },
  {
    icon: Clock,
    title: 'Early Alerts',
    description: 'Get notified when new startups matching your criteria list for sale',
  },
  {
    icon: Shield,
    title: 'Verified Status',
    description: 'Your profile is verified, building trust with founders',
  },
];

export default function BuyerApplyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    companyName: '',
    budgetRange: '',
    timeline: '',
    buyerType: '',
    message: '',
    linkedinUrl: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Extended session type
  const user = session?.user as {
    id?: string;
    role?: string;
    buyerStatus?: string;
  } | undefined;

  // Already a buyer
  const isAlreadyBuyer = user?.role === 'BUYER';
  const buyerStatus = user?.buyerStatus;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/buyer/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit application');
      }

      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="animate-pulse">
            <CardContent className="p-12">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Not logged in
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
              <p className="text-muted-foreground mb-6">
                Please sign in to apply as a verified buyer.
              </p>
              <Button asChild>
                <Link href="/api/auth/signin">
                  Sign In to Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Already a buyer - show status
  if (isAlreadyBuyer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <Card>
            <CardContent className="p-12 text-center">
              {buyerStatus === 'APPROVED' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">You're Approved!</h1>
                  <p className="text-muted-foreground mb-6">
                    You already have full buyer access. Start browsing startups for sale.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button asChild>
                      <Link href="/?type=for_sale">
                        Browse For Sale
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/buyer/inbox">My Inbox</Link>
                    </Button>
                  </div>
                </>
              ) : buyerStatus === 'PENDING' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Application Pending</h1>
                  <p className="text-muted-foreground mb-6">
                    Your buyer application is being reviewed. We'll notify you by email once approved.
                  </p>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Usually 24-48 hours
                  </Badge>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Application Not Approved</h1>
                  <p className="text-muted-foreground mb-6">
                    Unfortunately, your previous application wasn't approved. Contact support for more info.
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/support">Contact Support</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Application Submitted!</h1>
              <p className="text-muted-foreground mb-6">
                Thanks for applying! We'll review your application and notify you by email.
              </p>
              <Badge className="bg-green-100 text-green-800">
                Expected response: 24-48 hours
              </Badge>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full text-green-700 text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Verified Buyer Program
          </div>
          <h1 className="text-3xl font-bold mb-3">Apply as a Buyer</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Get verified access to full deal details, connect directly with founders, and find your next acquisition.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Benefits Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="font-semibold text-lg mb-4">What You Get</h2>
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Card key={benefit.title} className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="p-2 rounded-lg bg-green-50">
                        <Icon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{benefit.title}</h3>
                        <p className="text-xs text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Application Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Buyer Application
                </CardTitle>
                <CardDescription>
                  Tell us a bit about yourself so we can verify your profile.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company / Fund Name (optional)</Label>
                    <Input
                      id="companyName"
                      placeholder="e.g., Acme Ventures"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      If you're representing a company or fund
                    </p>
                  </div>

                  {/* Budget Range */}
                  <div className="space-y-2">
                    <Label htmlFor="budgetRange">Acquisition Budget *</Label>
                    <Select
                      value={formData.budgetRange}
                      onValueChange={(value) => setFormData({ ...formData, budgetRange: value })}
                    >
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
                    <Label htmlFor="timeline">Timeline *</Label>
                    <Select
                      value={formData.timeline}
                      onValueChange={(value) => setFormData({ ...formData, timeline: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="When are you looking to acquire?" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMELINES.map((timeline) => (
                          <SelectItem key={timeline.value} value={timeline.value}>
                            {timeline.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Buyer Type */}
                  <div className="space-y-3">
                    <Label>Buyer Type *</Label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {BUYER_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, buyerType: type.value })}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            formData.buyerType === type.value
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Tell us about yourself *</Label>
                    <Textarea
                      id="message"
                      placeholder="What kind of startups are you looking for? Any specific industries or revenue ranges?"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 50 characters
                    </p>
                  </div>

                  {/* LinkedIn */}
                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl">LinkedIn Profile (optional)</Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Helps us verify your profile faster
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Submit */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    disabled={
                      isSubmitting ||
                      !formData.budgetRange ||
                      !formData.timeline ||
                      !formData.buyerType ||
                      formData.message.length < 50
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By applying, you agree to our terms of service and privacy policy.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
