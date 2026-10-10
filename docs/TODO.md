# Project Backlog: Adoga (Hotel Booking Mockup)

> ทำตามลำดับ Phase. ห้ามข้ามไปทำ Admin ก่อน User เสร็จ. ก่อนเริ่มทุก Phase ให้อ่าน `ARCHITECTURE.md` + `MOCK_DATA_SPEC.md`
> Priority: ✅ = ต้องมี, ⭐ = Nice-to-have (ทำถ้าเหลือเวลา)

## Phase 1: Scaffolding, Data Layer & Global UI
- [ ] Initialize Vue 3 (Vite) + Vue Router + Tailwind CSS + `lucide-vue-next` + `chart.js` + `vue-chartjs`
- [ ] **Design tokens:** `src/style.css` (`@theme` ตาม `DESIGN_SYSTEM.md` §11) + ติดตั้ง `@fontsource/prompt` `@fontsource/ibm-plex-sans-thai`
- [ ] **Base UI components** ตามสเปก §6: `BaseButton`, `BaseInput`, `BaseCard`, `BaseModal` (bottom sheet บน mobile), `Toast`, `Tabs`, `Skeleton`, `EmptyState`, `Navbar`, `Sidebar`
- [ ] `utils/storage.js` — get/set/remove JSON
- [ ] `services/db.js` — reactive store + auto-persist ลง `localStorage` ทุก key `adoga_*`
- [ ] `services/seed.js` — seed ตาม `MOCK_DATA_SPEC.md` (วันที่คำนวณจากเวลาปัจจุบัน, filler bookings สำหรับกราฟ)
- [ ] `constants/status.js` — label/สี/ไอคอน/hint ของ Hotel, Unit, Booking, Payment, Refund
- [ ] `services/transitions.js` — transition map ครบ **5 State Machine** + side-effects ตาม `ARCHITECTURE.md` §4–5 (throw เมื่อ transition ผิด) + `expireStaleBookings()`
- [ ] Common components: `StatusBadge`, `StatusStepper`, `StatusBanner`, `Footer` (ใส่ทุก layout; ข้อมูลทีมจาก `constants/team.js`)
- [ ] `utils/validators.js` — validateEmail, validatePassword (คืนผลทีละกฎสำหรับ checklist), validateName
- [ ] `services/authService.js` — register / login / logout / resetPassword (อ่านเขียน `adoga_users`, เช็คอีเมลซ้ำ, สร้าง id ตาม Role)
- [ ] **Register 2 ขั้น:** ฟอร์มข้อมูลบัญชี (error ใต้ช่อง + Password checklist live + ปุ่มดูรหัส) → เลือก Role (User / Manager / Admin, ไม่มี default) → สำเร็จ → Toast + ไปแท็บ Login พร้อม prefill อีเมล
- [ ] **Login:** ตรวจตามข้อมูลที่ลงทะเบียนไว้ ("ไม่พบอีเมลนี้ในระบบ" / "รหัสผ่านไม่ถูกต้อง") → ไป `redirect` หรือหน้าแรกของ Role
- [ ] **Guest Mode:** ปุ่ม "เข้าชมแบบ Guest" (หน้า Auth + Navbar) + `requireAuth()` composable; กดจอง/ชำระเงิน/แชท/โปรไฟล์ → `/auth?reason=login_required` + Toast & Alert "กรุณาลงทะเบียนให้เรียบร้อยก่อนใช้งาน"
- [ ] ปุ่ม Google mock (ไป Register + prefill อีเมลสุ่ม readonly) / Demo Accounts ⭐
- [ ] Forgot Password: กรอกอีเมล (ต้องมีในระบบ) → PIN 6 หลักสุ่ม (Toast) → ยืนยัน → ตั้งรหัสใหม่ (ผ่าน password policy)
- [ ] Router + `beforeEach` guard (Guest vs Role) + redirect กลับหน้าเดิมหลัง Login + Toast เมื่อ Role ไม่ตรง

## Phase 2: Guest & User Flow (Trip.com / Traveloka Style)
- [ ] **Home:** Search bar, Chonburi Recommendations, Deals, Reviews (แสดงเฉพาะโรงแรม `active`)
- [ ] **Hotel Detail:** Gallery, Amenities, Room types (นับห้องว่างจาก unit), Reviews list, ปุ่มจอง (Guest → Auth)
- [ ] **Booking Flow:**
  - [ ] เลือก Room type + วันที่ + จำนวนคน → คำนวณราคา → สร้าง Booking (`pending_payment`, payment `waiting`, ล็อก unit `booked`)
  - [ ] Countdown 12 ชม. (`setInterval` เฉพาะหน้านี้) + lazy expire
  - [ ] เลือกวิธีชำระ (QR / Bank Transfer) → กด "ฉันชำระเงินแล้ว" → `verifying` (~3 วิ) → `success` (Booking → `confirmed`)
  - [ ] ช่องติ๊ก "จำลองการชำระล้มเหลว" → `failed` → ปุ่ม "ชำระใหม่"
  - [ ] Success Modal + `StatusStepper`
