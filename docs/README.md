<!-- docs/ui-specs/README.md -->

# Figma UI to Component Mapping

> ตัวเลข/สัดส่วน/สี/ขนาดคอมโพเนนต์ ดูที่ `docs/DESIGN_SYSTEM.md` · ไฟล์นี้บอกแค่ว่าภาพ Figma ไหน = หน้าไหน
> ถ้ายังไม่มีภาพ `01–13.png` ในโฟลเดอร์ `docs/ui-specs/` ให้ใช้ Wireframe ใน DESIGN_SYSTEM §10 แทน

ใช้ตารางนี้เพื่ออ้างอิงภาพ Screenshot (จาก Figma) กับโครงสร้าง Component ในโปรเจกต์
คอลัมน์ **Status UI** = สถานะที่ต้องแสดงในหน้านั้น (ดูมาตรฐานที่ `ARCHITECTURE.md` §6 — ใช้ `StatusBadge` / `StatusStepper` / `StatusBanner` เท่านั้น)

| File Name | Description / Scope | Target Component / View | Status UI |
| :--- | :--- | :--- | :--- |
| `01-auth.png` | แท็บ **เข้าสู่ระบบ** / **สมัครสมาชิก** (2 ขั้น: ข้อมูลบัญชี + validation + Password checklist live → เลือก Role 3 การ์ด) · ปุ่ม **เข้าชมแบบ Guest** · ปุ่ม Google (mock → Register + prefill) · Demo Accounts ⭐ — รายละเอียดที่ `ARCHITECTURE.md` §3 | `views/Auth.vue` | แถบ Alert ส้ม "กรุณาลงทะเบียนให้เรียบร้อยก่อนใช้งาน" เมื่อ `?reason=login_required`; error สีแดงใต้ช่อง |
| `02-forgot-pwd.png` | ลืมรหัสผ่าน + ยืนยัน PIN 6 หลัก (สุ่ม แสดงใน Toast) + ตั้งรหัสใหม่ตาม password policy เดียวกับ Register | `components/auth/ForgotPassword.vue` | — |
| `03-home.png` | หน้า Home (Guest/User) Navbar ของ Guest มีปุ่ม "เข้าสู่ระบบ / สมัครสมาชิก" เรฟ Trip.com เน้นชลบุรี | `views/Home.vue` | แสดงเฉพาะโรงแรม `active` |
| `04-hotel-detail.png` | หน้ารายละเอียดที่พัก (Guest/User) + Room types | `views/HotelDetail.vue` | Room type แสดง "เหลือ N ห้อง" / "เต็ม" (นับจาก unit `available`); โรงแรม `temp_closed` → ปุ่มจอง disable + ข้อความ "ปิดชั่วคราว" |
| `05-user-booking.png` | Flow จอง + นับถอยหลัง 12 ชม. + Modal ชำระเงิน | `views/BookingFlow.vue` | `StatusStepper` (Booking) + `StatusBadge` (Payment); Modal: `verifying` → `success`/`failed` (ปุ่ม "ชำระใหม่") |
| `06-user-message.png` | หน้าต่างแชทฝั่ง User ติดต่อโรงแรม | `views/UserMessage.vue` | — |
| `07-user-setting.png` | โปรไฟล์ (แก้ชื่อเล่น) + **ประวัติการจอง** + ปุ่ม Sign Out | `views/UserProfile.vue` | การ์ดแต่ละรายการ: `StatusBadge` Booking + Payment + (ถ้ามี) ใบขอคืนเงิน; ปุ่ม "ขอคืนเงิน" ตาม `enableRefund` |
| `08-manager-home.png` | Dashboard สรุปยอด + จัดการโรงแรม (ส่งอนุมัติ/แก้ไข/เปิด-ปิด) + จัดการห้อง + ใบขอคืนเงิน — **1 ผู้จัดการ : 1 โรงแรม** (หลายสาขาให้รวมในโรงแรมเดียวกัน) | `views/ManagerDashboard.vue` | `StatusBanner` ต่อโรงแรม (Hotel); `StatusBadge` ต่อห้อง (Unit) + ปุ่ม ปรับปรุง/พร้อมใช้งาน; ตารางใบขอคืนเงิน (Refund) พร้อมปุ่ม ตรวจสอบ / อนุมัติ / ปฏิเสธ |
| `09-manager-message.png` | หน้าต่างแชทฝั่ง Manager (ตอบ User) | `views/ManagerMessage.vue` | — |
| `10-manager-guests.png` | จัดการ Check-in / Check-out | `views/ManagerGuestList.vue` | `StatusBadge` Booking + badge รอง "เข้าพักแล้ว"; ปุ่ม Check-in (confirmed & ยังไม่เข้าพัก) / Check-out (เข้าพักแล้ว) |
| `11-admin-dashboard.png` | ภาพรวมสถิติ กราฟ 24h/Month/Year (Chart.js) | `views/AdminDashboard.vue` | จำนวนโรงแรมแยกตาม Hotel status |
| `12-admin-approve.png` | ลิสต์โรงแรมรออนุมัติ (Approve/Reject + เหตุผล) | `views/AdminApproval.vue` | แสดงเฉพาะ `pending`; Reject ต้องกรอก `rejectReason` |
| `13-admin-settings.png` | ตั้งค่าเปิด/ปิด Beta (ระบบคืนเงิน) + ปุ่ม Reset Demo Data | `views/AdminSettings.vue` | — |

## หน้าที่ไม่มี Figma (ให้ออกแบบตาม Design System ใน `rules.md`)

| Component | Scope |
| :--- | :--- |
| `components/manager/HotelFormModal.vue` | ฟอร์มเพิ่ม/แก้ไขโรงแรม + เพิ่ม Room type/ห้อง. ถ้าแก้โรงแรม `active` ต้องมี confirm เตือนว่า "จะกลับไปสถานะรออนุมัติ" |
| `components/manager/RefundReviewTable.vue` | รายการใบขอคืนเงินของโรงแรมที่ดูแล |
| `components/user/RefundModal.vue` | ฟอร์มยื่นคำขอคืนเงิน (กรอกเหตุผล) |
| `components/common/StatusBadge.vue` · `StatusStepper.vue` · `StatusBanner.vue` · `Footer.vue` | ดู `ARCHITECTURE.md` §6 |

## ข้อมูลโปรเจกต์สำหรับ Footer
"รายวิชา System Analysis and Design" · สมาชิก 5 คน (placeholder: `สมาชิก 1 – สมาชิก 5` + อีเมล/เบอร์ `xxx@example.com`) · `© 2026 Adoga Mockup`
เก็บไว้ที่ `constants/team.js` เพื่อแก้ง่ายภายหลัง
