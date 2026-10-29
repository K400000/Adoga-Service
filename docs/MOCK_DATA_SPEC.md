<!-- docs/MOCK_DATA_SPEC.md -->

# JSON Schema Mockup & Seed Data

โครงสร้างข้อมูลตั้งต้นสำหรับโหลดเข้า `localStorage` (ดู Key ที่ `ARCHITECTURE.md` §2)
Status ทุกตัวต้องตรงกับ `ARCHITECTURE.md` §4 เป๊ะ (ห้ามตั้งชื่อใหม่)

**กฎ Seed วันที่:** ห้าม hardcode. สร้างใน `seed.js` ด้วย helper `now()`, `addHours(n)`, `addDays(n)` (ติดลบ = อดีต) ตอนโหลดครั้งแรก
ด้านล่างใช้ `"+11h"`, `"-3d"` แทนค่าเวลา → `seed.js` แปลงเป็น ISO string

---

## 1. Users `adoga_users`

```json
[
  { "id": "U001", "email": "user@gmail.com",   "password": "Adoga1234", "role": "user",    "firstName": "John", "lastName": "Doe",   "nickname": "Johnny" },
  { "id": "U002", "email": "mary@gmail.com",   "password": "Adoga1234", "role": "user",    "firstName": "Mary", "lastName": "Smith", "nickname": "Mary" },
  { "id": "M001", "email": "manager@gmail.com", "password": "Adoga1234", "role": "manager", "firstName": "Somchai", "lastName": "Rakthai", "nickname": "Chai" },
  { "id": "M002", "email": "manager2@gmail.com","password": "Adoga1234", "role": "manager", "firstName": "Suda", "lastName": "Meesuk", "nickname": "Suda" },
  { "id": "M003", "email": "manager3@gmail.com","password": "Adoga1234", "role": "manager", "firstName": "Anan", "lastName": "Chaiyo", "nickname": "Anan" },
  { "id": "A001", "email": "admin@adoga.com",  "password": "Adoga1234", "role": "admin",   "firstName": "Admin", "lastName": "Adoga", "nickname": "Admin" }
]
```
- **ความสัมพันธ์ Manager↔Hotel = 1:1** ใช้ `hotel.managerId` เป็นแหล่งอ้างอิงเดียว (ไม่เก็บ `hotelId` ใน User) — ผู้จัดการ 1 คนดูแลโรงแรมได้ **1 แห่งเท่านั้น**
- หากต้องการหลายอาคาร/หลายทำเล ให้แยกเป็น **สาขา (branch)** ภายใต้โรงแรมเดียวกัน ไม่สร้างโรงแรมใหม่ให้ผู้จัดการคนเดิม
- Seed มีบัญชีผู้จัดการ `M001`–`M015` ครบทุกโรงแรม (1 บัญชี : 1 โรงแรม) — `M001` = `manager@gmail.com`, `M002` = `manager2@gmail.com`, `M003`–`M015` = `managerN@gmail.com` รหัสผ่าน `Adoga1234` ทุกบัญชี
- Seed password = `Adoga1234` (ผ่าน password policy ใน `ARCHITECTURE.md` §3.2 ทุกบัญชี)
- Register ใหม่: `id` = prefix ตาม role (`U`/`M`/`A`) + running number; `email` เก็บเป็น lowercase; ฟิลด์เพิ่มตอนสมัคร: `provider` (`"local"` | `"google"`, seed ที่ไม่ระบุ = `local`) และ `createdAt`
- `nickname` ว่างตอนสมัคร → ใช้ `firstName`
- **Guest ไม่มีใน `adoga_users`** = ไม่มี `adoga_current_session` (ค่า `null`)
- หน้า Auth ให้มีปุ่ม **Demo Accounts** (กดเติมอีเมล/รหัสให้ทั้ง 3 role) เพื่อโชว์งานเร็ว (รหัสทุกบัญชี `Adoga1234`)

---

## 2. Hotels `adoga_hotels`

Schema:
```json
{
  "id": "H001",
  "managerId": "M003",
  "name": "Chonburi Sea View",
  "location": "บางแสน, ชลบุรี",
  "description": "รีสอร์ทติดทะเลบางแสน ...",
  "pricePerNight": 1500,
  "discount": 10,
  "status": "active",
  "rejectReason": null,
  "images": ["https://placehold.co/800x500?text=H001-1", "https://placehold.co/800x500?text=H001-2"],
  "amenities": ["Pool", "Free WiFi", "Breakfast"],
  "rating": 4.5,
  "rooms": [
    {
      "id": "H001-R1",
      "type": "Standard Sea View",
      "price": 1500,
      "capacity": 2,
      "units": [
        { "no": "101", "status": "available" },
        { "no": "102", "status": "booked" },
        { "no": "103", "status": "maintenance" }
      ]
    },
    {
      "id": "H001-R2",
      "type": "Family Suite",
      "price": 2800,
      "capacity": 4,
      "units": [ { "no": "201", "status": "available" }, { "no": "202", "status": "available" } ]
    }
  ]
}
```
- `pricePerNight` = ราคาเริ่มต้นแสดงหน้า Home (= ราคาห้องถูกสุด), `discount` = % ลดทั้งโรงแรม
- ราคาที่จ่ายจริง = `nights × room.price × (1 - discount/100)`
- `images`: ผู้ใช้จะส่ง URL จริงมาให้ภายหลัง → ระหว่างนี้ใช้ placehold.co และเก็บ URL ไว้ที่เดียว (`constants/images.js`) เพื่อแก้ง่าย

