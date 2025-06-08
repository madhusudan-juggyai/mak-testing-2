import React from 'react';

// Enhanced Conversation Summary Component matching the wireframe design
const ConversationSummary = ({ conversation, onBack, onStartNew }) => {
  const analysis = conversation.analysis || {};
  const scores = {
    confidence: analysis.confidence_score || 7.5,
    fluency: analysis.fluency_score || 8.2,
    patience: analysis.patience_score || 6.8,
    preparedness: analysis.preparedness_score || 7.9,
    overall: analysis.overall_score || 7.6
  };

  // Calculate overall performance percentage
  const overallPerformance = Math.round((scores.overall / 10) * 100);

  const getScoreColor = (score) => {
    if (score >= 8) return 'from-green-400 to-green-600';
    if (score >= 6) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Improvement';
  };

  const timeline = analysis.timeline || [];
  const strengths = analysis.strengths || ['Good communication', 'Clear responses'];
  const improvements = analysis.improvements || ['More specific examples needed'];
  const recommendations = analysis.recommendations || ['Practice STAR method'];

  // Mock data for comprehensive analysis (in production, this would come from AI analysis)
  const detailedScores = {
    questionsAnswered: { current: 12, total: 15, percentage: 80 },
    communication: 4.2,
    technicalSkills: 4.5,
    behavioral: 3.8
  };

  const communicationBreakdown = {
    clarity: 4.5,
    speakingPace: 4.0,
    confidence: 4.0
  };

  const keyObservations = [
    "Demonstrated strong analytical thinking when discussing product metrics",
    "Provided concrete examples from previous experience at current company",
    "Could improve on structuring responses using frameworks like STAR method",
    "Showed good understanding of user-centered design principles"
  ];

  const Circle = ({ percentage, size = 120, strokeWidth = 8, color = '#4F46E5' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${getPerformanceColor(percentage)}`}>
            {percentage}%
          </span>
        </div>
      </div>
    );
  };

  const ScoreBar = ({ label, score, maxScore = 5 }) => {
    const percentage = (score / maxScore) * 100;
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm font-medium text-gray-700 w-24">{label}</span>
        <div className="flex-1 mx-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
        <span className="text-sm font-semibold text-gray-900 w-12">{score}/{maxScore}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Interview Performance Analysis</h1>
          <button
            onClick={onStartNew}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
          >
            Start New Session
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Overall Performance */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Overall Performance</h2>
              
              <Circle percentage={overallPerformance} size={160} strokeWidth={12} />
              
              <div className="mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Questions Answered</span>
                  <span className="font-semibold">{detailedScores.questionsAnswered.current}/{detailedScores.questionsAnswered.total}</span>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-900">Communication</span>
                    <span className="font-bold text-blue-600">{detailedScores.communication}/5</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-900">Technical Skills</span>
                    <span className="font-bold text-green-600">{detailedScores.technicalSkills}/5</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium text-orange-900">Behavioral</span>
                    <span className="font-bold text-orange-600">{detailedScores.behavioral}/5</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Communication Skills Breakdown */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication Skills</h3>
              <div className="space-y-3">
                <ScoreBar label="Clarity" score={communicationBreakdown.clarity} />
                <ScoreBar label="Speaking Pace" score={communicationBreakdown.speakingPace} />
                <ScoreBar label="Confidence" score={communicationBreakdown.confidence} />
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Observations */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Key Observations
              </h3>
              <div className="grid gap-3">
                {keyObservations.map((observation, index) => (
                  <div key={index} className="flex items-start p-4 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-700 text-sm">{observation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Categories */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Technical Competency */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Technical Competency
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Product Strategy</span>
                    <span className="font-semibold text-green-600">Strong</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Data Analysis</span>
                    <span className="font-semibold text-yellow-600">Good</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Market Research</span>
                    <span className="font-semibold text-green-600">Strong</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Prioritization</span>
                    <span className="font-semibold text-yellow-600">Good</span>
                  </div>
                </div>
              </div>

              {/* Behavioral Assessment */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Behavioral Assessment
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Leadership</span>
                    <span className="font-semibold text-green-600">Strong</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Problem Solving</span>
                    <span className="font-semibold text-green-600">Strong</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Adaptability</span>
                    <span className="font-semibold text-yellow-600">Good</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Communication</span>
                    <span className="font-semibold text-green-600">Strong</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Industry Benchmark */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Industry Benchmark Comparison
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{overallPerformance}%</div>
                  <div className="text-sm text-gray-600">Your Score</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">72%</div>
                  <div className="text-sm text-gray-600">Industry Average</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">+{overallPerformance - 72}%</div>
                  <div className="text-sm text-gray-600">Above Average</div>
                </div>
              </div>
            </div>

            {/* Personalized Recommendations */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Personalized Recommendations
              </h3>
              <div className="grid gap-4">
                {recommendations.slice(0, 4).map((recommendation, index) => (
                  <div key={index} className="flex items-start p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white text-center">
              <h3 className="text-xl font-semibold mb-2">Ready to Improve Further?</h3>
              <p className="text-indigo-100 mb-4">Practice more scenarios to enhance your PM interview skills</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={onStartNew}
                  className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Practice Again
                </button>
                <button
                  onClick={onBack}
                  className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-colors"
                >
                  View All Sessions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationSummary;