// backend/routes/iot.js — IoT sensor data endpoints
// In production: replace simulateSensorReading() with real sensor API calls
// Compatible with: Raspberry Pi MQTT, AWS IoT Core, Azure IoT Hub

const express = require('express');
const { db } = require('../config/firebase');
const { verifyToken, requireRole } = require('../middleware/auth');
const { sendSecurityAlert } = require('../services/securityService');
const { sendSMS } = require('../services/smsService');
const logger = require('../config/logger');

const router = express.Router();

// ── Sensor definitions ─────────────────────────────────────
// In production these come from your IoT device registry
const SENSOR_REGISTRY = [
  // Water pressure sensors
  { id: 'wp-bole-01', type: 'water_pressure', name: 'Bole Main Pipeline', area: 'Bole', lat: 9.0054, lng: 38.7795, unit: 'bar', normalRange: [2.0, 4.5], criticalBelow: 1.0, criticalAbove: 6.0 },
  { id: 'wp-kirkos-01', type: 'water_pressure', name: 'Kirkos Distribution', area: 'Kirkos', lat: 9.022, lng: 38.769, unit: 'bar', normalRange: [2.2, 4.2], criticalBelow: 1.0, criticalAbove: 6.0 },
  { id: 'wp-lideta-01', type: 'water_pressure', name: 'Lideta Pumping Station', area: 'Lideta', lat: 9.0145, lng: 38.738, unit: 'bar', normalRange: [2.5, 4.8], criticalBelow: 1.2, criticalAbove: 6.5 },

  // Air quality sensors
  { id: 'aq-megenagna-01', type: 'air_quality', name: 'Megenagna Junction', area: 'Yeka', lat: 9.0248, lng: 38.803, unit: 'AQI', normalRange: [0, 100], criticalBelow: null, criticalAbove: 150 },
  { id: 'aq-mexico-01', type: 'air_quality', name: 'Mexico Square', area: 'Kirkos', lat: 9.022, lng: 38.750, unit: 'AQI', normalRange: [0, 100], criticalBelow: null, criticalAbove: 150 },
  { id: 'aq-bole-01', type: 'air_quality', name: 'Bole International Airport', area: 'Bole', lat: 8.977, lng: 38.799, unit: 'AQI', normalRange: [0, 80], criticalBelow: null, criticalAbove: 120 },

  // Traffic flow sensors
  { id: 'tf-ringroad-01', type: 'traffic', name: 'Ring Road East', area: 'Bole', lat: 9.006, lng: 38.815, unit: 'vehicles/hr', normalRange: [200, 800], criticalBelow: null, criticalAbove: 1200 },
  { id: 'tf-megenagna-01', type: 'traffic', name: 'Megenagna Interchange', area: 'Yeka', lat: 9.024, lng: 38.803, unit: 'vehicles/hr', normalRange: [300, 900], criticalBelow: null, criticalAbove: 1400 },

  // Power grid sensors
  { id: 'pg-bole-01', type: 'power', name: 'Bole Substation', area: 'Bole', lat: 9.010, lng: 38.790, unit: 'V', normalRange: [215, 235], criticalBelow: 200, criticalAbove: 250 },
  { id: 'pg-kirkos-01', type: 'power', name: 'Kirkos Grid Station', area: 'Kirkos', lat: 9.025, lng: 38.765, unit: 'V', normalRange: [218, 232], criticalBelow: 200, criticalAbove: 250 },
];

// ── Simulate a sensor reading ──────────────────────────────
// Replace this with your real MQTT/HTTP sensor client
function simulateSensorReading(sensor) {
  const [low, high] = sensor.normalRange;
  const range = high - low;

  // 85% chance normal, 10% warning, 5% critical
  const rand = Math.random();
  let value, status;

  if (rand < 0.85) {
    value = low + Math.random() * range;
    status = 'online';
  } else if (rand < 0.95) {
    // Warning: slightly out of normal range
    value = rand < 0.90
      ? low - Math.random() * (range * 0.3)
      : high + Math.random() * (range * 0.3);
    status = 'warning';
  } else {
    // Critical: significantly out of range
    if (sensor.criticalBelow !== null) {
      value = sensor.criticalBelow - Math.random() * 0.5;
    } else {
      value = (sensor.criticalAbove || high * 1.5) + Math.random() * (range * 0.2);
    }
    status = 'critical';
  }

  return {
    sensorId: sensor.id,
    type: sensor.type,
    name: sensor.name,
    area: sensor.area,
    lat: sensor.lat,
    lng: sensor.lng,
    value: parseFloat(value.toFixed(2)),
    unit: sensor.unit,
    status,
    normalRange: sensor.normalRange,
    timestamp: new Date().toISOString(),
  };
}

// ── GET /api/iot/sensors — all sensor readings ─────────────
router.get('/sensors', verifyToken, async (req, res, next) => {
  try {
    const readings = SENSOR_REGISTRY.map(simulateSensorReading);

    // Alert on critical readings
    const criticals = readings.filter(r => r.status === 'critical');
    for (const c of criticals) {
      logger.warn(`Critical sensor reading: ${c.sensorId} = ${c.value} ${c.unit}`);

      // Persist critical event
      await db.collection('iot_alerts').add({
        ...c,
        resolved: false,
        createdAt: new Date().toISOString(),
      }).catch(e => logger.error('IoT alert persist failed:', e));

      // Alert admin via SMS for critical infrastructure
      if (['water_pressure', 'power'].includes(c.type)) {
        await sendSMS(
          process.env.ADMIN_PHONE,
          `[CitiConnect IoT] CRITICAL: ${c.name} reading ${c.value} ${c.unit} — out of safe range.`
        ).catch(e => logger.error('IoT SMS failed:', e));
      }
    }

    res.json({ sensors: readings, summary: buildSummary(readings), timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/iot/sensors/:id/history — historical data ────
router.get('/sensors/:id/history', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hours = 24 } = req.query;
    const sensor = SENSOR_REGISTRY.find(s => s.id === id);
    if (!sensor) return res.status(404).json({ error: 'Sensor not found' });

    // Simulate historical readings (replace with time-series DB in production)
    const pointCount = Math.min(parseInt(hours) * 4, 96); // 15-min intervals
    const history = [];
    const now = Date.now();

    for (let i = pointCount; i >= 0; i--) {
      const reading = simulateSensorReading(sensor);
      history.push({
        ...reading,
        timestamp: new Date(now - i * 15 * 60 * 1000).toISOString(),
      });
    }

    res.json({ sensorId: id, history });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/iot/alerts — unresolved critical alerts ───────
router.get('/alerts', verifyToken, requireRole('admin', 'authority'), async (req, res, next) => {
  try {
    const snap = await db.collection('iot_alerts')
      .where('resolved', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/iot/alerts/:id/resolve ─────────────────────
router.patch('/alerts/:id/resolve', verifyToken, requireRole('admin', 'authority'), async (req, res, next) => {
  try {
    await db.collection('iot_alerts').doc(req.params.id).update({
      resolved: true,
      resolvedBy: req.user.uid,
      resolvedAt: new Date().toISOString(),
    });
    res.json({ resolved: true });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/iot/ingest — receive data from real devices ──
// This endpoint receives MQTT-bridged HTTP POSTs from real IoT devices
router.post('/ingest', async (req, res, next) => {
  // Verify device token (separate from user auth)
  const deviceToken = req.headers['x-device-token'];
  if (deviceToken !== process.env.IOT_DEVICE_SECRET) {
    logger.warn(`Unauthorized IoT ingest attempt from ${req.ip}`);
    return res.status(401).json({ error: 'Invalid device token' });
  }

  try {
    const { sensorId, value, timestamp } = req.body;
    const sensor = SENSOR_REGISTRY.find(s => s.id === sensorId);
    if (!sensor) return res.status(400).json({ error: 'Unknown sensor' });

    const [low, high] = sensor.normalRange;
    const status = value < (sensor.criticalBelow || -Infinity) || value > (sensor.criticalAbove || Infinity)
      ? 'critical'
      : (value < low || value > high) ? 'warning' : 'online';

    await db.collection('iot_readings').add({ sensorId, value, status, timestamp, receivedAt: new Date().toISOString() });

    // Real-time broadcast via Socket.io
    req.app.get('io')?.emit('sensor_update', { sensorId, value, status, timestamp });

    res.json({ received: true, status });
  } catch (err) {
    next(err);
  }
});

function buildSummary(readings) {
  return {
    total: readings.length,
    online: readings.filter(r => r.status === 'online').length,
    warning: readings.filter(r => r.status === 'warning').length,
    critical: readings.filter(r => r.status === 'critical').length,
    byType: {
      water_pressure: readings.filter(r => r.type === 'water_pressure'),
      air_quality: readings.filter(r => r.type === 'air_quality'),
      traffic: readings.filter(r => r.type === 'traffic'),
      power: readings.filter(r => r.type === 'power'),
    },
  };
}

module.exports = router;
