import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import numpy as np
import json
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

def load_and_preprocess_data(csv_path="Housing.csv"):
    """Load and preprocess the housing dataset"""
    print("📊 Loading dataset...")
    df = pd.read_csv(csv_path)
    print(f"Dataset shape: {df.shape}")
    print(f"Missing values: {df.isnull().sum().sum()}")
    
    # Display basic info about the dataset
    print("\nDataset Info:")
    print(df.info())
    print("\nFirst few rows:")
    print(df.head())
    
    # Drop missing values
    initial_rows = len(df)
    df.dropna(inplace=True)
    print(f"Rows after dropping NaN: {len(df)} (dropped {initial_rows - len(df)} rows)")
    
    return df

def create_features(df):
    """Create and engineer features"""
    print("🔧 Engineering features...")
    
    # Rename columns to match your dataset
    column_mapping = {
        'number of bedrooms': 'bedrooms',
        'number of bathrooms': 'bathrooms', 
        'living area': 'living_area',
        'lot area': 'lot_area',
        'number of floors': 'floors',
        'waterfront present': 'waterfront',
        'number of views': 'views',
        'condition of the house': 'condition',
        'grade of the house': 'grade',
        'Area of the house(excluding basement)': 'house_area',
        'Area of the basement': 'basement_area',
        'Built Year': 'built_year',
        'Renovation Year': 'renovation_year',
        'Postal Code': 'postal_code',
        'Lattitude': 'latitude',
        'Longitude': 'longitude',
        'living_area_renov': 'living_area_renovated',
        'lot_area_renov': 'lot_area_renovated',
        'Number of schools nearby': 'schools_nearby',
        'Distance from the airport': 'airport_distance',
        'Price': 'price'
    }
    
    # Rename columns
    df = df.rename(columns=column_mapping)
    
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
    df['price_per_sqft'] = df['price'] / (df['living_area'] + 1)
    
    # Categorical binning
    df['condition_category'] = pd.cut(df['condition'], bins=3, labels=['Poor', 'Average', 'Good'])
    df['grade_category'] = pd.cut(df['grade'], bins=3, labels=['Low', 'Medium', 'High'])
    df['views_category'] = pd.cut(df['views'], bins=3, labels=['None', 'Some', 'Excellent'])
    
    # Convert categorical variables to dummy variables
    categorical_columns = ['condition_category', 'grade_category', 'views_category']
    df_encoded = pd.get_dummies(df, columns=categorical_columns, drop_first=True)
    
    # Select features for model
    feature_columns = [
        'bedrooms', 'bathrooms', 'living_area', 'lot_area', 'floors', 
        'waterfront', 'views', 'condition', 'grade', 'house_area', 
        'basement_area', 'age', 'years_since_renovation', 'latitude', 
        'longitude', 'living_area_renovated', 'lot_area_renovated', 
        'schools_nearby', 'airport_distance', 'has_basement', 'is_renovated',
        'has_waterfront', 'living_to_lot_ratio', 'basement_to_house_ratio'
    ]
    
    # Add dummy variables
    dummy_columns = [col for col in df_encoded.columns if any(cat in col for cat in categorical_columns)]
    feature_columns.extend(dummy_columns)
    
    # Filter to existing columns
    available_features = [col for col in feature_columns if col in df_encoded.columns]
    
    print(f"Selected features: {available_features}")
    
    return df_encoded, available_features

def train_model(X_train, y_train):
    """Train the model with hyperparameter tuning"""
    print("🤖 Training model with hyperparameter tuning...")
    
    # Enhanced hyperparameter grid
    param_dist = {
        'n_estimators': [100, 200, 300, 500],
        'max_depth': [None, 10, 20, 30, 50],
        'min_samples_split': [2, 5, 10, 15],
        'min_samples_leaf': [1, 2, 4, 8],
        'max_features': ['auto', 'sqrt', 'log2', 0.8],
        'bootstrap': [True, False],
        'max_samples': [0.8, 0.9, 1.0]
    }
    
    # Initialize RandomForestRegressor
    rf = RandomForestRegressor(random_state=42, n_jobs=-1)
    
    # Setup RandomizedSearchCV
    random_search = RandomizedSearchCV(
        estimator=rf,
        param_distributions=param_dist,
        n_iter=50,
        cv=5,
        verbose=1,
        random_state=42,
        n_jobs=-1,
        scoring='r2'
    )
    
    # Fit RandomizedSearchCV
    print("Starting hyperparameter search...")
    random_search.fit(X_train, y_train)
    
    print(f"✅ Best Parameters: {random_search.best_params_}")
    print(f"✅ Best CV Score: {random_search.best_score_:.4f}")
    
    return random_search.best_estimator_

