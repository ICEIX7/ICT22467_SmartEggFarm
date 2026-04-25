# 🐣 Smart Farm Egg — ระบบจัดการโรงเรือนไก่ไข่อัจฉริยะ

ระบบถูกออกแบบมาในรูปแบบ **IoT Full-Stack** โดยแบ่งการทำงานออกเป็น 3 ส่วนหลัก ดังนี้:

### 1. ส่วนฮาร์ดแวร์ (Edge Layer - ESP32)
* **การทำงาน:** รับค่าจากเซนเซอร์ (DHT22, LDR, Ultrasonic, Ammonia) 
* **การส่งข้อมูล:** แปลงข้อมูลเป็นรูปแบบ JSON และส่งผ่านโปรโตคอล **MQTT** ไปยัง Raspberry Pi
* **การประมวลผล:** ตัดสินใจเปิด/ปิด พัดลมและไฟเบื้องต้นตามเกณฑ์ (Threshold) ที่ตั้งไว้ในโค้ด

### 2. ส่วนกลางและการสื่อสาร (Gateway & Backend Layer - Raspberry Pi)
* **MQTT Broker:** ใช้ **Mosquitto** ทำหน้าที่เป็นตัวกลางรับส่งข้อมูลภายในวง WiFi เดียวกัน
* **Backend Service:** รันอยู่ใน **Docker Container** (Node.js) ทำหน้าที่:
    * คอยฟังข้อมูล (Subscribe) จาก ESP32
    * สุ่มจำนวนไข่ (Random Logic) และคำนวณสถิติ
    * บันทึกข้อมูลลงใน **Google Cloud Firestore** ทั้งแบบค่าล่าสุด (Latest) และประวัติย้อนหลัง (History)

### 3. ส่วนการแสดงผลและควบคุม (Application Layer - React Dashboard)
* **Frontend:** แสดงผลข้อมูลในรูปแบบก้อน Widget และกราฟเส้น (Chart.js)
* **Control API:** เมื่อผู้ใช้กดสวิตช์บนหน้าเว็บ จะส่ง HTTP Request มาที่ Backend เพื่อส่งคำสั่ง MQTT กลับไปควบคุมอุปกรณ์ที่ ESP32

---

## 📖 ภาพรวมระบบ (System Overview)
โปรเจกต์นี้ใช้ **ESP32** ในการรับค่าจากเซนเซอร์ต่างๆ และส่งข้อมูลผ่าน **MQTT** มายัง **Raspberry Pi** ที่รัน **Docker** เพื่อเก็บข้อมูลลง **Firestore** และแสดงผลผ่านหน้าเว็บ

---

## 🛠️ เทคโนโลยีและเครื่องมือที่ใช้ (Tech Stack & Tools)

| ส่วนงาน | เทคโนโลยี/เครื่องมือที่ใช้ |
| :--- | :--- |
| **Hardware** | ESP32, DHT22, LDR, Ultrasonic Sensor |
| **Back-end** | Node.js (Express), MQTT Broker (Mosquitto) |
| **Database** | Google Cloud Firestore |
| **Front-end** | React.js, Chart.js, Tailwind CSS |
| **Infrastructure** | Docker, Raspberry Pi 4 |

---
## 📖 คู่มือการใช้งานระบบ (User Manual)

### 1. หน้า Dashboard (ภาพรวมระบบ)
* **การดูค่าเซนเซอร์:** ข้อมูลอุณหภูมิ, ความชื้น, และระดับน้ำ จะอัปเดตแบบ Real-time ทุก ๆ 5 วินาที
* **สถานะอุปกรณ์:** ตรวจสอบสถานะการทำงานของ พัดลม (Fan) และ ไฟส่องสว่าง (Light) ได้จากไอคอนสถานะ
* **สถิติการเก็บไข่:** กราฟจะแสดงจำนวนไข่ที่เก็บได้ในแต่ละวัน (แบ่งเป็นไข่ดี และ ไข่เสีย) โดยดึงข้อมูลย้อนหลัง 7 วันจาก Firestore

### 2. การควบคุมอุปกรณ์ (Remote Control)
* **Manual Mode:** ผู้ใช้สามารถกดปุ่ม Switch บนหน้าเว็บ เพื่อสั่ง เปิด/ปิด พัดลมหรือไฟได้ด้วยตนเอง
* **ระบบจะส่งคำสั่งผ่าน MQTT:** ไปยัง ESP32 เพื่อควบคุม Relay หรือ LED ในโรงเรือนทันที

### 3. การจัดการข้อมูลการผลิต (Production Management)
* **การบันทึกไข่:** ระบบจะ Random จำนวนไข่จำลอง (หรือรับจากเซนเซอร์จริง) และบันทึกลงใน `daily_stats` โดยอัตโนมัติ
* **การดูประวัติย้อนหลัง:** สามารถตรวจสอบประวัติย้อนหลังของสภาพแวดล้อมได้ที่ส่วนของ Charts เพื่อวิเคราะห์ความสัมพันธ์ระหว่างอุณหภูมิกับผลผลิตไข่