**Seed (15 โรงแรม ครอบคลุมหลากหลายจังหวัดและทุก Status):**

| id | ชื่อ | จังหวัด/ทำเล | manager | status | หมายเหตุ |
|---|---|---|---|---|---|
| H001 | Chonburi Sea View | บางแสน, ชลบุรี | M003 | `approved` | มีห้องครบ 3 สถานะ (available/booked/maintenance) |
| H002 | Pattaya Beach Resort & Spa | พัทยา, ชลบุรี | M001 | `approved` | discount 15%, สปาครบวงจร |
| H003 | Chiang Mai Mountain Haven | แม่ริม, เชียงใหม่ | M002 | `approved` | discount 20%, สไตล์ล้านนากลางหุบเขา |
| H004 | Nimman Chic Boutique Hotel | นิมมานเหมินท์, เชียงใหม่ | M004 | `approved` | บูติกโฮเทลใจกลางนิมมานฯ |
| H005 | Phuket Sunset Cliff Villa | กะตะ, ภูเก็ต | M005 | `approved` | วิลล่าริมหน้าผา วิวพระอาทิตย์ตกดินพาโนรามา |
| H006 | Patong City Vibe Hotel | ป่าตอง, ภูเก็ต | M006 | `approved` | ใจกลางหาดป่าตอง เดินทางสะดวก |
| H007 | Krabi Emerald Bay Resort | อ่าวนาง, กระบี่ | M007 | `approved` | ติดหาดอ่าวนาง วิวหน้าผาหินปูน |
| H008 | Hua Hin White Sands Heritage | หัวหิน, ประจวบคีรีขันธ์ | M008 | `approved` | สไตล์โคโลเนียลติดหาดหัวหิน |
| H009 | Samui Tropical Sanctuary | เฉวง, สุราษฎร์ธานี | M009 | `approved` | แซงชัวรีรีสอร์ทติดหาดเกาะสมุย |
| H010 | Bangkok River Heritage Grand | เจริญกรุง, กรุงเทพฯ | M010 | `approved` | หรูริมแม่น้ำเจ้าพระยา พร้อมเรือรับส่ง BTS |
| H011 | Khao Yai Forest Mist Eco Lodge | ปากช่อง, นครราชสีมา | M011 | `approved` | อีโค่ลอดจ์เชิงเขาใหญ่ ดูดาว |
| H012 | Nan Misty Valley Retreat | ปัว, น่าน | M012 | `approved` | โฮมสเตย์วิวทุ่งนาและดอยภูคา |
| H013 | Koh Chang Marine Island Resort | เกาะช้าง, ตราด | M013 | `pending` | สำหรับทดสอบการอนุมัติโรงแรมของ Admin |
| H014 | Rayong Coastal Breeze Hotel | แกลง, ระยอง | M014 | `rejected` | สำหรับทดสอบกรณีโรงแรมถูกปฏิเสธ |
| H015 | Ayutthaya Riverside Boutique | พระนครศรีอยุธยา, พระนครศรีอยุธยา | M015 | `suspended` | ปิดปรับปรุงระบบชั่วคราว |

แต่ละโรงแรมมี 1–2 ประเภทห้องพัก (Room Types) และมีห้องย่อย (Units) ครบถ้วนพร้อมประวัติสถานะ

---

## 3. Bookings `adoga_bookings`

Schema (รวมข้อมูลการชำระเงินไว้ในรายการจอง):
```json
{
  "id": "B001",
  "userId": "U001",
  "hotelId": "H001",
  "roomId": "H001-R1",
  "roomNo": "102",
  "guests": 2,
  "checkIn": "2026-11-01",
  "checkOut": "2026-11-03",
  "nights": 2,
  "totalPrice": 2700,
  "status": "pending_payment",
  "cancelReason": null,
  "paymentMethod": "QR",
  "paymentStatus": "waiting",
  "createdAt": "-1h",
  "expiresAt": "+11h",
  "checkedInAt": null,
  "checkedOutAt": null
}
```
- `expiresAt = createdAt + 12h` เสมอ
- `paymentMethod`: `"QR"` | `"BANK_TRANSFER"` | `null` (ยังไม่เลือก)

