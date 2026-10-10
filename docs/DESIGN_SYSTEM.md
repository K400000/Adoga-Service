<!-- path: docs/DESIGN_SYSTEM.md -->

# Design System & UX/UI Spec (Adoga Mockup)

> ไฟล์นี้คือ **สเปก UX/UI ที่วัดได้** (ขนาด สัดส่วน สี ระยะ) เพื่อให้ผลลัพธ์ดูเป็นงานดีไซน์มาตรฐาน ไม่ใช่หน้าเว็บ template ที่ AI สร้างตามค่า default
> ทุกค่าด้านล่างเป็น **ข้อบังคับ** ไม่ใช่คำแนะนำ ถ้าจะเบี่ยงต้องถามก่อน

## 0. ลำดับความสำคัญ
1. **Figma screenshot** (`docs/ui-specs/01–13`) ชนะเรื่อง *โครงหน้า/ตำแหน่ง/เนื้อหา*
2. **ไฟล์นี้** ชนะเรื่อง *ตัวเลข สัดส่วน token ขนาดคอมโพเนนต์ state* (ถ้า Figma ไม่ได้ระบุ หรือขัดกับ Accessibility)
3. หน้าที่ไม่มี Figma → ใช้ Wireframe ใน §10 + Component spec ใน §6

**Vibe:** "Clean Dopamine Minimalist" = พื้นสะอาด โล่ง อ่านง่าย แล้วใช้สีสดเฉพาะจุดที่ต้องการให้กด/ให้สังเกต (Coral = จอง, Indigo = แบรนด์/เลือก, Emerald = สำเร็จ/ว่าง) **ใช้ความโดดเด่นแค่จุดเดียวต่อหน้า** ที่เหลือเงียบและเป็นระเบียบ

---

## 1. Layout & Grid

| Breakpoint | ความกว้าง | Columns | Gutter | Page padding (ซ้าย-ขวา) |
|---|---|---|---|---|
| Mobile (default) | 375–639 | 4 | 16 | 16 |
| `sm` / `md` Tablet | 640–1023 | 8 | 24 | 24 |
| `lg` Desktop | 1024–1279 | 12 | 24 | 32 |
| `xl` | ≥1280 | 12 | 24 | 32 |

- Content container: `mx-auto w-full max-w-[1200px]` (หน้า Manager/Admin: Sidebar กว้าง 256px + content max 1200px)
- **Mobile-first** ออกแบบที่ 375 → 768 → 1280 แล้วเช็คทั้งสามขนาด
- ข้อความยาว (คำอธิบายโรงแรม, รีวิว) จำกัด `max-w-[640px]` (ไทยไม่มีเว้นวรรค อ่านยากถ้ากว้างเกินไป)
- แถว Bento ใช้ 12 col: สัดส่วนที่อนุญาต `8+4`, `6+6`, `4+4+4`, `3+3+3+3`, `5+7` เท่านั้น (ห้ามสัดส่วนแปลก ๆ)

## 2. Spacing (ฐาน 4px, ใช้ขั้น 8px เป็นหลัก)

ใช้เฉพาะค่า: **4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96** (Tailwind `1 2 3 4 6 8 12 16 24`) ห้ามใช้ค่าอื่น (เช่น `p-5`, `gap-7`, `mt-[13px]`)

| การใช้งาน | ค่า |
|---|---|
| ไอคอน ↔ ข้อความในปุ่ม/badge | 8 |
| Label ↔ Input · Title ↔ Subtitle | 8 / 4 |
| ระหว่างช่องฟอร์ม | 24 |
| Padding การ์ด | 16 (mobile) · 24 (desktop) |
| ระหว่างการ์ดใน Grid | 16 (mobile) · 24 (desktop) |
| ระหว่าง Section ในหน้า | 48 (mobile) · 64 (md) · 96 (lg เฉพาะ Home) |
| Navbar → เนื้อหาแรก | 32 |

