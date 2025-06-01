from flask import Flask, request, jsonify
import joblib
import pandas as pd
import numpy as np
import json
from flask_cors import CORS
import logging
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load model and preprocessing assets
try:
    model = joblib.load("house_price_model.pkl")
    scaler = joblib.load("feature_scaler.pkl")
    preprocessing_info = joblib.load("preprocessing_info.pkl")
    feature_names = preprocessing_info['feature_names']
    
    # Load model performance metrics
    with open("metrics.json", "r") as f:
        metrics = json.load(f)
    
    logger.info("Model and assets loaded successfully")
    logger.info(f"Model expects {len(feature_names)} features")
except Exception as e:
    logger.error(f"Error loading model assets: {e}")
    raise

def create_features_from_input(data):
    """Create engineered features from input data"""
    # Create a DataFrame from input
    df = pd.DataFrame([data])
    
    # Ensure numeric conversion
    numeric_fields = [
        'bedrooms', 'bathrooms', 'living_area', 'lot_area', 'floors',
        'waterfront', 'views', 'condition', 'grade', 'house_area',
        'basement_area', 'built_year', 'renovation_year', 'latitude',
        'longitude', 'living_area_renovated', 'lot_area_renovated',
        'schools_nearby', 'airport_distance'
    ]
    
    for field in numeric_fields:
        if field in df.columns:
            df[field] = pd.to_numeric(df[field], errors='coerce')
    
    # Create age feature
    current_year = datetime.now().year
    df['age'] = current_year - df['built_year']
    df['years_since_renovation'] = np.where(
        df['renovation_year'] > 0, 
        current_year - df['renovation_year'], 
        df['age']
    )
    
    # Binary features
    df['has_basement'] = (df['basement_area'] > 0).astype(int)
    df['is_renovated'] = (df['renovation_year'] > 0).astype(int)
    df['has_waterfront'] = df['waterfront'].astype(int)
    
    # Ratio features
    df['living_to_lot_ratio'] = df['living_area'] / (df['lot_area'] + 1)
    df['basement_to_house_ratio'] = df['basement_area'] / (df['house_area'] + 1)
    
    # Categorical binning and encoding
    df['condition_category'] = pd.cut(df['condition'], bins=3, labels=['Poor', 'Average', 'Good'])
    df['grade_category'] = pd.cut(df['grade'], bins=3, labels=['Low', 'Medium', 'High'])
    df['views_category'] = pd.cut(df['views'], bins=3, labels=['None', 'Some', 'Excellent'])
    
    # Convert categorical variables to dummy variables
    df_encoded = pd.get_dummies(df, columns=['condition_category', 'grade_category', 'views_category'], drop_first=True)
    
    # Ensure all required features are present
    for feature in feature_names:
        if feature not in df_encoded.columns:
            df_encoded[feature] = 0
    
    # Select only the features used in training
    X = df_encoded[feature_names]
    
    return X

@app.route("/", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "House Price Prediction API is running",
        "model_info": {
            "type": preprocessing_info.get('model_type', 'RandomForestRegressor'),
            "features": len(feature_names),
            "trained_at": metrics.get('trained_at', 'Unknown')
        },
        "model_metrics": {
            "r2_score": round(metrics["r2_score"], 4),
            "mae": round(metrics["mae"], 2),
            "rmse": round(metrics["rmse"], 2)
        }
    })

@app.route("/features", methods=["GET"])
def get_features():
    """Get list of features used by the model"""
    return jsonify({
        "features": feature_names,
        "feature_count": len(feature_names)
    })

@app.route("/predict", methods=["POST"])
def predict():
    """Predict house price based on input features"""
    try:
        # Get and validate input data
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Required input fields
        required_fields = [
            'bedrooms', 'bathrooms', 'living_area', 'lot_area', 'floors',
            'waterfront', 'views', 'condition', 'grade', 'house_area',
            'basement_area', 'built_year', 'renovation_year', 'latitude',
            'longitude', 'living_area_renovated', 'lot_area_renovated',
            'schools_nearby', 'airport_distance'
        ]
        
        # Check for missing fields
        missing_fields = [field for field in required_fields if field not in data or data[field] == '']
        if missing_fields:
            return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400
        
        # Validate numeric ranges
        validations = {
            'bedrooms': (0, 20),
            'bathrooms': (0, 20),
            'living_area': (100, 50000),
            'lot_area': (100, 1000000),
            'floors': (1, 10),
            'waterfront': (0, 1),
            'views': (0, 10),
            'condition': (1, 10),
            'grade': (1, 15),
            'house_area': (100, 50000),
            'basement_area': (0, 10000),
            'built_year': (1800, 2024),
            'renovation_year': (0, 2024),
            'schools_nearby': (0, 50),
            'airport_distance': (0, 500)
        }
        
        for field, (min_val, max_val) in validations.items():
            try:
                value = float(data[field])
                if not (min_val <= value <= max_val):
                    return jsonify({"error": f"{field} must be between {min_val} and {max_val}"}), 400
            except (ValueError, TypeError):
                return jsonify({"error": f"Invalid {field} value. Must be a number."}), 400
        
        # Create features
        X = create_features_from_input(data)
        
        # Scale features
        X_scaled = scaler.transform(X)
        
        # Make prediction
        prediction = model.predict(X_scaled)[0]
        
        # Ensure prediction is reasonable
        if prediction < 0:
            prediction = 0
        
        logger.info(f"Prediction made: ${prediction:,.2f}")
        
        return jsonify({
            "predicted_price": float(prediction),
            "metrics": {
                "r2_score": round(metrics["r2_score"], 4),
                "mae": round(metrics["mae"], 2),
                "rmse": round(metrics["rmse"], 2),
                "mape": round(metrics.get("mape", 0), 2)
            },
            "model_info": {
                "features_used": len(feature_names),
                "model_type": preprocessing_info.get('model_type', 'RandomForestRegressor')
            },
            "status": "success"
        })
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    print("🚀 Starting House Price Prediction API...")
    print(f"Model loaded with {len(feature_names)} features")
    print(f"Model R² Score: {metrics['r2_score']:.4f}")
    app.run(debug=True, host='0.0.0.0', port=5000)