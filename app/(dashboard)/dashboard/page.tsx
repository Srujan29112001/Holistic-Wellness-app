'use client';

/**
 * Dashboard - Main Wellness Plan Display
 */

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useUserStore } from '@/lib/stores/user-store';
import { useWellnessStore } from '@/lib/stores/wellness-store';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const supabase = createBrowserClient();
  const { profile } = useUserStore();
  const { currentPlan, setCurrentPlan, isGenerating, setGenerating, setError } = useWellnessStore();
  const [todayDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadTodaysPlan();
  }, []);

  const loadTodaysPlan = async () => {
    try {
      const response = await fetch(`/api/wellness/plan?date=${todayDate}`);
      const data = await response.json();

      if (data.success && data.data) {
        setCurrentPlan({
          date: data.data.date,
          ...data.data.plan
        });
      }
    } catch (error) {
      console.error('Failed to load plan:', error);
    }
  };

  const generatePlan = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/wellness/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: todayDate,
          includeDomains: ['nutrition', 'mental', 'spiritual', 'schedule']
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate plan');
      }

      if (data.success && data.data) {
        setCurrentPlan({
          date: todayDate,
          ...data.data.plan
        });
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setGenerating(false);
    }
  };

  if (!currentPlan && !isGenerating) {
    return (
      <div className="text-center py-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Your Wellness Dashboard
          </h2>
          <p className="text-gray-600">
            Generate your personalized wellness plan for today
          </p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-6xl mb-4">🌟</div>
            <h3 className="text-lg font-semibold mb-2">Ready to start your wellness journey?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Our AI will create a personalized plan covering nutrition, mental health, spiritual wellness, and daily schedule.
            </p>
            <Button onClick={generatePlan} fullWidth>
              Generate Today's Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Generating Your Wellness Plan...</h2>
        <p className="text-gray-600">This may take a moment as we personalize your recommendations</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Today's Wellness Plan</h1>
          <p className="text-gray-600">{new Date(todayDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <Button onClick={generatePlan} isLoading={isGenerating}>
          Regenerate Plan
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl mb-2">🍽️</div>
              <div className="text-2xl font-bold text-gray-900">
                {currentPlan?.nutrition?.totalNutrition?.calories || '0'}
              </div>
              <div className="text-sm text-gray-600">Calories Today</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl mb-2">💪</div>
              <div className="text-2xl font-bold text-gray-900">
                {currentPlan?.nutrition?.totalNutrition?.protein || '0'}g
              </div>
              <div className="text-sm text-gray-600">Protein</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl mb-2">😊</div>
              <div className="text-2xl font-bold text-gray-900">
                {currentPlan?.mentalHealth?.recommendations?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Wellness Activities</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-2xl font-bold text-gray-900">
                {currentPlan?.schedule?.activities?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Scheduled</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nutrition Plan */}
      {currentPlan?.nutrition && (
        <Card>
          <CardHeader>
            <CardTitle>🥗 Nutrition Plan</CardTitle>
            <CardDescription>Your personalized meals for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentPlan.nutrition.meals?.map((meal: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900 capitalize">{meal.type}</h4>
                      <p className="text-sm font-medium text-gray-700">{meal.name}</p>
                      <p className="text-sm text-gray-600">{meal.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-blue-600">
                        {meal.nutrition?.calories || 0} kcal
                      </div>
                      <div className="text-xs text-gray-500">
                        P: {meal.nutrition?.protein || 0}g | C: {meal.nutrition?.carbs || 0}g | F: {meal.nutrition?.fat || 0}g
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {currentPlan.nutrition.notes && currentPlan.nutrition.notes.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">💡 Nutrition Tips</h5>
                <ul className="space-y-1">
                  {currentPlan.nutrition.notes.map((note: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700">{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mental Health */}
      {currentPlan?.mentalHealth && (
        <Card>
          <CardHeader>
            <CardTitle>🧘 Mental Wellness</CardTitle>
            <CardDescription>Practices for your mind and spirit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentPlan.mentalHealth.recommendations?.map((rec: any, index: number) => (
                <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                  <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>⏱️ {rec.duration} minutes</span>
                    {rec.when && <span>🕐 {rec.when}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spiritual Guidance */}
      {currentPlan?.spiritual && (
        <Card>
          <CardHeader>
            <CardTitle>✨ Spiritual Guidance</CardTitle>
            <CardDescription>Insights for your spiritual wellness</CardDescription>
          </CardHeader>
          <CardContent>
            {currentPlan.spiritual.dailyGuidance && (
              <div className="space-y-3">
                {currentPlan.spiritual.dailyGuidance.map((guidance: string, index: number) => (
                  <div key={index} className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-700">{guidance}</p>
                  </div>
                ))}
              </div>
            )}

            {currentPlan.spiritual.spiritualPractices && currentPlan.spiritual.spiritualPractices.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-900 mb-3">Today's Practices</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentPlan.spiritual.spiritualPractices.slice(0, 2).map((practice: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <h6 className="font-medium text-gray-900 text-sm">{practice.name}</h6>
                      <p className="text-xs text-gray-600 mt-1">{practice.description}</p>
                      <div className="text-xs text-gray-500 mt-2">⏱️ {practice.duration} min</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Daily Schedule */}
      {currentPlan?.schedule && (
        <Card>
          <CardHeader>
            <CardTitle>📅 Daily Schedule</CardTitle>
            <CardDescription>Your optimized timeline for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentPlan.schedule.activities?.map((activity: any, index: number) => (
                <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-900 w-20">
                    {activity.startTime}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{activity.title}</div>
                    {activity.description && (
                      <div className="text-xs text-gray-600">{activity.description}</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {activity.category}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