กฎ **Proximity:** สิ่งที่เกี่ยวข้องกันห่างน้อยกว่าสิ่งที่ไม่เกี่ยวข้องเสมอ (ในกลุ่ม 8–12 / ระหว่างกลุ่ม 24+ / ระหว่าง Section 48+)

## 3. Typography

**ฟอนต์ (รองรับไทย+อังกฤษ ติดตั้งผ่าน npm ไม่พึ่งเน็ต):**
- Display/Heading: **Prompt** `500, 600` (`@fontsource/prompt`)
- Body/UI: **IBM Plex Sans Thai** `400, 500` (`@fontsource/ibm-plex-sans-thai`)
- Fallback: `ui-sans-serif, system-ui, sans-serif` · ห้ามใช้ Inter/Roboto/Arial เป็นหลัก

**Type scale (อัตราส่วน ≈1.25) — line-height ไทยต้องสูงกว่าอังกฤษ (สระ/วรรณยุกต์ไม่โดนตัด):**

| Token | Mobile / Desktop (px) | Line-height | Weight · Font | ใช้กับ |
|---|---|---|---|---|
| `display` | 32 / 48 | 1.3 | 600 Prompt | Hero Home เท่านั้น |
| `h1` | 28 / 36 | 1.3 | 600 Prompt | ชื่อหน้า / ชื่อโรงแรม |
| `h2` | 22 / 28 | 1.35 | 600 Prompt | หัว Section |
| `h3` | 18 / 20 | 1.4 | 500 Prompt | หัวการ์ด / Modal |
| `body` | 16 | 1.625 (26px) | 400 Plex | เนื้อหาทั่วไป (**default**) |
| `small` | 14 | 1.55 (22px) | 400/500 Plex | ข้อมูลรอง, label, helper |
| `caption` | 12 | 1.5 (18px) | 400 Plex | หมายเหตุเล็ก (**ห้ามเล็กกว่า 12**) |

- ตัวเลขราคา/Countdown/ตาราง: `tabular-nums` ราคาใช้ Prompt 600
- สีข้อความ: หลัก `ink` · รอง `ink-muted` · **ห้ามใช้ข้อความสำคัญสี `slate-400` ลงไป** (คอนทราสต์ไม่พอ)
- Sentence case เสมอ ไม่ใช้ตัวพิมพ์ใหญ่ล้วน/`tracking-widest` เป็น eyebrow เหนือหัวข้อ

## 4. Color

Tailwind palette มาตรฐานใช้ตามนี้ (ไม่ต้องกำหนดเอง) ส่วน token ที่กำหนดเพิ่มอยู่ใน §11

| Role | Token / Hex | หมายเหตุ |
|---|---|---|
| Canvas (พื้นหลังหน้า) | `canvas` `#F7F8FB` | |
| Surface (การ์ด/Modal) | `#FFFFFF` | |
| Ink (ข้อความหลัก) | `ink` `#1B1F3B` | คอนทราสต์ ≥ 14:1 |
| Ink muted | `ink-muted` `#5B6078` | ≥ 5.5:1 บนพื้นขาว |
| Border / Divider | `line` `#E4E7F0` | การ์ดใช้ border 1px นี้ |
| **Primary — Indigo** | `indigo-600` `#4F46E5` · hover `indigo-700` · tint `indigo-50/100` | แบรนด์, ลิงก์, แท็บ/ตัวเลือกที่เลือก, ปุ่มรอง |
| **Action — Sunset Coral** | `coral-600` `#CF3F2A` (ปุ่ม, ข้อความ) · `coral-500` `#FF6B57` (พื้นใหญ่/แถบลดราคา ใช้ตัวอักษร ink) · `coral-50` `#FFF1EE` | **ปุ่มหลักได้ 1 ปุ่มต่อหน้าจอ** (จองห้อง / ชำระเงิน / ยืนยัน) |
| **Success — Emerald** | `emerald-700` `#047857` (ข้อความ/ปุ่ม) · `emerald-500` · `emerald-50` | |
| Warning | `amber-700` on `amber-50` | |
| Danger | `rose-700` on `rose-50` · ปุ่มลบ `rose-600` | |

