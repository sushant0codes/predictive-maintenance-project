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
    anomaly_rows = results[results['anomaly'] == 1]
    # Threshold computed only among anomaly rows:
    # bottom 45% of anomaly scores → CRITICAL, top 55% → WARNING
    critical_threshold = anomaly_rows['anomaly_score'].quantile(0.45) if len(anomaly_rows) > 0 else -0.05

    # Detailed action plans keyed by issue type
    ISSUE_DETAIL = {
        "overheat": {
            "label_prefix": "High Temperature",
            "description": "Motor temperature has exceeded the safe operating threshold (80°C). Sustained overheating degrades winding insulation and can cause irreversible motor damage or fire risk.",
            "cause": "Possible causes: blocked ventilation, failed cooling fan, lubricant breakdown, or excessive ambient temperature.",
            "actions": [
                "Immediately reduce motor load by 20–30% if possible.",
                "Inspect and clear all ventilation ducts and cooling fins.",
                "Verify cooling fan is operational — check for belt wear or fan blade damage.",
                "Check and replenish lubricant levels on bearings.",
                "Measure ambient temperature in the equipment room; improve ventilation if above 40°C.",
                "Allow motor to cool down before restarting under full load.",
                "Schedule a thermal imaging inspection within 24 hours."
            ]
        },
        "vibration": {
            "label_prefix": "High Vibration",
            "description": "Vibration levels have exceeded the safe limit (1.0 mm/s RMS). Excessive vibration accelerates bearing wear and can cause shaft misalignment or structural fatigue.",
            "cause": "Possible causes: worn or failed bearings, shaft misalignment, rotor imbalance, or loose mounting bolts.",
            "actions": [
                "Stop the motor if vibration exceeds 2.0 mm/s to prevent catastrophic failure.",
                "Perform a visual inspection for loose mounting hardware and tighten all fasteners.",
                "Check shaft coupling alignment using a dial indicator or laser alignment tool.",
                "Inspect bearings for wear, pitting, or noise — replace if necessary.",
                "Verify rotor balance; schedule dynamic balancing if imbalance is detected.",
                "Lubricate bearings as per maintenance schedule.",
                "Re-run vibration analysis after corrections to confirm resolution."
            ]
        },
        "current_spike": {
            "label_prefix": "High Current",
            "description": "Motor current draw has spiked above the rated threshold (12A). Overcurrent conditions can trip protection relays, overheat windings, and indicate a mechanical or electrical fault.",
            "cause": "Possible causes: mechanical overload, phase imbalance, failing capacitor, partial winding short, or driven equipment jam.",
            "actions": [
                "Check for mechanical jamming or excessive load on the driven equipment.",
                "Measure and compare current on all three phases — imbalance >5% indicates an electrical fault.",
                "Inspect motor capacitors (for single-phase motors) and replace if capacitance is out of spec.",
                "Check supply voltage levels; undervoltage causes motors to draw excess current.",
                "Test motor winding insulation resistance with a megohmmeter (target >1 MΩ).",
                "Verify that the overload relay is set correctly for the motor's FLA rating.",
                "Reduce connected load and retest; if current normalizes, inspect the driven equipment."
            ]
        },
        "combined": {
            "label_prefix": "Combined Anomaly",
            "description": "The Isolation Forest model has detected a statistically significant multi-parameter anomaly that does not clearly map to a single failure mode. The combination of sensor readings deviates from normal operating patterns.",
            "cause": "Possible causes: early-stage compound failure, sensor drift, intermittent electrical fault, or unusual operating conditions.",
            "actions": [
                "Flag this asset for priority inspection by the maintenance team.",
                "Review the full sensor log for this time period to identify any correlated trends.",
                "Perform a comprehensive visual and acoustic inspection of the motor and driven equipment.",
                "Verify all sensor calibrations — replace any sensor showing erratic readings.",
                "Check power quality: look for voltage transients, harmonic distortion, or power interruptions.",
                "Cross-reference with maintenance logbook for recent repairs or environmental changes.",
                "Escalate to engineering team if the anomaly persists across multiple analysis runs."
            ]
        }
    }

    for _, row in results[results['anomaly'] == 1].iterrows():
        issue_details = []

        if row['temperature'] > 80:
            d = ISSUE_DETAIL["overheat"]
            issue_details.append({
                "type": "overheat",
                "label": f"{d['label_prefix']} ({row['temperature']:.1f}°C)",
                "description": d["description"],
                "cause": d["cause"],
                "actions": d["actions"]
            })
        if row['vibration'] > 1.0:
            d = ISSUE_DETAIL["vibration"]
            issue_details.append({
                "type": "vibration",
                "label": f"{d['label_prefix']} ({row['vibration']:.2f} mm/s)",
                "description": d["description"],
                "cause": d["cause"],
                "actions": d["actions"]
            })
        if row['current'] > 12:
            d = ISSUE_DETAIL["current_spike"]
            issue_details.append({
                "type": "current_spike",
                "label": f"{d['label_prefix']} ({row['current']:.1f}A)",
                "description": d["description"],
                "cause": d["cause"],
                "actions": d["actions"]
            })
        if not issue_details:
            d = ISSUE_DETAIL["combined"]
            issue_details.append({
                "type": "combined",
                "label": d["label_prefix"],
                "description": d["description"],
                "cause": d["cause"],
                "actions": d["actions"]
            })

        severity = "CRITICAL" if row["anomaly_score"] <= critical_threshold else "WARNING"

        # Legacy flat fields kept for backwards compatibility
        issues = [i["label"] for i in issue_details]
        recs   = [i["actions"][0] for i in issue_details]

        alerts.append({
            "timestamp": row["timestamp"].isoformat(),
            "anomaly_score": float(row["anomaly_score"]),
            "issues": issues,
            "recommendations": recs,
            "issue_details": issue_details,   # rich structured data
            "severity": severity
        })

    stats = {
        "total_readings": int(len(results)),
        "anomaly_count": int(results['anomaly'].sum()),
        "critical_count": int((anomaly_rows['anomaly_score'] <= critical_threshold).sum())
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
    import os
    if os.environ.get("RENDER"):  # Detect if running on Render
        from waitress import serve
        print("[PROD] Running with Waitress (production mode)")
        serve(app, host="0.0.0.0", port=5000)
    else:
        print("[DEV] Running Flask dev server (debug mode)")
        app.run(port=5000, host="0.0.0.0", debug=True)
