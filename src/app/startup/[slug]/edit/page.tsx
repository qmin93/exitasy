'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Loader2,
  ArrowLeft,
  Save,
  AlertCircle,
  Globe,
  Camera,
  Video,
  DollarSign,
  Tag,
  FileText,
  Users,
  Target,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const STAGE_OPTIONS = [
  { value: 'MAKING_MONEY', label: 'Making Money' },
  { value: 'EXIT_READY', label: 'Exit Ready' },
  { value: 'ACQUISITION_INTEREST', label: 'Acquisition Interest' },
  { value: 'FOR_SALE', label: 'For Sale' },
];

const CATEGORY_OPTIONS = [
  'SaaS',
  'AI',
  'Developer Tools',
  'Marketing',
  'Productivity',
  'E-commerce',
  'Fintech',
  'Healthcare',
  'Education',
  'Social',
  'Entertainment',
  'Other',
];

const SALE_INCLUDES_OPTIONS = [
  'Full codebase',
  'Domain name',
  'Customer list',
  'Brand assets',
  'Documentation',
  'Support & training',
  'Social media accounts',
  'Email list',
  'API integrations',
];

interface StartupData {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logo: string | null;
  website: string;
  screenshots: string[];
  videoUrl: string | null;
  categories: string[];
  stage: string;
  askingPrice: number | null;
  saleMultiple: number | null;
  saleIncludes: string[];
  saleReason: string | null;
  targetUsers: string | null;
  monetizationModel: string | null;
  makers: {
    userId: string;
  }[];
}

export default function EditStartupPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { data: session, status } = useSession();

  const [startup, setStartup] = useState<StartupData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    website: '',
    logo: '',
    screenshots: [] as string[],
    videoUrl: '',
    categories: [] as string[],
    stage: 'MAKING_MONEY',
    askingPrice: '',
    saleMultiple: '',
    saleIncludes: [] as string[],
    saleReason: '',
    targetUsers: '',
    monetizationModel: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    async function fetchStartup() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/startups/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Startup not found');
          } else {
            throw new Error('Failed to fetch startup');
          }
          return;
        }
        const data = await res.json();

        // Check if current user is a maker
        const isMaker = data.makers?.some(
          (maker: { user: { id: string } }) => maker.user?.id === session?.user?.id
        );
        if (!isMaker) {
          setError('You are not authorized to edit this startup');
          return;
        }

        setStartup(data);
        setFormData({
          name: data.name || '',
          tagline: data.tagline || '',
          description: data.description || '',
          website: data.website || '',
          logo: data.logo || '',
          screenshots: data.screenshots || [],
          videoUrl: data.videoUrl || '',
          categories: data.categories || [],
          stage: data.stage || 'MAKING_MONEY',
          askingPrice: data.askingPrice ? String(data.askingPrice) : '',
          saleMultiple: data.saleMultiple ? String(data.saleMultiple) : '',
          saleIncludes: data.saleIncludes || [],
          saleReason: data.saleReason || '',
          targetUsers: data.targetUsers || '',
          monetizationModel: data.monetizationModel || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    if (status === 'authenticated' && slug) {
      fetchStartup();
    }
  }, [status, slug, session?.user?.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/startups/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          tagline: formData.tagline,
          description: formData.description,
          website: formData.website,
          logo: formData.logo || null,
          screenshots: formData.screenshots,
          videoUrl: formData.videoUrl || null,
          categories: formData.categories,
          stage: formData.stage,
          askingPrice: formData.askingPrice ? parseInt(formData.askingPrice) : null,
          saleMultiple: formData.saleMultiple ? parseFloat(formData.saleMultiple) : null,
          saleIncludes: formData.saleIncludes,
          saleReason: formData.saleReason || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update startup');
      }

      setSuccessMessage('Startup updated successfully!');
      setTimeout(() => {
        router.push(`/startup/${slug}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update startup');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const toggleSaleInclude = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      saleIncludes: prev.saleIncludes.includes(item)
        ? prev.saleIncludes.filter((i) => i !== item)
        : [...prev.saleIncludes, item],
    }));
  };

  const isForSale = formData.stage === 'FOR_SALE' || formData.stage === 'EXIT_READY';

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="flex justify-center gap-3">
                <Link href="/my-startups">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to My Startups
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/startup/${slug}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Startup</h1>
            <p className="text-muted-foreground">Update your startup details</p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="py-4">
              <p className="text-green-700 font-medium">{successMessage}</p>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="py-4">
              <p className="text-red-700 font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Startup Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="tagline">Tagline *</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="A short, catchy description"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="website">Website *</Label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-purple-500" />
                Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logo">Logo URL</Label>
                <Input
                  id="logo"
                  type="url"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="videoUrl">Video URL (YouTube, Loom, etc.)</Label>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="videoUrl"
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-green-500" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((category) => (
                  <Badge
                    key={category}
                    variant={formData.categories.includes(category) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stage & Sale Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-500" />
                Stage & Sale Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="stage">Current Stage</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) => setFormData({ ...formData, stage: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isForSale && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="askingPrice">Asking Price ($)</Label>
                      <Input
                        id="askingPrice"
                        type="number"
                        value={formData.askingPrice}
                        onChange={(e) => setFormData({ ...formData, askingPrice: e.target.value })}
                        placeholder="e.g., 50000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="saleMultiple">Multiple (x)</Label>
                      <Input
                        id="saleMultiple"
                        type="number"
                        step="0.1"
                        value={formData.saleMultiple}
                        onChange={(e) => setFormData({ ...formData, saleMultiple: e.target.value })}
                        placeholder="e.g., 3.5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>What's Included in Sale</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {SALE_INCLUDES_OPTIONS.map((item) => (
                        <Badge
                          key={item}
                          variant={formData.saleIncludes.includes(item) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleSaleInclude(item)}
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="saleReason">Why are you selling?</Label>
                    <Textarea
                      id="saleReason"
                      value={formData.saleReason}
                      onChange={(e) => setFormData({ ...formData, saleReason: e.target.value })}
                      rows={3}
                      placeholder="Share your story..."
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Business Model */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Business Model
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="targetUsers">Target Users</Label>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="targetUsers"
                    value={formData.targetUsers}
                    onChange={(e) => setFormData({ ...formData, targetUsers: e.target.value })}
                    placeholder="e.g., Small business owners, developers..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="monetizationModel">Monetization Model</Label>
                <Input
                  id="monetizationModel"
                  value={formData.monetizationModel}
                  onChange={(e) => setFormData({ ...formData, monetizationModel: e.target.value })}
                  placeholder="e.g., SaaS subscription, one-time purchase..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href={`/startup/${slug}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