- คอนทราสต์: ข้อความปกติ ≥ **4.5:1**, ข้อความใหญ่/ไอคอน/ขอบ UI ≥ **3:1** (ห้ามตัวอักษรขาวบน `coral-500`)
- สัดส่วนสีต่อหน้า (60-30-10): พื้นขาว/canvas ~60% · ink/neutral ~30% · สีสด (Indigo/Coral/Emerald) ≤ 10%
- ห้ามใช้ Gradient เป็นของตกแต่ง (อนุญาตเฉพาะ overlay ดำโปร่ง `from-black/50` บนรูปเพื่อให้อ่านตัวอักษรออก)

### 4.1 สี Status (กำหนดครั้งเดียว ใช้ทั้งระบบ — ตรงกับ `constants/status.js`)

Badge = `bg-{c}-50 text-{c}-700 ring-1 ring-{c}-200` · **ต้องมีไอคอน + ข้อความเสมอ ห้ามพึ่งสีอย่างเดียว**

| Family | สี | ความหมาย |
|---|---|---|
| wait | amber | รอใครสักคนทำ |
| progress | indigo | กำลังประมวลผล/กำลังใช้งาน |
| ok | emerald | สำเร็จ/พร้อมใช้ |
| bad | rose | ไม่ผ่าน/ยกเลิก |
| refund | violet | เงินกลับคืน |
| end | slate | จบ/ปิด/พักไว้ |

| Entity | Status → (family · ไอคอน lucide) |
|---|---|
| Hotel | `pending` รออนุมัติ (wait · Clock) · `approved` เปิดใช้งาน (ok · CircleCheck) · `rejected` ถูกปฏิเสธ (bad · CircleX) · `suspended` ปิดชั่วคราว (end · PauseCircle) · `closed` ปิดกิจการ (end · Archive) |
| Room | `available` ว่าง (ok · CircleCheck) · `booked` ถูกจอง (progress · BedDouble) · `maintenance` ปิดปรับปรุง (end · Wrench) |
| Booking | `pending_payment` รอชำระเงิน (wait · Clock) · `confirmed` ยืนยันแล้ว (ok · CircleCheck) · `completed` เสร็จสิ้น (end · CheckCheck) · `cancelled` ยกเลิก (bad · CircleX) · *derived* "เข้าพักอยู่" (progress · LogIn) |
| Payment | `awaiting` รอชำระ (wait · Clock) · `verifying` รอตรวจสอบ (progress · Loader2 หมุน) · `success` สำเร็จ (ok · CircleCheck) · `failed` ล้มเหลว (bad · CircleX) · `refunded` คืนเงินแล้ว (refund · Undo2) |
| Refund | `submitted` ถูกยื่น (wait · Send) · `reviewing` กำลังตรวจสอบ (progress · Loader2) · `approved` อนุมัติ (ok · CircleCheck) · `rejected` ปฏิเสธ (bad · CircleX) |

(ถ้ารหัส status ใน `ARCHITECTURE.md` ฉบับสุดท้ายต่างจากนี้ ให้ map ตามชื่อไทย/ความหมายเดียวกัน)

## 5. Radius · Elevation · Glass · Icon · Image · Motion

**Radius — ขนาดต่างกันตามลำดับชั้น (ห้ามใช้ค่าเดียวทุกอย่าง):**

| Token | px | ใช้กับ |
|---|---|---|
| `rounded-xl` | 12 | Input, Select, Textarea, รูปเล็ก/thumbnail |
| `rounded-2xl` | 16 | การ์ดทั่วไป, ตาราง |
| `rounded-3xl` | 24 | Bento tile ใหญ่, Modal, Bottom sheet (เฉพาะมุมบน) |
| `rounded-full` | – | ปุ่ม, Badge, Chip, Tab, Search capsule, Avatar |

กฎ nested: radius ลูก = radius แม่ − padding (ขั้นต่ำ 8) · รูปในการ์ดใช้ `overflow-hidden` ตามมุมการ์ด

