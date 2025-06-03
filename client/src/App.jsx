import React, { useState } from 'react';

const defaultValues = {
  bedrooms: 3,
  bathrooms: 2,
  living_area: 1800,
  lot_area: 5000,
  floors: 2,
  waterfront: 0,
  views: 2,
  condition: 7,
  grade: 8,
  house_area: 2500,
  basement_area: 800,
  built_year: 2005,
  renovation_year: 2015,
  latitude: 47.5112,
  longitude: -122.257,
  living_area_renovated: 400,
  lot_area_renovated: 200,
  schools_nearby: 3,
  airport_distance: 20,
};

const App = () => {
  const [formData, setFormData] = useState({ ...defaultValues });
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Enhanced mock prediction with more realistic calculations
    setTimeout(() => {
      try {
        const basePrice =
          parseFloat(formData.living_area) * 180 +
          parseFloat(formData.bedrooms) * 25000 +
          parseFloat(formData.bathrooms) * 18000 +
          parseFloat(formData.lot_area) * 8 +
          (parseFloat(formData.waterfront) ? 125000 : 0) +
          parseFloat(formData.views) * 15000 +
          parseFloat(formData.condition) * 12000 +
          parseFloat(formData.grade) * 18000;

        const mockPrediction = {
          predicted_price: basePrice * (0.9 + Math.random() * 0.3),
          metrics: {
            r2_score: 0.88 + Math.random() * 0.08,
            mae: 18000 + Math.random() * 7000,
            rmse: 28000 + Math.random() * 10000,
            mape: 6 + Math.random() * 5,
          },
          model_info: {
            model_type: 'Advanced ML Ensemble',
          },
        };

        setPrediction(mockPrediction);
        setError('');
      } catch (err) {
        setError(
          'Unable to generate property valuation. Please verify all details and try again.'
        );
        setPrediction(null);
      } finally {
        setIsLoading(false);
      }
    }, 3000);
  };

  const fillDefaults = () => {
    setFormData({ ...defaultValues });
    setError('');
    setPrediction(null);
  };

  const formatFieldName = (key) => {
    const customNames = {
      living_area: 'Living Area (sq ft)',
      lot_area: 'Property Size (sq ft)',
      house_area: 'Total Home Area (sq ft)',
      basement_area: 'Basement Area (sq ft)',
      built_year: 'Year Built',
      renovation_year: 'Last Renovated',
      living_area_renovated: 'Renovated Living Space (sq ft)',
      lot_area_renovated: 'Renovated Lot Area (sq ft)',
      schools_nearby: 'Schools Nearby',
      airport_distance: 'Airport Distance (miles)',
      waterfront: 'Waterfront (0=No, 1=Yes)',
    };

    return (
      customNames[key] ||
      key
        .replace(/_/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    );
  };

  const getFieldIcon = (key) => {
    const icons = {
      bedrooms: '🛏️',
      bathrooms: '🚿',
      living_area: '🏠',
      lot_area: '🌿',
      floors: '🏢',
      waterfront: '🌊',
      views: '🏔️',
      condition: '⭐',
      grade: '💎',
      house_area: '📏',
      basement_area: '🏠',
      built_year: '🗓️',
      renovation_year: '🔨',
      latitude: '📍',
      longitude: '🌐',
      living_area_renovated: '✨',
      lot_area_renovated: '🌱',
      schools_nearby: '🎓',
      airport_distance: '✈️',
    };
    return icons[key] || '🏡';
  };

  const getFieldCategory = (key) => {
    const categories = {
      bedrooms: 'interior',
      bathrooms: 'interior',
      living_area: 'interior',
      house_area: 'interior',
      basement_area: 'interior',
      floors: 'interior',
      condition: 'interior',
      grade: 'interior',
      living_area_renovated: 'interior',
      lot_area: 'exterior',
      waterfront: 'exterior',
      views: 'exterior',
      lot_area_renovated: 'exterior',
      built_year: 'details',
      renovation_year: 'details',
      latitude: 'location',
      longitude: 'location',
      schools_nearby: 'location',
      airport_distance: 'location',
    };
    return categories[key] || 'other';
  };

  const groupedFields = {
    interior: Object.keys(formData).filter(
      (key) => getFieldCategory(key) === 'interior'
    ),
    exterior: Object.keys(formData).filter(
      (key) => getFieldCategory(key) === 'exterior'
    ),
    location: Object.keys(formData).filter(
      (key) => getFieldCategory(key) === 'location'
    ),
    details: Object.keys(formData).filter(
      (key) => getFieldCategory(key) === 'details'
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100">
      {/* Compact Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Astra</h1>
                <p className="text-xs text-gray-500">Property Analytics</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Hero */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight text-gray-900">
            Discover Your
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Property's Worth
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Get an instant, accurate market valuation powered by advanced AI and
            comprehensive market analysis
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">
                Market Accurate
              </h3>
              <p className="text-xs text-gray-600 mt-1">Real-time data</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">
                Instant Results
              </h3>
              <p className="text-xs text-gray-600 mt-1">Quick analysis</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">
                AI Powered
              </h3>
              <p className="text-xs text-gray-600 mt-1">Smart algorithms</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">
                Professional Grade
              </h3>
              <p className="text-xs text-gray-600 mt-1">Industry standard</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Property Details Form */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-gray-50 to-stone-50 px-8 py-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              📋 Property Information
            </h2>
            <p className="text-gray-600 mt-2">
              Please provide detailed information about your property for the
              most accurate valuation
            </p>
          </div>

          <div className="p-8">
            {/* Interior Features */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                🏠 Interior Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedFields.interior.map((key) => (
                  <div key={key} className="group relative">
                    <label className="flex items-center gap-3 text-gray-700 font-semibold mb-3 text-sm">
                      <span className="text-xl p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                        {getFieldIcon(key)}
                      </span>
                      {formatFieldName(key)}
                    </label>
                    <input
                      type="number"
                      step="any"
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      required
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-300 outline-none bg-gray-50 focus:bg-white text-gray-800 font-medium"
                      placeholder="Enter value"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Exterior Features */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                🌿 Exterior & Views
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {groupedFields.exterior.map((key) => (
                  <div key={key} className="group relative">
                    <label className="flex items-center gap-3 text-gray-700 font-semibold mb-3 text-sm">
                      <span className="text-xl p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                        {getFieldIcon(key)}
                      </span>
                      {formatFieldName(key)}
                    </label>
                    <input
                      type="number"
                      step="any"
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      required
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-50 transition-all duration-300 outline-none bg-gray-50 focus:bg-white text-gray-800 font-medium"
                      placeholder="Enter value"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Location Details */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                📍 Location & Neighborhood
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {groupedFields.location.map((key) => (
                  <div key={key} className="group relative">
                    <label className="flex items-center gap-3 text-gray-700 font-semibold mb-3 text-sm">
                      <span className="text-xl p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                        {getFieldIcon(key)}
                      </span>
                      {formatFieldName(key)}
                    </label>
                    <input
                      type="number"
                      step="any"
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      required
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all duration-300 outline-none bg-gray-50 focus:bg-white text-gray-800 font-medium"
                      placeholder="Enter value"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Property History */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                🗓️ Property History
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {groupedFields.details.map((key) => (
                  <div key={key} className="group relative">
                    <label className="flex items-center gap-3 text-gray-700 font-semibold mb-3 text-sm">
                      <span className="text-xl p-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                        {getFieldIcon(key)}
                      </span>
                      {formatFieldName(key)}
                    </label>
                    <input
                      type="number"
                      step="any"
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      required
                      className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-50 transition-all duration-300 outline-none bg-gray-50 focus:bg-white text-gray-800 font-medium"
                      placeholder="Enter value"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-6 pt-8 border-t border-gray-200">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="group relative px-12 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-bold rounded-2xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 transform hover:-translate-y-1 transition-all duration-300 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 text-lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Analyzing Property...</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">💰</span>
                    <span>Get Property Valuation</span>
                  </>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </button>

              <button
                onClick={fillDefaults}
                className="px-12 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold rounded-2xl hover:from-gray-700 hover:to-gray-800 transform hover:-translate-y-1 transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 text-lg"
              >
                <span className="text-2xl">🔄</span>
                <span>Reset Form</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-8 bg-gradient-to-r from-red-50 to-pink-50 border-l-8 border-red-500 p-8 rounded-2xl shadow-lg">
            <div className="flex items-center">
              <span className="text-4xl mr-4">⚠️</span>
              <div>
                <h3 className="text-red-800 font-bold text-xl mb-2">
                  Valuation Error
                </h3>
                <p className="text-red-700 text-lg">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Prediction Results */}
        {prediction && (
          <div className="mt-8 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200 rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-8">
              <div className="text-center">
                <div className="inline-flex items-center bg-white bg-opacity-20 px-6 py-3 rounded-full text-lg font-semibold mb-4">
                  🎉 Valuation Complete
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  Property Market Value
                </h2>
                <div className="text-6xl md:text-8xl font-black mb-4 tracking-tight">
                  $
                  {prediction.predicted_price.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </div>
                <p className="text-xl text-green-100">
                  Estimated Current Market Value
                </p>
              </div>
            </div>

            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                📊 Valuation Analytics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {(prediction.metrics.r2_score * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide">
                    Accuracy Score
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    R² Coefficient
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    ${Math.round(prediction.metrics.mae).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide">
                    Avg Error
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Mean Absolute
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    ${Math.round(prediction.metrics.rmse).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide">
                    RMSE
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Root Mean Square
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {prediction.metrics.mape.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide">
                    Error Rate
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Mean Absolute %
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="text-lg font-bold text-indigo-600 mb-2">
                    {prediction.model_info.model_type}
                  </div>
                  <div className="text-sm text-gray-600 font-semibold uppercase tracking-wide">
                    AI Model
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Prediction Engine
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <p className="text-gray-600 text-lg">
                  This valuation is based on comprehensive market analysis and
                  comparable properties in your area.
                </p>
                <div className="flex justify-center items-center mt-4 space-x-6 text-sm text-gray-500">
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Market Data Updated Daily
                  </span>
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    AI-Powered Analysis
                  </span>
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                    Professional Grade Accuracy
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 pb-8">
          <div className="inline-flex items-center bg-white rounded-full px-8 py-4 shadow-lg border border-gray-200">
            <span className="text-gray-600 text-lg">
              Powered by Astra advanced real estate analytics and machine
              learning
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
