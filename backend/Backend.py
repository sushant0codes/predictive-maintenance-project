from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from io import StringIO
from datetime import datetime
from SimpleMantainanceDetector import SimpleMaintenanceDetector

app = Flask(__name__)
CORS(app)

detector = SimpleMaintenanceDetector()
cached_results = None

@app.route('/api/health')
def health():
    return jsonify({"status": "ok"}), 200

@app.route('/api/analyze', methods=['POST'])
def analyze():
    global cached_results
    days = int(request.get_json().get("days", 30))

    df = detector.create_sensor_data(days)
    results = detector.detect_anomalies(df)
    cached_results = results

    alerts = []
    critical_threshold = results['anomaly_score'].quantile(0.1)

    for _, row in results[results['anomaly'] == 1].iterrows():
        issues, recs = [], []
        if row['temperature'] > 80:
            issues.append(f"High Temperature ({row['temperature']:.1f}°C)")
            recs.append("Check cooling system")
        if row['vibration'] > 1.0:
            issues.append(f"High Vibration ({row['vibration']:.2f} mm/s)")
            recs.append("Inspect bearings")
        if row['current'] > 12:
            issues.append(f"High Current ({row['current']:.1f}A)")
            recs.append("Investigate load imbalance")
        if not issues:
            issues.append("Combined Anomaly Detected")
            recs.append("General inspection required")

        severity = "CRITICAL" if row["anomaly_score"] <= critical_threshold else "WARNING"
        alerts.append({
            "timestamp": row["timestamp"].isoformat(),
            "anomaly_score": float(row["anomaly_score"]),
            "issues": issues,
            "recommendations": recs,
            "severity": severity
        })

    stats = {
        "total_readings": int(len(results)),
        "anomaly_count": int(results['anomaly'].sum()),
        "critical_count": int((results['anomaly_score'] <= critical_threshold).sum())
    }

    return jsonify({
        "success": True,
        "data": results.to_dict(orient="records"),
        "alerts": alerts,
        "stats": stats
    })

from io import BytesIO

@app.route('/api/export', methods=['POST'])
def export_csv():
    global cached_results
    if cached_results is None:
        return jsonify({"success": False, "error": "No data to export"}), 400

    # Convert DataFrame to CSV (encoded in bytes)
    csv_bytes = cached_results.to_csv(index=False).encode('utf-8')
    buffer = BytesIO(csv_bytes)

    filename = f"maintenance_{datetime.now().date()}.csv"

    return send_file(
        buffer,
        mimetype='text/csv',
        as_attachment=True,
        download_name=filename
    )


if __name__ == "__main__":
    app.run(port=5000, host="0.0.0.0", debug=True)

if __name__ == "__main__":
    from waitress import serve
    serve(app, host="0.0.0.0", port=5000)
