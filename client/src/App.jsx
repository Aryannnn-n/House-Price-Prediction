import React, { useState, useEffect } from 'react';
import {
  Home,
  MapPin,
  Building,
  Calendar,
  Star,
  WifiOff,
  Loader2,
  TrendingUp,
  BarChart3,
  Target,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Info,
  Zap
} from 'lucide-react';

const HousePricePredictor = () => {
  const [formData, setFormData] = useState({
    bedrooms: 3,
    bathrooms: 2,
    living_area: 2000,
    lot_area: 5000,
    floors: 2,
    waterfront: 0,
    views: 2,
    condition: 7,
    grade: 8,
    house_area: 1800,
    basement_area: 200,
    built_year: 1990,
    renovation_year: 0,
    latitude: 47.548,
    longitude: -122.354,
    living_area_renovated: 0,
    lot_area_renovated: 0,
    schools_nearby: 3,
    airport_distance: 25,
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState(false);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [mockMode, setMockMode] = useState(false);

  const API_BASE_URL = 'http://localhost:5000';

  // Mock prediction function for demo purposes
  const getMockPrediction = (data) => {
    // Simple mock calculation based on key features
    const basePrice = 200000;
    const livingAreaPrice = data.living_area * 150;
    const bedroomPrice = data.bedrooms * 25000;
    const bathroomPrice = data.bathrooms * 15000;
    const gradeMultiplier = data.grade / 10;
    const conditionMultiplier = data.condition / 10;
    const waterfrontBonus = data.waterfront ? 100000 : 0;
    const ageDiscount = (2024 - data.built_year) * 500;
    
    const mockPrice = Math.max(50000, 
      (basePrice + livingAreaPrice + bedroomPrice + bathroomPrice + waterfrontBonus - ageDiscount) 
      * gradeMultiplier * conditionMultiplier
    );

    return {
      predicted_price: mockPrice,
      metrics: {
        r2_score: 0.8542,
        mae: 45230.25,
        rmse: 67845.12,
        mape: 12.34
      },
      model_info: {
        features_used: 24,
        model_type: 'RandomForestRegressor (Demo Mode)'
      },
      status: 'success'
    };
  };

  // Check API health
  useEffect(() => {
    checkAPIHealth();
  }, []);

  const checkAPIHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('API not responding');
      }
      
      const data = await response.json();

      if (data.status === 'healthy') {
        setApiStatus(true);
        setModelMetrics(data.model_metrics);
        setMockMode(false);
      }
    } catch (error) {
      console.warn('API health check failed, switching to demo mode:', error);
      setApiStatus(false);
      setMockMode(true);
      setModelMetrics({
        r2_score: 0.8542,
        mae: 45230.25,
        rmse: 67845.12
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const validateField = (name, value) => {
    const validations = {
      bedrooms: { min: 1, max: 20, message: 'Bedrooms must be between 1 and 20' },
      bathrooms: { min: 0.5, max: 20, message: 'Bathrooms must be between 0.5 and 20' },
      living_area: { min: 100, max: 50000, message: 'Living area must be between 100 and 50,000 sq ft' },
      lot_area: { min: 100, max: 1000000, message: 'Lot area must be between 100 and 1,000,000 sq ft' },
      floors: { min: 1, max: 10, message: 'Floors must be between 1 and 10' },
      waterfront: { min: 0, max: 1, message: 'Waterfront must be 0 or 1' },
      views: { min: 0, max: 5, message: 'Views must be between 0 and 5' },
      condition: { min: 1, max: 10, message: 'Condition must be between 1 and 10' },
      grade: { min: 1, max: 13, message: 'Grade must be between 1 and 13' },
      house_area: { min: 100, max: 50000, message: 'House area must be between 100 and 50,000 sq ft' },
      basement_area: { min: 0, max: 10000, message: 'Basement area must be between 0 and 10,000 sq ft' },
      built_year: { min: 1800, max: 2024, message: 'Built year must be between 1800 and 2024' },
      renovation_year: { min: 0, max: 2024, message: 'Renovation year must be between 0 and 2024' },
      schools_nearby: { min: 0, max: 50, message: 'Schools nearby must be between 0 and 50' },
      airport_distance: { min: 0, max: 500, message: 'Airport distance must be between 0 and 500 miles' }
    };

    const validation = validations[name];
    if (validation && (value < validation.min || value > validation.max)) {
      return validation.message;
    }
    return null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = parseFloat(value) || 0;

    // Validate the field
    const error = validateField(name, parsedValue);
    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }));

    setFormData((prev) => {
      const updated = { ...prev, [name]: parsedValue };
      
      // Auto-adjust house area based on living area
      if (name === 'living_area') {
        updated.house_area = Math.max(100, parsedValue * 0.9);
      }
      
      return updated;
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setPrediction(null);

    // Check for validation errors
    const errors = Object.values(validationErrors).filter(error => error !== null);
    if (errors.length > 0) {
      setError('Please fix validation errors before submitting');
      setLoading(false);
      return;
    }

    try {
      if (mockMode) {
        // Use mock prediction
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
        const mockResult = getMockPrediction(formData);
        setPrediction(mockResult);
      } else {
        // Use real API
        const response = await fetch(`${API_BASE_URL}/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Prediction failed');
        }

        const result = await response.json();
        setPrediction(result);
      }
    } catch (error) {
      console.error('Prediction error:', error);
      setError(error.message || 'An error occurred while making the prediction');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({
    label,
    name,
    type = 'number',
    min,
    max,
    step,
    icon: Icon,
    suffix,
    ...props
  }) => {
    const hasError = validationErrors[name];
    
    return (
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          {Icon && <Icon className="w-4 h-4 text-indigo-500" />}
          {label}
        </label>
        <div className="relative">
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            className={`w-full px-4 py-3 bg-white border-2 rounded-xl focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none text-gray-800 ${
              hasError 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-200 focus:border-indigo-500'
            }`}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              {suffix}
            </span>
          )}
        </div>
        {hasError && (
          <p className="text-red-500 text-xs flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {hasError}
          </p>
        )}
      </div>
    );
  };

  const SelectField = ({ label, name, options, icon: Icon }) => (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        {Icon && <Icon className="w-4 h-4 text-indigo-500" />}
        {label}
      </label>
      <select
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none text-gray-800"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-2xl">
                <Home className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  House Price Predictor
                </h1>
                <p className="text-gray-600 mt-1">
                  Get accurate price predictions with AI-powered analysis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {mockMode && (
                <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">Demo Mode</span>
                </div>
              )}
              {apiStatus ? (
                <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">API Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm font-medium">API Offline</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">
                  Property Details
                </h2>
                <p className="text-indigo-100 mt-1">
                  Fill in the details to get your price prediction
                </p>
              </div>

              <div className="p-8 space-y-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <h3 className="flex items-center gap-3 text-xl font-bold text-gray-800 border-b border-gray-200 pb-3">
                    <Building className="w-6 h-6 text-indigo-500" />
                    Basic Information
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <InputField
                      label="Bedrooms"
                      name="bedrooms"
                      min="1"
                      max="20"
                      icon={Home}
                    />
                    <InputField
                      label="Bathrooms"
                      name="bathrooms"
                      min="0.5"
                      max="20"
                      step="0.5"
                    />
                    <InputField label="Floors" name="floors" min="1" max="10" />
                  </div>
                </div>

                {/* Area Details */}
                <div className="space-y-6">
                  <h3 className="flex items-center gap-3 text-xl font-bold text-gray-800 border-b border-gray-200 pb-3">
                    <BarChart3 className="w-6 h-6 text-indigo-500" />
                    Area Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <InputField
                      label="Living Area"
                      name="living_area"
                      min="100"
                      max="50000"
                      suffix="sq ft"
                    />
                    <InputField
                      label="Lot Area"
                      name="lot_area"
                      min="100"
                      max="1000000"
                      suffix="sq ft"
                    />
                    <InputField
                      label="House Area (excl. basement)"
                      name="house_area"
                      min="100"
                      max="50000"
                      suffix="sq ft"
                    />
                    <InputField
                      label="Basement Area"
                      name="basement_area"
                      min="0"
                      max="10000"
                      suffix="sq ft"
                    />
                    <InputField
                      label="Living Area Renovated"
                      name="living_area_renovated"
                      min="0"
                      max="50000"
                      suffix="sq ft"
                    />
                    <InputField
                      label="Lot Area Renovated"
                      name="lot_area_renovated"
                      min="0"
                      max="1000000"
                      suffix="sq ft"
                    />
                  </div>
                </div>

                {/* Location & Age */}
                <div className="space-y-6">
                  <h3 className="flex items-center gap-3 text-xl font-bold text-gray-800 border-b border-gray-200 pb-3">
                    <MapPin className="w-6 h-6 text-indigo-500" />
                    Location & Age
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <InputField
                      label="Latitude"
                      name="latitude"
                      min="-90"
                      max="90"
                      step="0.0001"
                      type="number"
                    />
                    <InputField
                      label="Longitude"
                      name="longitude"
                      min="-180"
                      max="180"
                      step="0.0001"
                      type="number"
                    />
                    <InputField
                      label="Built Year"
                      name="built_year"
                      min="1800"
                      max={new Date().getFullYear()}
                      step="1"
                      type="number"
                      icon={Calendar}
                    />
                    <InputField
                      label="Renovation Year (0 if never)"
                      name="renovation_year"
                      min="0"
                      max={new Date().getFullYear()}
                      step="1"
                      type="number"
                    />
                  </div>
                </div>

                {/* Additional Features */}
                <div className="space-y-6">
                  <h3 className="flex items-center gap-3 text-xl font-bold text-gray-800 border-b border-gray-200 pb-3">
                    <Star className="w-6 h-6 text-indigo-500" />
                    Additional Features
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <SelectField
                      label="Waterfront"
                      name="waterfront"
                      icon={Target}
                      options={[
                        { label: 'No', value: 0 },
                        { label: 'Yes', value: 1 },
                      ]}
                    />
                    <InputField
                      label="Views (0-5)"
                      name="views"
                      min="0"
                      max="5"
                      step="1"
                    />
                    <InputField
                      label="Condition (1-10)"
                      name="condition"
                      min="1"
                      max="10"
                      step="1"
                    />
                    <InputField
                      label="Grade (1-13)"
                      name="grade"
                      min="1"
                      max="13"
                      step="1"
                    />
                    <InputField
                      label="Schools Nearby"
                      name="schools_nearby"
                      min="0"
                      max="50"
                      step="1"
                    />
                    <InputField
                      label="Airport Distance"
                      name="airport_distance"
                      min="0"
                      max="500"
                      suffix="miles"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <button
                    disabled={loading}
                    onClick={handleSubmit}
                    className={`w-full py-4 px-6 text-white text-lg font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 ${
                      loading
                        ? 'bg-indigo-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        <span>Analyzing Property...</span>
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-5 w-5" />
                        <span>Predict Price</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Prediction & Metrics */}
          <div className="space-y-6">
            {/* Prediction Results */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-800 mb-6">
                <TrendingUp className="w-6 h-6 text-indigo-500" />
                Prediction Results
              </h2>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700 font-medium">Error</p>
                  </div>
                  <p className="text-red-600 mt-1">{error}</p>
                </div>
              )}

              {prediction ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                    <div className="text-center">
                      <p className="text-gray-700 text-lg mb-2">Estimated Price</p>
                      <p className="text-4xl font-bold text-green-700">
                        {formatCurrency(prediction.predicted_price)}
                      </p>
                    </div>
                  </div>
                  
                  {prediction.model_info && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Model:</strong> {prediction.model_info.model_type}</p>
                      <p><strong>Features Used:</strong> {prediction.model_info.features_used}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">
                    Fill out the form and click "Predict Price" to see the estimated value of your property.
                  </p>
                </div>
              )}
            </div>

            {/* Model Metrics */}
            {modelMetrics && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-700 mb-4">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  Model Performance
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">R² Score</span>
                    <span className="font-semibold text-gray-800">
                      {(modelMetrics.r2_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">MAE</span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(modelMetrics.mae)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">RMSE</span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(modelMetrics.rmse)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-blue-700 text-xs">
                      {mockMode 
                        ? "Demo mode: Using simulated predictions for demonstration purposes."
                        : "These metrics show how well our model performs on test data. Higher R² scores indicate better accuracy."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* API Status */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">System Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">API Connection</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    apiStatus 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {apiStatus ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Mode</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    mockMode 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {mockMode ? 'Demo' : 'Live'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HousePricePredictor;