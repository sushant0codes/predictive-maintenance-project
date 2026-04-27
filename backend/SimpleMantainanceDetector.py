import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from datetime import datetime, timedelta
import warnings

warnings.filterwarnings('ignore')
np.random.seed(10)

class SimpleMaintenanceDetector:
    def __init__(self, contamination=0.05, n_estimators=100, random_state=42):
        self.model = IsolationForest(
            contamination=contamination,
            random_state=random_state,
            n_estimators=n_estimators
        )

    def create_sensor_data(self, days=30):
        hours = days * 24
        timestamps = [datetime.now() - timedelta(hours=hours - i) for i in range(hours)]
        t = np.arange(hours)

        temperature = 65 + 10 * np.sin(t / 12) + np.random.normal(0, 2, hours)
        vibration   = 0.5 + 0.1 * np.cos(t / 24) + np.random.normal(0, 0.05, hours)
        current     = 8 + 2 * np.sin(t / 8) + np.random.normal(0, 0.3, hours)

        anomaly_times = np.random.choice(hours, size=int(hours * 0.03), replace=False)
        for idx in anomaly_times:
            issue_type = np.random.choice(['overheat', 'vibration', 'current_spike'])
            if issue_type == 'overheat':
                span = min(3, hours - idx)
                temperature[idx:idx+span] += np.random.uniform(15, 25)
            elif issue_type == 'vibration':
                span = min(2, hours - idx)
                vibration[idx:idx+span] += np.random.uniform(0.8, 1.2)
            else:
                current[idx] += np.random.uniform(5, 8)

        return pd.DataFrame({
            'timestamp': timestamps,
            'temperature': temperature,
            'vibration': vibration,
            'current': current
        })

    def detect_anomalies(self, data):
        X = data[['temperature', 'vibration', 'current']].values
        self.model.fit(X)
        preds  = self.model.predict(X)         # -1 anomaly, 1 normal
        scores = self.model.decision_function(X)

        data = data.copy()
        data['anomaly'] = (preds == -1).astype(int)
        data['anomaly_score'] = scores
        return data
