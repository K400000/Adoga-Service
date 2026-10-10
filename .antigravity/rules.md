<!-- .antigravity/rules.md -->

# AI Coding Agent Directives: Adoga Project

## 0. Read First
- อ่านให้ครบก่อนเขียนโค้ด: `docs/ARCHITECTURE.md` (source of truth) → `docs/MOCK_DATA_SPEC.md` → **`docs/DESIGN_SYSTEM.md`** → `TODO.md` → `docs/ui-specs/README.md`
- ถ้าเอกสารขัดกันหรือไม่ชัด **ให้ถามก่อน** อย่าเดาเอง
- นี่คือ **functional prototype แบบงานไว** เพื่อโชว์ State Diagram + UX/UI. อย่า over-engineer: ไม่ต้องมี unit test, ไม่ต้อง TypeScript, ไม่ต้อง validation ลึก

## 1. Project Constraints (Strict)
- **NO BACKEND:** ห้ามเขียน Express, Node server, Python หรือเรียก external API ใด ๆ
- **DATABASE:** ใช้ `localStorage` เท่านั้น ผ่าน `src/utils/storage.js` (parse/stringify ที่เดียว) และ `src/services/db.js` (reactive store + auto-persist)
- **FRAMEWORK:** Vue 3 + `<script setup>` (Composition API) + Vue Router. **ไม่ใช้ Pinia**
- **STYLING:** Tailwind CSS utility classes. ไม่สร้าง `.css` เพิ่ม ยกเว้น animation ซับซ้อนจริง ๆ
- **ICONS:** `lucide-vue-next`
- **CHARTS:** `chart.js` + `vue-chartjs`
- **Password:** plain text (ไม่ hash) / **Google login:** mock ไม่มี API
- **Auth:** ไม่มี Backend. Register/Login/Forgot ทำใน `services/authService.js` + validation ที่ `utils/validators.js` ตาม `ARCHITECTURE.md` §3 (อีเมลถูกรูปแบบ+ไม่ซ้ำ, รหัสผ่าน ≥8 ตัว มี A-Z a-z 0-9, ยืนยันรหัส, ต้องเลือก Role เอง, error ใต้ช่อง + Password checklist live) ห้ามเขียนกฎ validate ซ้ำกระจายหลายหน้า

## 2. State & Status Rules (สำคัญที่สุด)
- ระบบมี **5 State Machine**: Hotel, Unit (ห้องพัก), Booking, Payment, Refund — นิยามใน `ARCHITECTURE.md` §4
- **ห้ามเขียน `x.status = '...'` ตรง ๆ นอก `services/transitions.js`** ทุกการเปลี่ยนสถานะต้องเรียกฟังก์ชันใน `transitions.js` ซึ่งต้อง throw เมื่อ transition ไม่ถูกต้อง และทำ side-effect ข้าม entity ให้ครบ (§5)
- ใช้ชื่อ status (code) ตามเอกสารเป๊ะ ๆ ห้ามตั้งใหม่
- ป้ายไทย/สี/ไอคอน/hint ทั้งหมดอยู่ที่ `src/constants/status.js` ที่เดียว
- **ทุกที่ที่แสดง status ต้องใช้ `StatusBadge` / `StatusStepper` / `StatusBanner`** ห้ามพิมพ์ text status ดิบ. ผู้ใช้ต้องมองแล้วรู้ทันทีว่าอยู่สถานะไหนและทำอะไรต่อได้
- ปุ่ม Action ที่ทำไม่ได้ในสถานะปัจจุบัน → ซ่อนหรือ disable เสมอ
- Lazy expiry: เรียก `expireStaleBookings()` ตอนโหลดแอป + `router.afterEach` (ไม่ใช้ background timer)

## 3. Design System & UX
- **สเปก UX/UI ทั้งหมดอยู่ที่ `docs/DESIGN_SYSTEM.md`** (Grid, Spacing 4/8px, Type scale, Color+contrast, Radius, Elevation, ขนาดคอมโพเนนต์, Wireframe, State, Accessibility) เป็นข้อบังคับ ห้ามใช้ค่านอก scale (เช่น `p-5`, `mt-[13px]`)
- **Vibe:** "Clean Dopamine Minimalist" (Trip.com / Traveloka) — พื้นขาว/off-white, สีสด Indigo / Sunset Coral / Emerald ใช้เฉพาะจุด (ปุ่มหลัก ≤ 1 ปุ่ม/หน้าจอ)
- Bento Grid, pill, Glassmorphism ใช้ตามขอบเขตใน DESIGN_SYSTEM §5 เท่านั้น (Glass ไม่ใช้กับการ์ดเนื้อหา)
- **ห้ามหน้าตา "AI template":** ดู §13 ใน DESIGN_SYSTEM (การ์ด/shadow/radius เหมือนกันหมด, gradient ตกแต่ง, eyebrow ตัวพิมพ์ใหญ่, fade-up ทุก section ฯลฯ)
- **Figma (`docs/ui-specs`) ชนะเรื่องโครงหน้า / DESIGN_SYSTEM ชนะเรื่องตัวเลขและ token**
- **Global Footer:** ทุก Layout ต้องมี Footer: "รายวิชา System Analysis and Design", รายชื่อ/ติดต่อสมาชิก 5 คน (placeholder ใน `constants/team.js`), Copyright
- ข้อความ UI เป็นภาษาไทย (ชื่อ code/ตัวแปรเป็นอังกฤษ) ใช้ข้อมูลตัวอย่างที่สมจริง
- รูปภาพโรงแรมอ้างผ่าน URL ใน seed/`constants/images.js` (ผู้ใช้จะส่ง URL จริงให้ภายหลัง ตอนนี้ใช้ placehold.co)

## 4. Execution Protocol
- ทำตามลำดับ Phase ใน `TODO.md` ห้ามทำ Admin ก่อน User เสร็จ
- ก่อนเริ่ม Phase 2 ต้องมี `transitions.js` ครบ 5 machine และ seed ทำงานแล้ว (Phase 1)
- Route guard ผ่าน `router.beforeEach`: Guest เข้า booking/profile/messages/manager/admin → redirect `/auth?redirect=...&reason=login_required` + แจ้ง "กรุณาลงทะเบียนให้เรียบร้อยก่อนใช้งาน"; Role ไม่ตรง → กลับหน้าแรกของ Role ตัวเอง + Toast
- ปุ่มที่ต้อง Login (จอง/ชำระเงิน/แชท/โปรไฟล์) ต้องเรียก `requireAuth()` ก่อนเสมอ (ดักชั้น UI) ไม่พึ่ง route guard อย่างเดียว
- Guest = สถานะ "ไม่มี session" ไม่ใช่ Role: ห้ามสร้าง user ชื่อ guest
- Component เล็ก แยกชัด reuse ได้ Template อ่านง่าย (ถ้าเกิน ~150 บรรทัดให้แยก)
- จบแต่ละ Phase: ผ่าน **Quality Gate** ท้าย `DESIGN_SYSTEM.md` ก่อน แล้วสรุปสั้น ๆ ว่าทำอะไรเสร็จ + ติ๊ก `TODO.md` + บอกวิธีทดสอบ (กดอะไรแล้วควรเห็นอะไร)
