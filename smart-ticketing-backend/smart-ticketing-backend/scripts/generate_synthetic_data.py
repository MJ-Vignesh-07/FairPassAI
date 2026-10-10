import numpy as np
import pandas as pd

def generate_dataset(n_samples=6000):
    half = n_samples // 2

    # Genuine Users: longer dwell time, reasonable click gap, low IP frequency
    genuine = pd.DataFrame({
        'tickets_requested': np.random.choice([1, 2, 3, 4], size=half, p=[0.40, 0.35, 0.15, 0.10]),
        'request_interval_ms': np.random.normal(loc=3500, scale=800, size=half).clip(1200, 10000),
        'time_spent_seconds': np.random.normal(loc=45, scale=15, size=half).clip(15, 180),
        'failed_attempts': np.random.choice([0, 1, 2], size=half, p=[0.80, 0.15, 0.05]),
        'ip_request_frequency': np.random.poisson(lam=2, size=half).clip(1, 6),
        'is_scalper': 0
    })

    # Scalpers / Bots: rapid interaction (<1s), high ticket quantities, aggressive request frequency[cite: 1]
    scalpers = pd.DataFrame({
        'tickets_requested': np.random.choice([2, 4, 6, 8], size=half, p=[0.10, 0.30, 0.30, 0.30]),
        'request_interval_ms': np.random.normal(loc=350, scale=120, size=half).clip(50, 950),
        'time_spent_seconds': np.random.exponential(scale=3, size=half).clip(0.2, 10),
        'failed_attempts': np.random.poisson(lam=3, size=half),
        'ip_request_frequency': np.random.normal(loc=25, scale=8, size=half).clip(8, 60),
        'is_scalper': 1
    })

    # Combine and shuffle
    df = pd.concat([genuine, scalpers]).sample(frac=1, random_state=42).reset_index(drop=True)
    df.to_csv('synthetic_sessions.csv', index=False)
    print(f"Success: 'synthetic_sessions.csv' created with {len(df)} rows.")

if __name__ == '__main__':
    generate_dataset()