**Elevation (shadow สี ink โปร่ง ไม่ใช้เทาตายตัว) — การ์ดปกติใช้ border ไม่ใช้ shadow:**

| Level | ใช้กับ | ค่า |
|---|---|---|
| e0 | การ์ด/ตาราง | `border border-line` ไม่มี shadow |
| e1 | การ์ดที่กดได้ตอน hover | `0 2px 8px rgb(27 31 59 / .06)` |
| e2 | Navbar, Search capsule, Dropdown, Toast | `0 8px 24px rgb(27 31 59 / .10)` |
| e3 | Modal | `0 24px 48px rgb(27 31 59 / .18)` |

**Glassmorphism — ใช้ได้ 4 จุดเท่านั้น:** (1) Navbar sticky (2) Search capsule บน Hero (3) แถบสรุปราคา sticky ล่างบน mobile (4) ป้ายซ้อนบนรูป
สูตร: `bg-white/70 backdrop-blur-md border border-white/60` (+ fallback `supports-[not(backdrop-filter)]:bg-white/95`) · **ห้ามใช้กับการ์ดเนื้อหาหรือพื้นหลังของข้อความยาว**

**Icons:** `lucide-vue-next` เท่านั้น ห้าม emoji เป็นไอคอน · ขนาด 16 (ใน badge/ข้อความ) · 20 (ใน ปุ่ม/input) · 24 (nav/หัวการ์ด) · 48 (empty state) · `stroke-width` 1.75 ทั้งระบบ

**Images (สัดส่วนมาตรฐาน):**

| ที่ใช้ | Aspect |
|---|---|
| การ์ดโรงแรม | 4:3 |
| Gallery หลัก (Detail) | 16:10 (desktop: ซ้าย 8 col) · ย่อย 4 รูป 1:1 หรือ 4:3 ขวา 4 col; mobile: สไลด์ 4:3 |
| รูปห้องในรายการห้อง | 4:3 กว้าง 240 (desktop) / เต็มกว้าง (mobile) |
| Hero Home | 21:9 (desktop) · 4:3 (mobile) |
| Avatar | 1:1 ขนาด 40 / 48 / 96 |

ทุกรูป: `object-cover` · `loading="lazy"` · พื้น skeleton ระหว่างโหลด · `@error` → fallback placeholder · ใส่ `alt` เสมอ

**Motion:**
- Duration: **150ms** (สี/hover) · **200ms** (กด/ขยาย) · **300ms** (Modal/Sheet) · easing `cubic-bezier(.2,.8,.2,1)` · animate เฉพาะ `transform`/`opacity`/สี
- มี **entrance animation ได้ 1 จุด:** Home — Search capsule + แถวการ์ดแรก fade-up stagger 40ms (ครั้งเดียวตอนโหลด) · **ห้าม** fade-up ทุก Section / ทุกการ์ด
- Hover เฉพาะของที่กดได้: การ์ดโรงแรม = ยกเป็น e1 + รูป `scale-[1.03]` (300ms ภายใน overflow-hidden) · ปุ่ม = เปลี่ยนสีเข้ม 1 ขั้น
- Pulse/หมุนใช้เฉพาะ `verifying`, `reviewing`, countdown ใกล้หมด
- เคารพ `prefers-reduced-motion` (ปิด transform + pulse)

## 6. Component Specs