- [ ] **User Profile:** แก้ Nickname (ฟิลด์อื่น readonly), Logout
- [ ] **ประวัติการจอง:** การ์ดทุก Booking + `StatusBadge` (Booking/Payment) + ปุ่มยกเลิก (เฉพาะ `pending_payment`)
- [ ] **ขอคืนเงิน:** ปุ่มตาม `enableRefund` (Coming Soon เมื่อ OFF) → `RefundModal` → Refund `submitted`; แสดงสถานะใบขอคืนเงินในการ์ด
- [ ] **User Message:** Chat UI mock กับ Hotel Manager

## Phase 3: Manager Flow
- [ ] **Dashboard:** Revenue (รวม `confirmed` + `completed` ของโรงแรมตัวเอง), จำนวนโรงแรมแยก status
- [ ] **Hotel CRUD:** ฟอร์มเพิ่มโรงแรม + rooms/units → `pending`; แก้ไข `rejected` → `pending`; แก้ไข `active` → `pending` (confirm เตือน)
- [ ] **สถานะโรงแรม:** `StatusBanner` + ปุ่ม ปิดชั่วคราว / เปิดใช้งาน / ปิดกิจการ (ตาม transition)
- [ ] **จัดการห้อง:** ปุ่ม ปรับปรุง / พร้อมใช้งาน (เฉพาะ unit ที่ transition ได้)
- [ ] **Guest Management:** รายการ `confirmed` → Check-in (`checkedInAt`) → Check-out (Booking `completed`, unit `available`)
- [ ] **ใบขอคืนเงิน:** ตรวจสอบ (`reviewing`) → อนุมัติ / ปฏิเสธ+เหตุผล (side-effects ตาม §4.5)
- [ ] **Manager Message:** Chat UI ตอบ User

## Phase 4: Admin Flow
- [ ] **Dashboard:** Total Users, Active Hotels, New Bookings + กราฟ Chart.js (24h / Month / Year)
- [ ] **Approval System:** ลิสต์ `pending` → Approve (`active`) / Reject + `rejectReason` (`rejected`)
- [ ] **System Settings:** Toggle `enableRefund` ON/OFF + ปุ่ม Reset Demo Data

## Phase 5: Polish & QA
- [ ] Micro-interactions (Hover, Bento grid animations, Glassmorphism)
- [ ] Responsive check ที่ 375 / 768 / 1280 (ตาราง → การ์ดบน mobile)
- [ ] **UI Quality Gate** ท้าย `DESIGN_SYSTEM.md` ผ่านครบทุกหน้า (spacing/type อยู่ใน scale, contrast, focus ring, Loading/Empty/Error, ปุ่มหลัก ≤ 1 ปุ่ม/หน้าจอ)
- [ ] **ทดสอบ Auth/Guest:**
  - [ ] สมัครด้วยอีเมลผิดรูปแบบ / อีเมลซ้ำ / รหัสสั้นหรือขาด A-Z a-z 0-9 / ยืนยันรหัสไม่ตรง / ไม่เลือก Role → เห็น error ครบ
  - [ ] สมัครสำเร็จทั้ง 3 Role → Login ด้วยบัญชีที่เพิ่งสมัคร → เข้าหน้าตาม Role
  - [ ] Login รหัสผิด / อีเมลไม่มี → เห็นข้อความถูกต้อง
  - [ ] Guest: เข้า Home/Detail ได้, กดจอง/ชำระเงิน/แชท/พิมพ์ URL `/profile` `/admin` → เด้ง Auth + "กรุณาลงทะเบียนให้เรียบร้อยก่อนใช้งาน" → Login แล้วกลับหน้าเดิม
- [ ] **ทดสอบ Flow ให้ตรง State Diagram** (ใช้เป็น Demo Script ตอนพรีเซนต์):
  - [ ] โรงแรม: เพิ่ม → ปฏิเสธ → แก้ไข → อนุมัติ → ปิดชั่วคราว → เปิด → แก้ไข (กลับรออนุมัติ)
  - [ ] การจอง+ชำระ: สร้าง → ชำระล้มเหลว → ชำระใหม่ → สำเร็จ → ยืนยัน → Check-in/out → เสร็จสิ้น
  - [ ] การจอง: หมดเวลา 12 ชม. → ยกเลิก (ห้องกลับเป็นว่าง)
  - [ ] คืนเงิน: เปิด Beta → ยื่น → ตรวจสอบ → อนุมัติ (Payment `refunded`, Booking `cancelled`) / ปฏิเสธ
  - [ ] ห้อง: ว่าง → ปรับปรุง → พร้อมใช้งาน → ถูกจอง → ว่าง
- [ ] ⭐ Admin Settings: ตัวเลือกย่นเวลาหมดอายุ (เช่น 1 นาที) เพื่อโชว์ lazy expiry ตอนพรีเซนต์
