'use client';

/**
 * Home Page - Landing / Redirect
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if profile exists
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      }
    };

    checkAuth();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            🌟 Holistic Wellness AI
          </h1>
          <p className="text-2xl text-gray-700 mb-8">
            Your AI-powered companion for nutrition, mental health, and spiritual wellness
          </p>
          <p className="text-lg text-gray-600 mb-12">
            Get personalized meal plans, meditation guidance, astrological insights, and optimized daily schedules—all in one platform.
          </p>

          <div className="flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-5xl mb-4">🥗</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Nutrition</h3>
            <p className="text-sm text-gray-600">
              AI-generated meal plans tailored to your goals, preferences, and dietary needs
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-5xl mb-4">🧘</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mental Wellness</h3>
            <p className="text-sm text-gray-600">
              Mood tracking, meditation guidance, and stress management techniques
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Spiritual Guidance</h3>
            <p className="text-sm text-gray-600">
              Astrological insights, Ayurvedic wisdom, and spiritual practices
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Optimized Schedule</h3>
            <p className="text-sm text-gray-600">
              Smart daily planning that balances work, wellness, and personal time
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-24 bg-white rounded-2xl shadow-xl p-12 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">AI-Powered</div>
              <div className="text-gray-600">Using Claude 3.5 for intelligent recommendations</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">4 Domains</div>
              <div className="text-gray-600">Nutrition, Mental, Spiritual & Scheduling</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">Personalized</div>
              <div className="text-gray-600">Tailored to your unique profile and goals</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