def evaluate_model(model, X_test, y_test):
    """Evaluate the trained model"""
    print("📈 Evaluating model...")
    
    # Make predictions
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    metrics = {
        "r2_score": r2_score(y_test, y_pred),
        "mae": mean_absolute_error(y_test, y_pred),
        "rmse": np.sqrt(mean_squared_error(y_test, y_pred)),
        "mape": np.mean(np.abs((y_test - y_pred) / y_test)) * 100
    }
    
    print(f"📊 Model Performance:")
    print(f"   R² Score: {metrics['r2_score']:.4f}")
    print(f"   MAE: ${metrics['mae']:,.2f}")
    print(f"   RMSE: ${metrics['rmse']:,.2f}")
    print(f"   MAPE: {metrics['mape']:.2f}%")
    
    return metrics, y_pred

def plot_feature_importance(model, feature_names, save_plots=True):
    """Plot feature importance"""
    if save_plots:
        importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        plt.figure(figsize=(12, 8))
        sns.barplot(data=importance_df.head(15), x='importance', y='feature')
        plt.title('Top 15 Feature Importance')
        plt.xlabel('Importance')
        plt.tight_layout()
        plt.savefig('feature_importance.png', dpi=300, bbox_inches='tight')
        plt.show()
        print("📊 Feature importance plot saved as 'feature_importance.png'")

def plot_results(y_true, y_pred, save_plots=True):
    """Create visualization plots"""
    if save_plots:
        plt.figure(figsize=(15, 5))
        
        # Actual vs Predicted
        plt.subplot(1, 3, 1)
        plt.scatter(y_true, y_pred, alpha=0.6)
        plt.plot([y_true.min(), y_true.max()], [y_true.min(), y_true.max()], 'r--', lw=2)
        plt.xlabel('Actual Price ($)')
        plt.ylabel('Predicted Price ($)')
        plt.title('Actual vs Predicted Prices')
        
        # Residuals
        plt.subplot(1, 3, 2)
        residuals = y_true - y_pred
        plt.scatter(y_pred, residuals, alpha=0.6)
        plt.axhline(y=0, color='r', linestyle='--')
        plt.xlabel('Predicted Price ($)')
        plt.ylabel('Residuals')
        plt.title('Residual Plot')
        
        # Distribution of residuals
        plt.subplot(1, 3, 3)
        plt.hist(residuals, bins=30, alpha=0.7)
        plt.xlabel('Residuals')
        plt.ylabel('Frequency')
        plt.title('Distribution of Residuals')
        
        plt.tight_layout()
        plt.savefig('model_evaluation.png', dpi=300, bbox_inches='tight')
        plt.show()
        print("📊 Evaluation plots saved as 'model_evaluation.png'")

def save_assets(model, feature_names, scaler, metrics):
    """Save model, feature names, scaler, and metrics"""
    print("💾 Saving model assets...")
    
    # Save model and preprocessing objects
    joblib.dump(model, "house_price_model.pkl")
    joblib.dump(scaler, "feature_scaler.pkl")
    
    # Save feature names and preprocessing info
    preprocessing_info = {
        'feature_names': feature_names,
        'model_type': 'RandomForestRegressor'
    }
    joblib.dump(preprocessing_info, "preprocessing_info.pkl")
    
    # Add timestamp to metrics
    metrics["trained_at"] = datetime.now().isoformat()
    metrics["model_type"] = "RandomForestRegressor"
    metrics["feature_count"] = len(feature_names)
    
    # Save metrics
    with open("metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
    
    print("✅ Assets saved successfully!")
    print("   - house_price_model.pkl")
    print("   - feature_scaler.pkl")
    print("   - preprocessing_info.pkl") 
    print("   - metrics.json")

def main():
    """Main training pipeline"""
    print("🏠 House Price Prediction Model Training")
    print("=" * 50)
    
    try:
        # Load and preprocess data
        df = load_and_preprocess_data()
        
        # Create features
        df_processed, feature_columns = create_features(df)
        
        # Prepare data
        X = df_processed[feature_columns]
        y = df_processed['price']
        
        print(f"Feature matrix shape: {X.shape}")
        print(f"Target statistics:")
        print(f"   Mean price: ${y.mean():,.2f}")
        print(f"   Median price: ${y.median():,.2f}")
        print(f"   Price range: ${y.min():,.2f} - ${y.max():,.2f}")
        
        # Scale features (optional, RandomForest doesn't require it but can help)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        X_scaled = pd.DataFrame(X_scaled, columns=feature_columns, index=X.index)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )
        
        print(f"Training set size: {X_train.shape[0]}")
        print(f"Test set size: {X_test.shape[0]}")
        
        # Train model
        best_model = train_model(X_train, y_train)
        
        # Evaluate model
        metrics, y_pred = evaluate_model(best_model, X_test, y_test)
        
        # Create plots
        plot_results(y_test, y_pred, save_plots=True)
        plot_feature_importance(best_model, feature_columns, save_plots=True)
        
        # Save everything
        save_assets(best_model, feature_columns, scaler, metrics)
        
        print("\n🎉 Training completed successfully!")
        print(f"Final R² Score: {metrics['r2_score']:.4f}")
        
    except Exception as e:
        print(f"❌ Error during training: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

if __name__ == "__main__":
    main()