| Component | ขนาด / สัดส่วน / พฤติกรรม |
|---|---|
| **Button** | `lg` h-12 (48) px-8 (CTA หลัก) · `md` h-11 (44) px-6 (default) · `sm` h-9 (36) px-4 (เฉพาะตารางบน desktop; mobile ต้อง ≥44) · `rounded-full` · text 16/500 (sm 14) · icon 20 gap 8. Variants: `primary` (coral-600 / ตัวอักษรขาว) · `secondary` (indigo-600) · `outline` (ขอบ indigo-200, ตัวอักษร indigo-700) · `ghost` · `danger` (rose-600). States: hover เข้ม 1 ขั้น · focus-visible `ring-2 ring-indigo-500 ring-offset-2` · disabled `bg-slate-200 text-slate-500 cursor-not-allowed` (ไม่ใช้แค่ opacity) · loading = spinner แทนไอคอน **ความกว้างไม่เปลี่ยน** + disable |
| **Input / Select** | h-12 (48) · px-4 · `rounded-xl` · border `line` · label อยู่ **บน** ช่อง 14/500 gap 8 · helper/error 14 gap 8 ใต้ช่อง · focus `border-indigo-600 ring-2 ring-indigo-100` · error `border-rose-500` + ไอคอน + ข้อความ rose-700 · placeholder `slate-500` · Textarea min-h 120 |
| **StatusBadge** | h-7 (28) px-3 · text 14/500 · ไอคอน 16 · pill · `sm` h-6 text 12 · สีตาม §4.1 |
| **StatusBanner** | พื้น `{family}-50` + ring `{family}-200` · `rounded-2xl` · p-16/24 · ไอคอน 24 ในวงกลม 40 · ชื่อสถานะ h3 + คำอธิบาย small + (ปุ่ม action ชิดขวา, mobile ต่อท้ายเต็มกว้าง) |
| **StatusStepper** | desktop แนวนอน / mobile แนวตั้ง · node วงกลม 32 · เส้นเชื่อม 2px · done = emerald-600 + ✓ · current = indigo-600 + ring 4 (pulse เฉพาะสถานะกำลังประมวลผล) · upcoming = slate-200 · ขั้น "ยกเลิก" = rose แตกแขนง |
| **Card** | `rounded-2xl` bg-white border-line · padding 16/24 · การ์ดที่กดได้ใช้ hover e1 + `cursor-pointer` + focus ring |
| **HotelCard** | รูป 4:3 ด้านบน · padding 16 · ชื่อ h3 (1 บรรทัด truncate) · ทำเล small ink-muted + ไอคอน MapPin 16 · แถวล่าง: คะแนน ★ (amber-500) ซ้าย / ราคา (ราคาเดิมขีดฆ่า ink-muted + ราคาใหม่ Prompt 600 20px) ขวา · ป้ายลดราคา `-10%` มุมบนซ้ายของรูป (coral-500 + ink) |
| **Modal** | ความกว้าง `max-w-md` (448, ฟอร์ม) / `max-w-lg` (512, ชำระเงิน) · `rounded-3xl` · p-24 · header h3 + ปุ่มปิด 44×44 · footer ปุ่มชิดขวา gap 12 · backdrop `bg-ink/40 backdrop-blur-sm` · ปิดด้วย Esc/คลิกนอก · focus trap · **mobile = Bottom sheet** เต็มกว้าง มุมบน 24 |
| **Toast** | กว้าง 360 (mobile: เต็มกว้าง − 32) · บนขวา (mobile บนกลาง) · e2 · ไอคอนตาม type · หายเองใน 4 วิ · `role="status"` |
| **Tabs** | segmented pill h-10 · ตัวที่เลือก = พื้น indigo-600 ตัวอักษรขาว (หรือขาวบนพื้น slate-100) |
| **Table** | row h-14 (56) · cell px-16 · header พื้น `canvas` text 14/500 ink-muted · hover row `bg-slate-50` · **mobile แปลงเป็นการ์ดซ้อนกัน** (ห้ามเลื่อนแนวนอน) |
| **Navbar** | sticky h-16 (64) desktop / h-14 (56) mobile · glass + e2 · โลโก้ซ้าย · เมนูตาม Role ขวา · mobile = hamburger → drawer |
| **Sidebar (Manager/Admin)** | กว้าง 256 · พื้นขาว border-r line · รายการ h-11 `rounded-xl` · เมนูที่เลือก `bg-indigo-50 text-indigo-700` · mobile = drawer |
| **Footer** | พื้น `ink` ตัวอักษรขาว/`slate-300` · py-48 · desktop 4 คอลัมน์ (วิชา · สมาชิก 5 คน · ติดต่อ · ลิขสิทธิ์) / mobile 1 คอลัมน์ · text 14 |
| **Countdown** | Prompt 600 20/28 `tabular-nums` · > 2 ชม. = indigo-700 · ≤ 2 ชม. = amber-700 · ≤ 15 นาที = rose-700 + pulse |
| **Skeleton / EmptyState** | ดู §8 |

