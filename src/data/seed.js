// src/data/seed.js — Run on first load (when adoga_meta.seeded is not true)
import { set, get } from '../utils/storage.js'
import { HOTEL_IMAGES } from '../constants/images.js'
import { addHours, addDays } from '../utils/date.js'

const VERSION = 1

function isoNow() { return new Date().toISOString() }
function isoH(n)  { return addHours(n).toISOString() }
function isoD(n)  { return addDays(n).toISOString() }

export function runSeed(force = false) {
  const meta = get('adoga_meta')
  if (!force && meta?.seeded && meta?.version === VERSION) return

  // ── Users ────────────────────────────────────────────────
  const users = [
    { id: 'U001', email: 'user@gmail.com',    password: 'Adoga1234', role: 'user',    firstName: 'John',    lastName: 'Doe',     nickname: 'Johnny', provider: 'local', createdAt: isoD(-30) },
    { id: 'U002', email: 'mary@gmail.com',    password: 'Adoga1234', role: 'user',    firstName: 'Mary',    lastName: 'Smith',   nickname: 'Mary',   provider: 'local', createdAt: isoD(-25) },
    { id: 'M001', email: 'hotel@domain.com',  password: 'Adoga1234', role: 'manager', firstName: 'Somchai', lastName: 'Rakthai', nickname: 'Chai',   provider: 'local', createdAt: isoD(-60) },
    { id: 'M002', email: 'hotel2@domain.com', password: 'Adoga1234', role: 'manager', firstName: 'Suda',    lastName: 'Meesuk',  nickname: 'Suda',   provider: 'local', createdAt: isoD(-55) },
    { id: 'A001', email: 'admin@adoga.com',   password: 'Adoga1234', role: 'admin',   firstName: 'Admin',   lastName: 'Adoga',   nickname: 'Admin',  provider: 'local', createdAt: isoD(-90) },
  ]

  // ── Hotels ───────────────────────────────────────────────
  const mkUnit = (no, status) => ({ no, status, statusHistory: [] })
  const mkRoom = (id, type, price, capacity, units) => ({ id, type, price, capacity, units })

  const hotels = [
    {
      id: 'H001', managerId: 'M001', name: 'Chonburi Sea View', location: 'บางแสน, ชลบุรี',
      description: 'รีสอร์ทติดทะเลบางแสน วิวทะเลสวยงาม บรรยากาศสงบ เหมาะสำหรับการพักผ่อน',
      pricePerNight: 1500, discount: 10, status: 'approved', rejectReason: null,
      images: HOTEL_IMAGES.H001, amenities: ['สระว่ายน้ำ', 'WiFi ฟรี', 'อาหารเช้า', 'ที่จอดรถ'], rating: 4.5,
      rooms: [
        mkRoom('H001-R1', 'Standard Sea View', 1500, 2, [mkUnit('101','available'), mkUnit('102','booked'), mkUnit('103','maintenance')]),
        mkRoom('H001-R2', 'Family Suite', 2800, 4, [mkUnit('201','available'), mkUnit('202','available')]),
      ],
    },
    {
      id: 'H002', managerId: 'M001', name: 'Pattaya Beach Resort', location: 'พัทยา, ชลบุรี',
      description: 'รีสอร์ทพัทยาหาดสวย ใกล้ Walking Street มีสิ่งอำนวยความสะดวกครบครัน',
      pricePerNight: 2200, discount: 15, status: 'approved', rejectReason: null,
      images: HOTEL_IMAGES.H002, amenities: ['สระว่ายน้ำ', 'WiFi ฟรี', 'สปา', 'ฟิตเนส', 'ที่จอดรถ'], rating: 4.3,
      rooms: [
        mkRoom('H002-R1', 'Deluxe Pool View', 2200, 2, [mkUnit('301','available'), mkUnit('302','booked')]),
        mkRoom('H002-R2', 'Premium Suite', 4500, 4, [mkUnit('401','available'), mkUnit('402','booked')]),
      ],
    },
    {
      id: 'H003', managerId: 'M002', name: 'Sriracha Harbor Hotel', location: 'ศรีราชา, ชลบุรี',
      description: 'โรงแรมริมอ่าวศรีราชา บรรยากาศเมืองท่าน่ารัก อาหารทะเลสด',
      pricePerNight: 1200, discount: 0, status: 'approved', rejectReason: null,
      images: HOTEL_IMAGES.H003, amenities: ['WiFi ฟรี', 'อาหารเช้า', 'ร้านอาหาร'], rating: 4.1,
      rooms: [
        mkRoom('H003-R1', 'Superior Harbor View', 1200, 2, [mkUnit('501','available'), mkUnit('502','booked')]),
        mkRoom('H003-R2', 'Deluxe Room', 1800, 2, [mkUnit('601','available'), mkUnit('602','available')]),
      ],
    },
    {
      id: 'H004', managerId: 'M002', name: 'Koh Larn Bungalow', location: 'เกาะล้าน, ชลบุรี',
      description: 'บังกะโลบนเกาะล้าน หาดทรายขาว น้ำทะเลใส เหมาะสำหรับฮันนีมูน',
      pricePerNight: 3500, discount: 0, status: 'pending', rejectReason: null,
      images: HOTEL_IMAGES.H004, amenities: ['หาดส่วนตัว', 'WiFi ฟรี', 'กิจกรรมดำน้ำ'], rating: 4.7,
      rooms: [
        mkRoom('H004-R1', 'Beach Bungalow', 3500, 2, [mkUnit('701','available'), mkUnit('702','available')]),
        mkRoom('H004-R2', 'Honeymoon Suite', 5500, 2, [mkUnit('801','available')]),
      ],
    },
    {
      id: 'H005', managerId: 'M002', name: 'Sattahip Retreat', location: 'สัตหีบ, ชลบุรี',
      description: 'รีทรีตสงบย่านสัตหีบ ห่างไกลความวุ่นวาย บรรยากาศธรรมชาติ',
      pricePerNight: 1800, discount: 0, status: 'rejected', rejectReason: 'รูปภาพไม่ชัดเจน กรุณาอัปโหลดใหม่',
      images: HOTEL_IMAGES.H005, amenities: ['WiFi ฟรี', 'สวนสวย', 'ที่จอดรถ'], rating: 3.9,
      rooms: [
        mkRoom('H005-R1', 'Garden View Room', 1800, 2, [mkUnit('901','available'), mkUnit('902','available')]),
      ],
    },
    {
      id: 'H006', managerId: 'M001', name: 'Bangsaen Boutique', location: 'บางแสน, ชลบุรี',
      description: 'บูติกโฮเทลสไตล์วินเทจ ใจกลางบางแสน ใกล้ตลาดอาหารทะเล',
      pricePerNight: 900, discount: 0, status: 'suspended', rejectReason: null,
      images: HOTEL_IMAGES.H006, amenities: ['WiFi ฟรี', 'อาหารเช้า'], rating: 3.8,
      rooms: [
        mkRoom('H006-R1', 'Classic Room', 900, 2, [mkUnit('1001','available'), mkUnit('1002','available')]),
      ],
    },
  ]

  // ── Bookings ──────────────────────────────────────────────
  const bookings = [
    { id:'B001', userId:'U001', hotelId:'H001', roomId:'H001-R1', roomNo:'102', guests:2, checkIn: isoD(22), checkOut: isoD(24), nights:2, totalPrice:2700, status:'pending_payment', cancelReason:null, paymentMethod:'QR', paymentStatus:'waiting', createdAt: isoH(-1), expiresAt: isoH(11), checkedInAt:null, checkedOutAt:null },
    { id:'B002', userId:'U001', hotelId:'H002', roomId:'H002-R1', roomNo:'302', guests:2, checkIn: isoD(-5), checkOut: isoD(-3), nights:2, totalPrice:3740, status:'confirmed', cancelReason:null, paymentMethod:'QR', paymentStatus:'success', createdAt: isoD(-7), expiresAt: isoH(-155), checkedInAt:null, checkedOutAt:null },
    { id:'B003', userId:'U002', hotelId:'H001', roomId:'H001-R2', roomNo:'201', guests:3, checkIn: isoD(-2), checkOut: isoD(1),  nights:3, totalPrice:7560, status:'confirmed', cancelReason:null, paymentMethod:'BANK_TRANSFER', paymentStatus:'success', createdAt: isoD(-4), expiresAt: isoH(-83), checkedInAt: isoD(-1), checkedOutAt:null },
    { id:'B004', userId:'U001', hotelId:'H001', roomId:'H001-R1', roomNo:'101', guests:2, checkIn: isoD(-8), checkOut: isoD(-6), nights:2, totalPrice:2700, status:'completed', cancelReason:null, paymentMethod:'QR', paymentStatus:'success', createdAt: isoD(-10), expiresAt: isoH(-228), checkedInAt: isoD(-8), checkedOutAt: isoD(-6) },
    { id:'B005', userId:'U002', hotelId:'H003', roomId:'H003-R1', roomNo:'501', guests:2, checkIn: isoD(5),  checkOut: isoD(7),  nights:2, totalPrice:2400, status:'cancelled', cancelReason:'expired', paymentMethod:null, paymentStatus:'waiting', createdAt: isoD(-2), expiresAt: isoD(-1), checkedInAt:null, checkedOutAt:null },
    { id:'B006', userId:'U002', hotelId:'H002', roomId:'H002-R1', roomNo:'301', guests:2, checkIn: isoD(-15), checkOut: isoD(-13), nights:2, totalPrice:3740, status:'cancelled', cancelReason:'refunded', paymentMethod:'QR', paymentStatus:'refunded', createdAt: isoD(-17), expiresAt: isoH(-385), checkedInAt:null, checkedOutAt:null },
    { id:'B007', userId:'U002', hotelId:'H003', roomId:'H003-R1', roomNo:'502', guests:2, checkIn: isoD(10), checkOut: isoD(12), nights:2, totalPrice:2400, status:'confirmed', cancelReason:null, paymentMethod:'BANK_TRANSFER', paymentStatus:'success', createdAt: isoD(-3), expiresAt: isoH(-59), checkedInAt:null, checkedOutAt:null },
    { id:'B008', userId:'U002', hotelId:'H001', roomId:'H001-R2', roomNo:'202', guests:2, checkIn: isoD(15), checkOut: isoD(17), nights:2, totalPrice:5040, status:'pending_payment', cancelReason:null, paymentMethod:'QR', paymentStatus:'failed', createdAt: isoH(-7), expiresAt: isoH(5), checkedInAt:null, checkedOutAt:null },
  ]

  // ── Refunds ───────────────────────────────────────────────
  const refunds = [
    { id:'RF001', bookingId:'B002', userId:'U001', hotelId:'H002', amount:3740, reason:'เปลี่ยนแผนการเดินทาง', status:'reviewing', rejectReason:null, createdAt: isoH(-2) },
    { id:'RF002', bookingId:'B006', userId:'U002', hotelId:'H002', amount:3740, reason:'ป่วย', status:'approved', rejectReason:null, createdAt: isoD(-5) },
    { id:'RF003', bookingId:'B007', userId:'U002', hotelId:'H003', amount:2400, reason:'ไม่ต้องการเข้าพักแล้ว', status:'rejected', rejectReason:'ไม่เข้าเงื่อนไขการคืนเงินภายใน 24 ชม.', createdAt: isoD(-3) },
  ]

  // ── Reviews ───────────────────────────────────────────────
  const reviews = [
    { id:'R001', hotelId:'H001', userId:'U001', rating:5, comment:'วิวสวยมากครับ ทีมงานดูแลดีมาก', date: isoD(-5) },
    { id:'R002', hotelId:'H001', userId:'U002', rating:4, comment:'ห้องสะอาด พนักงานน่ารัก', date: isoD(-10) },
    { id:'R003', hotelId:'H002', userId:'U002', rating:5, comment:'ใกล้หาด เดินสบาย อาหารเช้าอร่อย', date: isoD(-12) },
    { id:'R004', hotelId:'H002', userId:'U001', rating:4, comment:'สระว่ายน้ำสวยมาก ราคาคุ้มค่า', date: isoD(-8) },
    { id:'R005', hotelId:'H003', userId:'U001', rating:4, comment:'อาหารทะเลสดมาก บรรยากาศดี', date: isoD(-6) },
    { id:'R006', hotelId:'H003', userId:'U002', rating:3, comment:'ทำเลดี แต่ห้องเล็กนิดหน่อย', date: isoD(-9) },
  ]

  // ── Messages ──────────────────────────────────────────────
  const messages = [
    { id:'MSG001', hotelId:'H001', userId:'U001', sender:'user',    text:'สอบถามเรื่อง Check-in ก่อนเวลาได้ไหมครับ', sentAt: isoH(-3) },
    { id:'MSG002', hotelId:'H001', userId:'U001', sender:'manager', text:'ได้ครับ เริ่มตั้งแต่ 12:00 น.', sentAt: isoH(-2) },
    { id:'MSG003', hotelId:'H002', userId:'U001', sender:'user',    text:'มีที่จอดรถไหมครับ', sentAt: isoH(-5) },
    { id:'MSG004', hotelId:'H002', userId:'U001', sender:'manager', text:'มีครับ ที่จอดรถฟรี 1 คัน/ห้อง', sentAt: isoH(-4) },
  ]

  // ── Settings & Filler Bookings ────────────────────────────
  const settings = { enableRefund: false }

  // Filler bookings for charts (~40 items, completed, spread over 12 months)
  const fillers = []
  const fillerHotels = ['H001','H002','H003']
  for (let i = 0; i < 40; i++) {
    const daysBack = Math.floor(Math.random() * 365)
    fillers.push({
      id: `B1${String(i).padStart(2,'0')}`,
      userId: i % 2 === 0 ? 'U001' : 'U002',
      hotelId: fillerHotels[i % 3],
      roomId: `${fillerHotels[i % 3]}-R1`,
      roomNo: '999',
      guests: 2,
      checkIn: isoD(-daysBack - 3),
      checkOut: isoD(-daysBack - 1),
      nights: 2,
      totalPrice: [2700, 3740, 2400, 5040][i % 4],
      status: 'completed',
      cancelReason: null,
      paymentMethod: 'QR',
      paymentStatus: 'success',
      createdAt: isoD(-daysBack - 5),
      expiresAt: isoD(-daysBack - 4),
      checkedInAt: isoD(-daysBack - 3),
      checkedOutAt: isoD(-daysBack - 1),
    })
  }

  // ── Persist ───────────────────────────────────────────────
  set('adoga_users', users)
  set('adoga_hotels', hotels)
  set('adoga_bookings', [...bookings, ...fillers])
  set('adoga_refunds', refunds)
  set('adoga_reviews', reviews)
  set('adoga_messages', messages)
  set('adoga_settings', settings)
  set('adoga_current_session', null)
  set('adoga_meta', { seeded: true, version: VERSION })
}
