export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-50 via-indigo-50 to-purple-50">
      <main className="flex flex-col items-center gap-8 max-w-4xl">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold wellness-gradient bg-clip-text text-transparent">
            Holistic Wellness AI
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Your Personal AI-Powered Wellness Companion
          </p>
          <p className="text-lg text-gray-500 max-w-2xl">
            Integrating Nutrition, Mental Health, and Spiritual Guidance for a Balanced Life
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
          {/* Nutrition Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 card-hover border-t-4 border-wellness-nutrition">
            <div className="text-4xl mb-4">🥗</div>
            <h3 className="text-xl font-semibold text-wellness-nutrition mb-2">
              Nutrition
            </h3>
            <p className="text-gray-600">
              Personalized meal planning with AI-powered nutrition optimization
            </p>
          </div>

          {/* Mental Health Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 card-hover border-t-4 border-wellness-mental">
            <div className="text-4xl mb-4">🧘</div>
            <h3 className="text-xl font-semibold text-wellness-mental mb-2">
              Mental Health
            </h3>
            <p className="text-gray-600">
              Mood tracking, meditation guidance, and mental wellness support
            </p>
          </div>

          {/* Spiritual Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 card-hover border-t-4 border-wellness-spiritual">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-semibold text-wellness-spiritual mb-2">
              Spiritual
            </h3>
            <p className="text-gray-600">
              Astrological insights and spiritual guidance for holistic growth
            </p>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button className="px-8 py-3 bg-gradient-to-r from-green-500 to-indigo-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity">
            Get Started
          </button>
          <button className="px-8 py-3 border-2 border-indigo-500 text-indigo-500 font-semibold rounded-lg hover:bg-indigo-50 transition-colors">
            Learn More
          </button>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Powered by Multi-Agent AI Architecture</p>
          <p className="mt-1">MCP • A2A • Claude • Supabase • OR-Tools</p>
        </div>
      </main>
    </div>
  );
}