## 7. Screen Layout Rules (Pattern จาก Trip.com / Traveloka)

- **Search capsule (Home):** แถบเดียวสูง 64 (desktop) แบ่ง 3 ช่อง: ที่พัก/ทำเล · วันเข้าพัก–ออก · ผู้เข้าพัก + ปุ่ม "ค้นหา" (coral) ที่ปลายขวา · mobile = ซ้อน 1 คอลัมน์ในการ์ด
- **แถวข้อเสนอ:** เลื่อนแนวนอน (snap) บน mobile, Bento 12-col บน desktop
- **รายการห้อง (Hotel Detail):** 1 ห้อง = 1 แถว: รูป 4:3 ซ้าย (240) · ข้อมูล (ชื่อ, ผู้เข้าพัก, สิ่งอำนวยความสะดวก) กลาง · ราคา + ปุ่ม "จองห้องพัก" ขวา (mobile ซ้อนลง)
- **สรุปราคา:** Detail/Booking desktop = คอลัมน์ขวา sticky `top-24` (4 col) · mobile = แถบล่างติดจอ (glass) พร้อมราคา + CTA
- **Dashboard:** แถวสถิติ 4 ใบ (`3+3+3+3`; tablet 2×2; mobile 1) → กราฟ `8+4` → ตาราง เต็มกว้าง
- **หน้า Manager/Admin:** Sidebar + Content · หัวหน้า h1 + ปุ่ม action หลักชิดขวาบน

## 8. States ที่ต้องมีทุกหน้าที่ดึงข้อมูล

| State | สเปก |
|---|---|
| Loading | **Skeleton** ทรงเดียวกับเนื้อหาจริง (ไม่ใช่ spinner กลางจอ) · `animate-pulse` พื้น slate-100/200 |
| Empty | ไอคอน 48 (slate-400) + บรรทัดอธิบาย + **ปุ่ม 1 ปุ่ม** บอกทางไปต่อ เช่น "ยังไม่มีการจอง" → ปุ่ม "ค้นหาที่พัก" |
| Error | บอกว่าอะไรผิด + แก้ยังไง + ปุ่ม "ลองอีกครั้ง" (ไม่ขอโทษ ไม่คลุมเครือ) เช่น "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว" |
| Success | Toast หรือ Modal สรุปผล ใช้คำเดียวกับปุ่ม: ปุ่ม "จองห้องพัก" → toast "จองห้องพักแล้ว" |
| Disabled action | ซ่อนหรือ disable พร้อมเหตุผล (tooltip/ข้อความเล็ก) เช่น "เฉพาะบัญชีผู้ใช้" |

**Copy:** ภาษาไทยสุภาพกระชับ ใช้กริยาชัดเจน ("บันทึกการเปลี่ยนแปลง" ไม่ใช่ "ส่ง") · ชื่อ action เดิมตลอด flow · ไม่ใช้ Lorem ipsum / ชื่อสมมติแปลก ๆ ในหน้าที่ผู้ใช้เห็น ใช้ข้อมูลสมจริง (บางแสน, พัทยา, ศรีราชา, เกาะล้าน, สัตหีบ · ราคา ฿800–฿6,500 · สิ่งอำนวยความสะดวกจริง เช่น สระว่ายน้ำ, อาหารเช้า, ที่จอดรถ)

## 9. Data Formatting
- เงิน: `new Intl.NumberFormat('th-TH',{style:'currency',currency:'THB',maximumFractionDigits:0})` → `฿1,500`
- วันที่แสดง: `toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'})` (พ.ศ.) · เก็บใน DB เป็น ISO เสมอ
- จำนวนคืน: "2 คืน" · ผู้เข้าพัก: "2 ท่าน" · คะแนน: `4.5` 1 ทศนิยม
- ราคาลด: ราคาเดิมขีดฆ่า + ราคาใหม่ + ป้าย `-10%`

