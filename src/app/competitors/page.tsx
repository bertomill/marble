import CompetitorAnalysis from '@/components/CompetitorAnalysis';

export default function CompetitorsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-800">Get Inspiration From Competitors</h1>
            <p className="text-gray-700 mt-2 text-lg">
              Analyze top websites in your industry to inform your design decisions
            </p>
          </div>
          
          <CompetitorAnalysis />
          
          <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Why Study Competitors?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-indigo-50 p-6 rounded-lg">
                <div className="text-indigo-600 text-2xl font-bold mb-3">01</div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Identify Best Practices</h3>
                <p className="text-gray-800">
                  Discover what works well in your industry by studying successful competitors. Learn from their successes and avoid their mistakes.
                </p>
              </div>
              
              <div className="bg-indigo-50 p-6 rounded-lg">
                <div className="text-indigo-600 text-2xl font-bold mb-3">02</div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Find Your Unique Position</h3>
                <p className="text-gray-800">
                  By understanding what others offer, you can identify gaps and opportunities to differentiate your website and brand.
                </p>
              </div>
              
              <div className="bg-indigo-50 p-6 rounded-lg">
                <div className="text-indigo-600 text-2xl font-bold mb-3">03</div>
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Save Development Time</h3>
                <p className="text-gray-800">
                  Leverage proven design patterns and user flows to accelerate your website development and improve user experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 