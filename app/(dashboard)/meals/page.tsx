'use client';

/**
 * Meals Page - Meal Planning & Logging
 */

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MealsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meal Plans</h1>
          <p className="text-gray-600">View and manage your nutrition</p>
        </div>
        <Button>Log Meal</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>Advanced meal planning features</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            This page will show your meal history, nutrition tracking, and allow you to log what you've eaten.
            For now, view your daily meal plan on the dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
