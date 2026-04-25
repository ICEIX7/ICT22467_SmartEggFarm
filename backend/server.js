const admin = require('firebase-admin');
const mqtt = require('mqtt');
const express = require('express'); 
const cors = require('cors');    
const serviceAccount = require("./serviceAccountKey.json");
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// 🟢 แก้ไข: เชื่อมต่อ MQTT Broker ในตัว Raspberry Pi เอง (Local)
const mqttClient = mqtt.connect('mqtt://172.20.10.2:1883');

mqttClient.on('connect', () => {
    console.log('🚀 MQTT Bridge online (Connected to local Pi Broker)');
    mqttClient.subscribe('spu/smartfarm/sensor');
});

mqttClient.on('message', async (topic, message) => {
    if (topic === 'spu/smartfarm/sensor') {
        try {
            const data = JSON.parse(message.toString());
            const newGoodEggs = Math.floor(Math.random() * 16); 
            const newDamagedEggs = Math.floor(Math.random() * 4); 
            const now = new Date();
            const today = now.toISOString().split('T')[0];

            const batch = db.batch();

            // 1. อัปเดตค่าล่าสุด (สำหรับตัวเลข Dashboard)
            const latestRef = db.collection('sensor_data').doc('latest');
            const sensorPayload = {
                temperature: parseFloat(data.temperature) || 0,
                humidity: parseFloat(data.humidity) || 0,
                light_intensity: parseFloat(data.light_intensity) || 0,
                ammonia_level: parseFloat(data.ammonia_level) || 0,
                water_level: parseFloat(data.water_level) || 0,
                food_raw: parseInt(data.food_raw) || 0,
                green_led: parseInt(data.green_led) || 0,   
                yellow_led: parseInt(data.yellow_led) || 0, 
                eggs_collected: admin.firestore.FieldValue.increment(newGoodEggs + newDamagedEggs),
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            };
            batch.set(latestRef, sensorPayload, { merge: true });

            // 🟢 2. เพิ่ม: บันทึกข้อมูลประวัติ (สำหรับวาดกราฟเส้น)
            // เราจะใช้การ .add() เพื่อสร้างเอกสารใหม่ไปเรื่อยๆ ใน collection นี้
            const historyRef = db.collection('sensor_history').doc();
            batch.set(historyRef, {
                ...sensorPayload,
                eggs_collected: newGoodEggs + newDamagedEggs, // บันทึกเป็นตัวเลขจริงไม่ใช่ increment
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            // 3. อัปเดตสถิติรายวัน (สำหรับกราฟแท่ง)
            if (newGoodEggs > 0 || newDamagedEggs > 0) {
                const dailyRef = db.collection('daily_stats').doc(today);
                batch.set(dailyRef, {
                    date: today,
                    good_eggs: admin.firestore.FieldValue.increment(newGoodEggs),
                    damaged_eggs: admin.firestore.FieldValue.increment(newDamagedEggs)
                }, { merge: true });
            }

            await batch.commit();
            console.log(`🥚 Update [${today}]: Data Saved & Eggs +${newGoodEggs + newDamagedEggs}`);

        } catch (err) {
            console.error("❌ Message Error:", err.message);
        }
    }
});

// --- API Routes ---

// ดึงข้อมูลไปวาดกราฟเส้น (20 จุดล่าสุด)
app.get('/api/sensor/history', async (req, res) => {
    try {
        const snapshot = await db.collection('sensor_history')
                                 .orderBy('timestamp', 'desc')
                                 .limit(20)
                                 .get();
        const history = snapshot.docs.map(doc => doc.data()).reverse();
        res.json(history);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/api/control', (req, res) => {
    const { device, status } = req.body; 
    if (device && status) {
        const mqttMessage = `${device}_${status}`;
        mqttClient.publish('spu/smartfarm/control', mqttMessage);
        res.status(200).send({ success: true });
    } else {
        res.status(400).send({ error: "Missing parameters" });
    }
});

app.get('/api/production/weekly-stats', async (req, res) => {
    try {
        // ดึง 7 วันล่าสุด
        const snapshot = await db.collection('daily_stats')
                                 .orderBy('date', 'desc') 
                                 .limit(7)
                                 .get();

        const stats = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                // 🟢 ต้องแน่ใจว่าชื่อตัวแปรเหล่านี้ตรงกับที่ใช้ในกราฟ (Frontend)
                name: d.date,       // แกน X (วันที่ หรือ ชื่อวัน)
                good_eggs: d.good_eggs || 0,    // แท่งสีส้ม
                damaged_eggs: d.damaged_eggs || 0 // แท่งสีชมพู
            };
        });

        // ส่งกลับไปแบบเรียงลำดับเวลาจากอดีตมาปัจจุบัน
        res.status(200).json(stats.reverse()); 
    } catch (err) {
        console.error("Graph API Error:", err);
        res.status(500).json([]);
    }
});

// --- 🌐 Serve Frontend ---
app.use(express.static(path.join(__dirname, 'dist')));

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));