**Seed (ครอบคลุมทุก status ทั้ง Booking และ Payment):**

| id | user | hotel | booking.status | paymentStatus | อื่น ๆ |
|---|---|---|---|---|---|
| B001 | U001 | H001 | `pending_payment` | `waiting` | expiresAt `+11h` |
| B002 | U001 | H002 | `confirmed` | `success` | จะมีใบขอคืนเงิน RF001 (`reviewing`) |
| B003 | U002 | H001 | `confirmed` | `success` | `checkedInAt: -1d` (กำลังเข้าพัก) |
| B004 | U001 | H001 | `completed` | `success` | `checkedInAt: -6d`, `checkedOutAt: -4d` |
| B005 | U002 | H003 | `cancelled` (`expired`) | `waiting` | |
| B006 | U002 | H002 | `cancelled` (`refund`) | `refunded` | RF002 `approved` |
| B007 | U002 | H003 | `confirmed` | `success` | RF003 `rejected` |
| B008 | U002 | H001 | `pending_payment` | `failed` | expiresAt `+5h` (ไว้โชว์ "ชำระใหม่") |

ห้อง (`units[].status`) ใน seed ต้องสอดคล้อง: B001/B002/B003/B007/B008 → ห้องนั้น `booked`; B004–B006 → `available`

**Filler ข้อมูลสำหรับกราฟ Admin:** `seed.js` สร้างเพิ่มแบบสุ่มราว 40 รายการ (`id: B1xx`, `completed`, `paymentStatus: success`, `createdAt` กระจาย 12 เดือนย้อนหลัง + บางส่วนใน 24 ชม. ล่าสุด) เพื่อให้กราฟ 24h/Month/Year ไม่ว่าง. Filler ไม่ต้องล็อกห้อง

---

## 4. Refunds `adoga_refunds`

```json
[
  { "id": "RF001", "bookingId": "B002", "userId": "U001", "hotelId": "H002", "amount": 3200,
    "reason": "เปลี่ยนแผนการเดินทาง", "status": "reviewing", "rejectReason": null, "createdAt": "-2h" },
  { "id": "RF002", "bookingId": "B006", "userId": "U002", "hotelId": "H002", "amount": 2400,
    "reason": "ป่วย", "status": "approved", "rejectReason": null, "createdAt": "-5d" },
  { "id": "RF003", "bookingId": "B007", "userId": "U002", "hotelId": "H003", "amount": 1800,
    "reason": "ไม่ต้องการเข้าพักแล้ว", "status": "rejected", "rejectReason": "ไม่เข้าเงื่อนไขการคืนเงินภายใน 24 ชม.", "createdAt": "-3d" }
]
```
`status` ∈ `submitted | reviewing | approved | rejected` — ต้องมีตัวอย่าง `submitted` ด้วยหนึ่งรายการตอนใช้งานจริง (ผู้ใช้สร้างเองตอนเดโม)

---

## 5. Reviews `adoga_reviews` (อ่านอย่างเดียว ไม่มีฟอร์มเขียนรีวิว)

```json
[
  { "id": "R001", "hotelId": "H001", "userId": "U001", "rating": 5, "comment": "วิวสวยมากครับ", "date": "2026-10-01" },
  { "id": "R002", "hotelId": "H001", "userId": "U002", "rating": 4, "comment": "ห้องสะอาด พนักงานน่ารัก", "date": "2026-09-20" },
  { "id": "R003", "hotelId": "H002", "userId": "U002", "rating": 5, "comment": "ใกล้หาด เดินสบาย", "date": "2026-09-12" }
]
```
ให้ครบอย่างน้อย 2 รีวิวต่อโรงแรมที่ `active`

---

## 6. Messages `adoga_messages` (แชท User ↔ Manager เท่านั้น)

```json
[
  { "id": "MSG001", "hotelId": "H001", "userId": "U001", "sender": "user",    "text": "สอบถามเรื่อง Check-in ก่อนเวลาได้ไหมครับ", "sentAt": "-3h" },
  { "id": "MSG002", "hotelId": "H001", "userId": "U001", "sender": "manager", "text": "ได้ครับ เริ่มตั้งแต่ 12:00 น.", "sentAt": "-2h" }
]
```
Thread = คู่ `(hotelId, userId)`. ฝั่ง User: เลือกโรงแรมที่เคยแชท/จอง; ฝั่ง Manager: รายการ thread ของโรงแรมที่ตัวเองดูแล (1 โรงแรมเท่านั้น). ไม่มี realtime — ส่งแล้วเพิ่มลง list ทันที (ไม่ต้องมี auto-reply)

---

## 7. Settings `adoga_settings`

```json
{ "enableRefund": false }
```

## 8. Session `adoga_current_session`

```json
{ "userId": "U001", "role": "user" }
```