## 10. Wireframes (ใช้เมื่อไม่มี Figma / เพื่อยืนยันสัดส่วน)

```
HOME (desktop 1200)
┌ Navbar 64 (glass) ─────────────────────────────────────────┐
├ Hero 21:9 — รูปชลบุรี + overlay ดำ 50% ────────────────────┤
│   h-display (ซ้าย)   ┌ Search capsule 64 (glass, e2) ──┐    │
│                      │ ทำเล │ วันที่ │ ผู้เข้าพัก │ [ค้นหา]│    │
├ h2 "ข้อเสนอพิเศษ"  ──────────────────────────────────────  ┤
│ [ tile 8: ข้อเสนอใหญ่ ] [ tile 4 ]   ← Bento 8+4            │
├ h2 "ที่พักแนะนำในชลบุรี"  ─ chips กรองทำเล                  ┤
│ [Card][Card][Card][Card]   ← 4 คอลัมน์ (tablet 2, mobile 1) │
├ h2 "รีวิวจากผู้เข้าพัก" ─ [รีวิว][รีวิว][รีวิว] (3 col) ────┤
└ Footer ────────────────────────────────────────────────────┘

HOTEL DETAIL                         BOOKING FLOW
┌ h1 ชื่อ + StatusBadge + ★ ┐        ┌ Stepper (รอชำระ→ยืนยัน→เสร็จสิ้น) ┐
│ Gallery 8col │ 4 รูปย่อ 4col│       │ ซ้าย 8 col          │ ขวา 4 col sticky │
├ 8 col ───────┬ 4 col sticky ┤       │ 1 ห้อง/วัน/ผู้เข้าพัก │ สรุปราคา          │
│ สิ่งอำนวยฯ    │ ราคา+[จอง]   │       │ 2 วิธีชำระ (QR/โอน)  │ Countdown 12 ชม.  │
│ รายการห้อง(แถว)│             │       │ 3 [ชำระเงิน] (coral) │ Payment badge     │
│ รีวิว         │             │       └──────────────────────┴──────────────────┘

USER PROFILE (07)                    MANAGER DASHBOARD (08)
┌ Avatar 96 + ชื่อ + [บันทึกชื่อเล่น]┐  ┌Sidebar┬ h1 + [เพิ่มโรงแรม] ─────────────┐
├ Tabs: ข้อมูล │ ประวัติการจอง ─────┤  │ 256   │ Stat ×4 (3+3+3+3)                │
│ การ์ดการจอง: รูป 1:1 80 │ ชื่อ/วันที่ │  │       │ รายได้กราฟ 8 │ ใบขอคืนเงิน 4     │
│ Booking+Payment badge │ ราคา │[action]│  │       │ โรงแรมของฉัน: StatusBanner ต่อโรงแรม │
│ ใต้การ์ด: StatusStepper (ย่อ)        │  │       │ ห้อง: ตารางห้อง + badge + ปุ่ม      │

ADMIN DASHBOARD (11)                 AUTH (01)
┌Sidebar┬ Stat ×4 (3+3+3+3)         ┐  ┌ ซ้าย 6 col: รูป/ข้อความแบรนด์ │ ขวา 6 col: การ์ดฟอร์ม max-w-[440] ┐
│       │ กราฟ 8 (Tabs 24h/เดือน/ปี) │  │ (mobile: ซ่อนซ้าย แสดงเฉพาะฟอร์ม)                            │
│       │ │ โรงแรมตามสถานะ 4         │  │ ฟอร์ม: Tabs เข้าสู่ระบบ/สมัคร · Google · ปุ่ม Guest (outline)  │
```

## 11. Tailwind Setup (Tailwind v4 — `src/style.css`; ถ้าเป็น v3 ให้ย้ายค่าไป `theme.extend`)

