import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, roc_auc_score

def train():
    # 1. Load synthetic data
    df = pd.read_csv('synthetic_sessions.csv')
    
    # 2. Extract feature vector and target
    features = [
        'tickets_requested', 
        'request_interval_ms', 
        'time_spent_seconds', 
        'failed_attempts', 
        'ip_request_frequency'
    ]
    X = df[features]
    y = df['is_scalper']

    # 3. Train/Test Split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 4. Standard Scaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 5. Train Random Forest Classifier
    model = RandomForestClassifier(
        n_estimators=100, 
        max_depth=6, 
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train_scaled, y_train)

    # 6. Evaluation
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]

    print("\n--- Model Evaluation ---")
    print(f"ROC-AUC Score: {roc_auc_score(y_test, y_prob):.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Genuine (0)', 'Scalper/Bot (1)']))

    # 7. Ensure target directory exists and save joblib artifacts
    target_dir = os.path.join('app', 'ml_models')
    os.makedirs(target_dir, exist_ok=True)

    model_path = os.path.join(target_dir, 'scalper_model.joblib')
    scaler_path = os.path.join(target_dir, 'scaler.joblib')

    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)

    print(f"Model saved to: {model_path}")
    print(f"Scaler saved to: {scaler_path}")
    print("--- Training Complete ---\n")

if __name__ == '__main__':
    train()