---

## 🧭 โครงสร้างเมนู (Navigation)
| เมนู | คำอธิบาย |
| :--- | :--- |
| **Dashboard** | หน้าหลักสำหรับดูค่าเซนเซอร์และควบคุมอุปกรณ์ |
| **การจัดการโรงเรือน** | จัดการข้อมูลรอบการเลี้ยงและจำนวนแม่ไก่ |
| **บันทึกการเก็บไข่** | ดูรายละเอียดประวัติการผลิตรายวัน |
| **ตั้งค่าระบบ** | จัดการผู้ใช้งานและเกณฑ์การแจ้งเตือน (Threshold) |

---
## 🎨 เค้าโครงสีหลักของแบรนด์ (Brand Theme)

การออกแบบหน้าจอ Dashboard เน้นความทันสมัย สะอาดตา และใช้งานง่าย (Modern & Clean UI) โดยใช้โทนสีที่สื่อถึงเทคโนโลยีฟาร์มอัจฉริยะและความปลอดภัย:

* **Primary Color:** `#FF6B00` (Orange) 
    * ใช้เป็นสีหลักสำหรับปุ่มกด, เมนูที่เลือก และส่วนที่ต้องการเน้น (สัญลักษณ์ของไข่สดและความกระตือรือร้น)
* **Secondary Color:** `#1A1C1E` (Dark Navy)
    * ใช้สำหรับแถบเมนูด้านข้าง (Sidebar) และข้อความหลัก เพื่อให้ดูมีความมั่นคงและเป็นมืออาชีพ
* **Status Colors:**
    * 🟢 `Success/Normal` (#4ADE80): สำหรับสถานะอุปกรณ์ที่ทำงานปกติ
    * 🟡 `Warning` (#FACC15): สำหรับแจ้งเตือนระดับน้ำต่ำหรืออุณหภูมิเริ่มสูง
    * 🔴 `Danger/Critical` (#F87171): สำหรับระดับแอมโมเนียที่อันตราย
* **Background:** `#F8FAFC` (Slate White)
    * ใช้สีพื้นหลังสีสว่างเพื่อให้ตัวเลขเซนเซอร์และกราฟอ่านง่ายที่สุด

---

## 🖼️ ภาพตัวอย่างระบบ (System Preview)

| โหมดกลางวัน (Light Mode) | โหมดกลางคืน (Dark Mode) |
| :---: | :---: |
|<img width="1656" height="899" alt="สกรีนช็อต 2026-04-21 123414" src="https://github.com/user-attachments/assets/d5d304e3-67bb-474b-ab8e-23c587770ea0" />
  |<img width="1825" height="906" alt="สกรีนช็อต 2026-04-19 222631" src="https://github.com/user-attachments/assets/9b65fdc2-eaa9-4e12-8a58-3ffeb093b96e" />  |

> **Tip:** คุณสามารถลากรูปภาพ Screenshot จริงของโปรเจกต์คุณมาวางในตารางนี้แทนที่ลิงก์ตัวอย่างได้เลยครับ

## 🛠 การแก้ไขปัญหาเบื้องต้น (Troubleshooting)
* **กราฟไม่ขยับ:** ตรวจสอบว่า ESP32 เชื่อมต่อ WiFi และ MQTT Broker สำเร็จหรือไม่ (เช็คใน Serial Monitor)
* **หน้าเว็บเข้าไม่ได้:** ตรวจสอบว่า Docker Container `my-farm` ยังรันอยู่หรือไม่ โดยใช้คำสั่ง `docker ps`
* **ข้อมูลไม่อัปเดต:** เช็คการเชื่อมต่ออินเทอร์เน็ตของ Raspberry Pi เพื่อให้สามารถส่งข้อมูลไปที่ Firebase ได้

## 🚀 ขั้นตอนการติดตั้งและรันระบบ (Installation Guide)

### 📌 สิ่งที่ต้องเตรียม (Prerequisites)
* Raspberry Pi ที่ติดตั้ง **Docker** เรียบร้อยแล้ว
* ไฟล์ `serviceAccountKey.json` จาก Firebase Console
* อุปกรณ์ ESP32 ที่เบิร์นโค้ดพร้อมเชื่อมต่อ WiFi

### Step 1: Clone Repository
```bash
git clone [https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git)
cd YOUR_REPO_NAME
Step 2: ตั้งค่า Firebase
นำไฟล์ serviceAccountKey.json ไปวางไว้ในโฟลเดอร์ backend/

Step 3: Build และรันด้วย Docker
Bash
docker build -t smart-farm-app .
docker run -d -p 5000:5000 --name my-farm --restart always smart-farm-app
🔑 ข้อมูลเข้าสู่ระบบทดสอบ (Test Credentials)
URL: http://<YOUR_PI_IP>:5000

Admin: admin / password: 1234