```css
@import "tailwindcss";
@theme {
  --font-display: "Prompt", ui-sans-serif, system-ui, sans-serif;
  --font-sans: "IBM Plex Sans Thai", ui-sans-serif, system-ui, sans-serif;
  --color-canvas: #F7F8FB;
  --color-ink: #1B1F3B;
  --color-ink-muted: #5B6078;
  --color-line: #E4E7F0;
  --color-coral-50: #FFF1EE;
  --color-coral-500: #FF6B57;
  --color-coral-600: #CF3F2A;
  --color-coral-700: #A8321F;
  --shadow-e1: 0 2px 8px rgb(27 31 59 / .06);
  --shadow-e2: 0 8px 24px rgb(27 31 59 / .10);
  --shadow-e3: 0 24px 48px rgb(27 31 59 / .18);
  --ease-out-soft: cubic-bezier(.2, .8, .2, 1);
}
```
`main.js`: `import '@fontsource/prompt/500.css'; import '@fontsource/prompt/600.css'; import '@fontsource/ibm-plex-sans-thai/400.css'; import '@fontsource/ibm-plex-sans-thai/500.css'`
ไฟล์ CSS นี้เป็นข้อยกเว้นเดียวของกฎ "ไม่สร้าง .css" (จำเป็นสำหรับ Tailwind)

## 12. Accessibility & Responsive (ขั้นต่ำ)
- คอนทราสต์ตาม §4 · Focus ring มองเห็นทุกองค์ประกอบที่โต้ตอบได้ · พื้นที่แตะ ≥ **44×44px** · ทุก input มี `<label>` · Modal มี `role="dialog"` `aria-modal` + focus trap + Esc
- Status ไม่ใช้สีอย่างเดียว (ไอคอน + ข้อความ) · ใช้ `button`/`a` จริง ไม่ใช้ `div @click`
- ไม่มี horizontal scroll ของทั้งหน้าที่ 375px · ตารางแปลงเป็นการ์ดบน mobile

## 13. Anti-"AI Look" Checklist (ห้ามทำ)
- ❌ การ์ดหน้าตาเหมือนกันหมด + shadow เทาเท่ากันทุกใบ + radius เดียวทั้งหน้า → ใช้ลำดับชั้น §5
- ❌ Gradient เป็นของตกแต่ง, พื้นหลังม่วง-ฟ้า, blob/orb ลอย
- ❌ Eyebrow ตัวพิมพ์ใหญ่เหนือหัวข้อ, เลข `01 / 02 / 03` ถ้าเนื้อหาไม่ใช่ลำดับจริง, ลูกศร `→` ต่อท้ายทุกปุ่ม, จุดกลาง `A · B · C` คั่นข้อมูลไปทั่ว
- ❌ จัดกึ่งกลางทุกอย่าง (กึ่งกลางเฉพาะ Hero หัวข้อสั้น และ Empty state) · เนื้อหาหลักชิดซ้าย
- ❌ Fade-up ทุก Section / hover ลอยทุกการ์ด
- ❌ Emoji เป็นไอคอน, ข้อความ Lorem, ชื่อ "John Doe" ในหน้าที่ผู้ใช้เห็น
- ❌ ปุ่มสีสดหลายปุ่มแข่งกันในหน้าเดียว (หลัก 1 ปุ่ม, ที่เหลือ outline/ghost)

### Quality Gate (ทำก่อนปิดแต่ละ Phase ใน TODO.md)
- [ ] เช็คที่ **375 / 768 / 1280** ไม่มีส่วนล้น/ซ้อน
- [ ] ทุกค่า spacing/ขนาด อยู่ใน scale §2–§3 (ไม่มี arbitrary value ยกเว้นตาม §11)
- [ ] ปุ่มหลัก ≤ 1 ปุ่ม/หน้าจอ · ทุกปุ่ม ≥ 44px บน mobile
- [ ] ทุกที่ที่มี status ใช้ StatusBadge/Banner/Stepper ตาม §4.1
- [ ] ทุกหน้าที่ดึงข้อมูลมี Loading / Empty / Error ตาม §8
- [ ] Tab keyboard ไล่ได้ครบ มี focus ring
