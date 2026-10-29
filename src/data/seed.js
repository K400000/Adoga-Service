// src/data/seed.js — Run on first load or version bump
import { set, get } from '../utils/storage.js'
import { HOTEL_IMAGES } from '../constants/images.js'
import { addHours, addDays } from '../utils/date.js'
import { db } from '../stores/db.js'

const VERSION = 10

function isoNow() { return new Date().toISOString() }
function isoH(n)  { return addHours(n).toISOString() }
function isoD(n)  { return addDays(n).toISOString() }

export function runSeed(force = false) {
  const meta = get('adoga_meta')
  if (!force && meta?.seeded && meta?.version === VERSION) return

  const currentSession = get('adoga_current_session') || null

  // ── Users ────────────────────────────────────────────────
  // NOTE: Manager ↔ Hotel = 1:1 (ผู้จัดการ 1 คนดูแลโรงแรมได้เพียง 1 แห่ง)
  // หากมีหลายอาคาร/หลายทำเล ให้แยกเป็น "สาขา" ภายใต้โรงแรมเดียวกัน ไม่ใช่สร้างโรงแรมใหม่
  const users = [
    { id: 'U001', email: 'user@gmail.com',      password: 'Adoga1234', role: 'user',    firstName: 'John',     lastName: 'Doe',      nickname: 'Johnny',  phone: '081-234-5678', birthdate: '1996-05-15', provider: 'local', createdAt: isoD(-30) },
    { id: 'U002', email: 'mary@gmail.com',      password: 'Adoga1234', role: 'user',    firstName: 'Mary',     lastName: 'Smith',    nickname: 'Mary',    phone: '089-876-5432', birthdate: '1998-11-20', provider: 'local', createdAt: isoD(-25) },
    { id: 'M001', email: 'manager@gmail.com',   password: 'Adoga1234', role: 'manager', firstName: 'Somchai',  lastName: 'Rakthai',  nickname: 'Chai',    phone: '082-111-2233', birthdate: '1988-03-10', provider: 'local', createdAt: isoD(-60) }, // H002
    { id: 'M002', email: 'manager2@gmail.com',  password: 'Adoga1234', role: 'manager', firstName: 'Suda',     lastName: 'Meesuk',   nickname: 'Suda',    phone: '083-444-5566', birthdate: '1990-07-25', provider: 'local', createdAt: isoD(-55) }, // H003
    { id: 'M003', email: 'manager3@gmail.com',  password: 'Adoga1234', role: 'manager', firstName: 'Anan',     lastName: 'Chaiyo',   nickname: 'Anan',    phone: '084-555-6677', birthdate: '1985-02-14', provider: 'local', createdAt: isoD(-54) }, // H001
    { id: 'M004', email: 'manager4@gmail.com',  password: 'Adoga1234', role: 'manager', firstName: 'Preecha',  lastName: 'Kittisak', nickname: 'Preecha', phone: '085-666-7788', birthdate: '1987-09-08', provider: 'local', createdAt: isoD(-53) }, // H004
    { id: 'M005', email: 'manager5@gmail.com',  password: 'Adoga1234', role: 'manager', firstName: 'Kanokwan', lastName: 'Srisuk',   nickname: 'Kanok',   phone: '086-777-8899', birthdate: '1991-06-19', provider: 'local', createdAt: isoD(-52) }, // H005
    { id: 'M006', email: 'manager6@gmail.com',  password: 'Adoga1234', role: 'manager', firstName: 'Nattapong',lastName: 'Boonmee',  nickname: 'Nat',     phone: '087-888-9900', birthdate: '1989-12-03', provider: 'local', createdAt: isoD(-51) }, // H006
    { id: 'M007', email: 'manager7@gmail.com',  password: 'Adoga1234', role: 'manager', firstName: 'Waraporn', lastName: 'Thongchai',nickname: 'Wara',    phone: '088-999-0011', birthdate: '1992-04-27', provider: 'local', createdAt: isoD(-50) }, // H007
    { id: 'M008', email: 'manager8@gmail.com',  password: 'Adoga1234', role: 'manager', firstName: 'Siriporn', lastName: 'Kaewkla',  nickname: 'Siri',    phone: '089-111-2234', birthdate: '1986-08-16', provider: 'local', createdAt: isoD(-49) }, // H008
    { id: 'M009', email: 'manager9@gmail.com',  password: 'Adoga1234', role: 'manager', firstName: 'Thanawat', lastName: 'Phromma',  nickname: 'Than',    phone: '081-222-3345', birthdate: '1993-01-22', provider: 'local', createdAt: isoD(-48) }, // H009
    { id: 'M010', email: 'manager10@gmail.com', password: 'Adoga1234', role: 'manager', firstName: 'Chutima',  lastName: 'Rattanakul',nickname:'Chutima', phone: '082-333-4456', birthdate: '1990-11-11', provider: 'local', createdAt: isoD(-47) }, // H010
    { id: 'M011', email: 'manager11@gmail.com', password: 'Adoga1234', role: 'manager', firstName: 'Kittipong',lastName: 'Saelim',   nickname: 'Kitt',    phone: '083-444-5567', birthdate: '1984-05-05', provider: 'local', createdAt: isoD(-46) }, // H011
    { id: 'M012', email: 'manager12@gmail.com', password: 'Adoga1234', role: 'manager', firstName: 'Nutcha',   lastName: 'Wongkham', nickname: 'Nutcha',  phone: '084-555-6678', birthdate: '1995-03-30', provider: 'local', createdAt: isoD(-45) }, // H012
    { id: 'M013', email: 'manager13@gmail.com', password: 'Adoga1234', role: 'manager', firstName: 'Phumin',   lastName: 'Chanthara',nickname: 'Phumin',  phone: '085-666-7789', birthdate: '1988-10-09', provider: 'local', createdAt: isoD(-44) }, // H013
    { id: 'M014', email: 'manager14@gmail.com', password: 'Adoga1234', role: 'manager', firstName: 'Ratchanee',lastName: 'Panyarat', nickname: 'Rat',     phone: '086-777-8890', birthdate: '1991-07-07', provider: 'local', createdAt: isoD(-43) }, // H014
    { id: 'M015', email: 'manager15@gmail.com', password: 'Adoga1234', role: 'manager', firstName: 'Sarawut',  lastName: 'Thepsiri', nickname: 'Sarawut', phone: '087-888-9901', birthdate: '1986-12-25', provider: 'local', createdAt: isoD(-42) }, // H015
    { id: 'A001', email: 'admin@gmail.com',     password: 'Adoga1234', role: 'admin',   firstName: 'Admin',    lastName: 'Adoga',    nickname: 'Admin',   phone: '080-000-0000', birthdate: '1992-01-01', provider: 'local', createdAt: isoD(-90) },
  ]

  // ── Hotels ───────────────────────────────────────────────
  const mkUnit = (no, status) => ({ no, status, statusHistory: [] })
  const mkRoom = (id, type, price, capacity, units) => ({ id, type, price, capacity, units })

  const hotels = [
    {
      id: 'H001', managerId: 'M003', name: 'Chonburi Sea View', location: 'บางแสน, ชลบุรี',
      description: 'รีสอร์ทติดทะเลบางแสน วิวทะเลสวยงาม บรรยากาศสงบ เหมาะสำหรับการพักผ่อนของครอบครัวและคู่รัก',
      pricePerNight: 1500, discount: 10, status: 'approved', rejectReason: null,
      images: HOTEL_IMAGES.H001, amenities: ['สระว่ายน้ำ', 'WiFi ฟรี', 'อาหารเช้า', 'ที่จอดรถ'], rating: 4.6,
      rooms: [
        mkRoom('H001-R1', 'Standard Sea View', 1500, 2, [mkUnit('101','available'), mkUnit('102','booked'), mkUnit('103','maintenance'), mkUnit('104','available'), mkUnit('105','available')]),
        mkRoom('H001-R2', 'Family Ocean Suite', 2800, 4, [mkUnit('201','available'), mkUnit('202','available'), mkUnit('203','booked'), mkUnit('204','available')]),
        mkRoom('H001-R3', 'Deluxe Pool Access', 2100, 2, [mkUnit('106','available'), mkUnit('107','available'), mkUnit('108','booked')]),
        mkRoom('H001-R4', 'Superior Beachfront Studio', 1850, 2, [mkUnit('205','available'), mkUnit('206','available')]),
        mkRoom('H001-R5', 'Executive Panorama King', 3200, 3, [mkUnit('301','available'), mkUnit('302','available')]),
        mkRoom('H001-R6', 'Presidential Seaside Villa', 5500, 6, [mkUnit('401','available'), mkUnit('402','available')]),
      ],
    },
    {
      id: 'H002', managerId: 'M001', name: 'Pattaya Beach Resort & Spa', location: 'พัทยา, ชลบุรี',
      description: 'รีสอร์ทพัทยาหาดสวย ใกล้ Walking Street และแหล่งช้อปปิ้ง พร้อมสปาและสิ่งอำนวยความสะดวกครบครัน',
      pricePerNight: 2200, discount: 15, status: 'approved', rejectReason: null,
      images: HOTEL_IMAGES.H002, amenities: ['สระว่ายน้ำ', 'WiFi ฟรี', 'สปา', 'ฟิตเนส', 'ที่จอดรถ'], rating: 4.4,
      rooms: [
        mkRoom('H002-R1', 'Deluxe Pool View', 2200, 2, [mkUnit('301','available'), mkUnit('302','booked'), mkUnit('303','available'), mkUnit('304','available')]),
        mkRoom('H002-R2', 'Premium Oceanfront Suite', 4500, 4, [mkUnit('401','available'), mkUnit('402','booked'), mkUnit('403','available')]),
        mkRoom('H002-R3', 'Superior City View', 1800, 2, [mkUnit('201','available'), mkUnit('202','available'), mkUnit('203','available')]),
        mkRoom('H002-R4', 'Executive Club Room', 3100, 2, [mkUnit('501','available'), mkUnit('502','available')]),
        mkRoom('H002-R5', 'Spa Suite with Jacuzzi', 3800, 2, [mkUnit('601','available'), mkUnit('602','booked')]),
        mkRoom('H002-R6', 'Family Penthouse Suite', 6800, 6, [mkUnit('701','available')]),
      ],
    },
    {
      id: 'H003', managerId: 'M002', name: 'Chiang Mai Mountain Haven', location: 'แม่ริม, เชียงใหม่',
      description: 'รีสอร์ทสไตล์ล้านนากลางหุบเขาแม่ริม สัมผัสหมอกยามเช้า อากาศเย็นสบายตลอดปี พร้อมออนเซ็นส่วนตัว',
      pricePerNight: 2800, discount: 20, status: 'approved', rejectReason: null,
      images: HOTEL_IMAGES.H003, amenities: ['สระว่ายน้ำน้ำอุ่น', 'WiFi ฟรี', 'สปาและออนเซ็น', 'อาหารเช้าออร์แกนิก', 'ที่จอดรถ'], rating: 4.9,
      rooms: [
        mkRoom('H003-R1', 'Lanna Mountain Suite', 2800, 2, [mkUnit('501','available'), mkUnit('502','booked'), mkUnit('503','available')]),
        mkRoom('H003-R2', 'Villa Valley View', 4800, 4, [mkUnit('601','available'), mkUnit('602','available'), mkUnit('603','available')]),
        mkRoom('H003-R3', 'Onsen Terrace Cottage', 3500, 2, [mkUnit('504','available'), mkUnit('505','available')]),
        mkRoom('H003-R4', 'Superior Pine Forest', 2200, 2, [mkUnit('401','available'), mkUnit('402','available'), mkUnit('403','booked')]),
        mkRoom('H003-R5', 'Deluxe Mist View Room', 3100, 3, [mkUnit('506','available'), mkUnit('507','available')]),
        mkRoom('H003-R6', 'Family Mountain Chalet', 5900, 5, [mkUnit('701','available'), mkUnit('702','available')]),
      ],
    },
    {
      id: 'H004', managerId: 'M004', name: 'Nimman Chic Boutique Hotel', location: 'นิมมานเหมินท์, เชียงใหม่',
      description: 'โรงแรมบูติกสุดชิคใจกลางถนนนิมมานฯ ตกแต่งสไตล์ Minimal Modern เดินไปคาเฟ่และร้านอาหารชื่อดังได้ง่ายดาย',
      pricePerNight: 1650, discount: 5, status: 'approved', rejectReason: null,
      images: HOTEL_IMAGES.H004, amenities: ['WiFi ความเร็วสูง', 'คาเฟ่ & บาร์', 'ฟิตเนส', 'ที่จอดรถ', 'บริการรับส่งสนามบิน'], rating: 4.5,
      rooms: [
        mkRoom('H004-R1', 'Urban Minimalist Room', 1650, 2, [mkUnit('701','available'), mkUnit('702','available'), mkUnit('703','available')]),
        mkRoom('H004-R2', 'Duplex Loft Suite', 2900, 3, [mkUnit('801','available'), mkUnit('802','available')]),
        mkRoom('H004-R3', 'Studio Balcony King', 1950, 2, [mkUnit('704','available'), mkUnit('705','available')]),
        mkRoom('H004-R4', 'Executive Corner Suite', 3400, 2, [mkUnit('803','available'), mkUnit('804','booked')]),
        mkRoom('H004-R5', 'Co-Working Suite', 2400, 2, [mkUnit('706','available'), mkUnit('707','available')]),
        mkRoom('H004-R6', 'Penthouse City View', 4200, 4, [mkUnit('901','available')]),
      ],
    },
    {
      id: 'H005', managerId: 'M005', name: 'Phuket Sunset Cliff Villa', location: 'กะตะ, ภูเก็ต',
      description: 'วิลล่าหรูริมหน้าผาชมวิวพระอาทิตย์ตกดินพาโนรามา พร้อมสระว่ายน้ำส่วนตัว Infinite Pool เหนือระดับ',
      pricePerNight: 4900, discount: 12, status: 'approved', rejectReason: null,
      images: HOTEL_IMAGES.H005, amenities: ['สระว่ายน้ำส่วนตัว Infinite Pool', 'บริการบัตเลอร์ 24 ชม.', 'ฟิตเนส & สปา', 'บาร์ริมทะเล', 'อาหารเช้าลอยน้ำ'], rating: 4.9,
      rooms: [
        mkRoom('H005-R1', 'Oceanfront Pool Villa', 4900, 2, [mkUnit('901','available'), mkUnit('902','booked'), mkUnit('903','available')]),
        mkRoom('H005-R2', 'Grand Cliff Top Villa', 8500, 6, [mkUnit('1001','available'), mkUnit('1002','available')]),
        mkRoom('H005-R3', 'Sunset Horizon Suite', 6200, 2, [mkUnit('904','available'), mkUnit('905','available')]),
        mkRoom('H005-R4', 'Royal Infinity Pool Villa', 12000, 4, [mkUnit('1003','available')]),
        mkRoom('H005-R5', 'Deluxe Cliffside Suite', 5400, 2, [mkUnit('906','available'), mkUnit('907','booked')]),
        mkRoom('H005-R6', 'Two-Bedroom Family Villa', 9800, 5, [mkUnit('1004','available')]),
      ],
    },
    {
      id: 'H006', managerId: 'M006', name: 'Patong City Vibe Hotel', location: 'ป่าตอง, ภูเก็ต',
      description: 'โรงแรมทันสมัยใจกลางหาดป่าตอง ใกล้หาดและห้างสรรพสินค้า Jungceylon เดินทางสะดวกสบาย',
      pricePerNight: 1350, discount: 10, status: 'approved', rejectReason: null,
      images: HOTEL_IMAGES.H006, amenities: ['สระว่ายน้ำดาดฟ้า', 'WiFi ฟรี', 'ห้องอาหารนานาชาติ', 'ฟิตเนส', 'ที่จอดรถ'], rating: 4.2,
      rooms: [
        mkRoom('H006-R1', 'Superior City View', 1350, 2, [mkUnit('1101','available'), mkUnit('1102','available'), mkUnit('1103','booked')]),
        mkRoom('H006-R2', 'Deluxe Balcony Room', 1950, 2, [mkUnit('1201','available'), mkUnit('1202','available'), mkUnit('1203','available')]),
        mkRoom('H006-R3', 'Rooftop Pool Suite', 2600, 2, [mkUnit('1301','available'), mkUnit('1302','available')]),
        mkRoom('H006-R4', 'Standard Twin Room', 1200, 2, [mkUnit('1104','available'), mkUnit('1105','available')]),
        mkRoom('H006-R5', 'Executive Studio', 2200, 3, [mkUnit('1204','available'), mkUnit('1205','available')]),
        mkRoom('H006-R6', 'Family Connecting Room', 3500, 4, [mkUnit('1401','available'), mkUnit('1402','booked')]),
      ],
    },
    {
      id: 'H007', managerId: 'M007', name: 'Krabi Emerald Bay Resort', location: 'อ่าวนาง, กระบี่',
      description: 'รีสอร์ทติดหาดอ่าวนาง โอบล้อมด้วยภูเขาหินปูนธรรมชาติ บริการทริปเรือสปีดโบ๊ทไปเกาะพีพีและอ่าวไร่เลย์',
      pricePerNight: 3200, discount: 15, status: 'approved', rejectReason: null,
      images: HOTEL_IMAGES.H007, amenities: ['สระว่ายน้ำติดชายหาด', 'เรือคายัคฟรี', 'คิดส์คลับ', 'สปาครบวงจร', 'บาร์ค็อกเทล'], rating: 4.8,
      rooms: [
        mkRoom('H007-R1', 'Emerald Deluxe Room', 3200, 2, [mkUnit('1301','available'), mkUnit('1302','booked'), mkUnit('1303','available')]),
        mkRoom('H007-R2', 'Cliffside Beachfront Villa', 5400, 4, [mkUnit('1401','available'), mkUnit('1402','available')]),
        mkRoom('H007-R3', 'Sea Breeze Bungalow', 2800, 2, [mkUnit('1304','available'), mkUnit('1305','available')]),
        mkRoom('H007-R4', 'Lagoon Access Room', 3900, 2, [mkUnit('1306','available'), mkUnit('1307','booked')]),
        mkRoom('H007-R5', 'Grand Island Suite', 6500, 4, [mkUnit('1501','available')]),
        mkRoom('H007-R6', 'Honeymoon Ocean Villa', 7200, 2, [mkUnit('1502','available')]),
      ],
    },
    {
      id: 'H008', managerId: 'M008', name: 'Hua Hin White Sands Heritage', location: 'หัวหิน, ประจวบคีรีขันธ์',
      description: 'ที่พักสไตล์โคโลเนียลติดหาดหัวหิน สวนร่มรื่น สระว่ายน้ำทอดยาวสู่หาดทรายขาว เงียบสงบระดับพรีเมียม',
      pricePerNight: 2600, discount: 10, status: 'approved', rejectReason: null,
      images: HOTEL_IMAGES.H008, amenities: ['สระว่ายน้ำริมหาด', 'สปาไทย', 'อาหารเช้าซีฟู้ด', 'ที่จอดรถ', 'สวนหย่อมสไตล์อังกฤษ'], rating: 4.6,
      rooms: [
        mkRoom('H008-R1', 'Colonial Heritage Room', 2600, 2, [mkUnit('1501','available'), mkUnit('1502','available'), mkUnit('1503','available')]),
        mkRoom('H008-R2', 'Pool Access Suite', 3900, 2, [mkUnit('1601','available'), mkUnit('1602','booked'), mkUnit('1603','available')]),
        mkRoom('H008-R3', 'Garden Villa', 3100, 2, [mkUnit('1504','available'), mkUnit('1505','available')]),
        mkRoom('H008-R4', 'Superior Courtyard', 2200, 2, [mkUnit('1506','available'), mkUnit('1507','available')]),
        mkRoom('H008-R5', 'Oceanfront Family Suite', 5200, 4, [mkUnit('1604','available')]),
        mkRoom('H008-R6', 'Royal Heritage Pavilion', 7800, 6, [mkUnit('1701','available')]),
      ],
    },
    {
      id: 'H009', managerId: 'M009', name: 'Samui Tropical Sanctuary', location: 'เฉวง, สุราษฎร์ธานี',
      description: 'แซงชัวรีรีสอร์ทบนเกาะสมุย ล้อมรอบด้วยต้นมะพร้าวและชายหาดส่วนตัว พร้อมบริการโยคะรับอรุณ',
      pricePerNight: 3800, discount: 18, status: 'approved', rejectReason: null,
      images: HOTEL_IMAGES.H009, amenities: ['สระว่ายน้ำลากูน', 'โยคะริมหาด', 'WiFi ฟรี', 'Beach Club', 'สปาอโรมา'], rating: 4.8,
      rooms: [
        mkRoom('H009-R1', 'Tropical Garden Bungalow', 3800, 2, [mkUnit('1701','available'), mkUnit('1702','available'), mkUnit('1703','available')]),
        mkRoom('H009-R2', 'Beachfront Ocean Villa', 6200, 2, [mkUnit('1801','available'), mkUnit('1802','available')]),
        mkRoom('H009-R3', 'Lagoon Pool Suite', 4500, 2, [mkUnit('1704','available'), mkUnit('1705','available')]),
        mkRoom('H009-R4', 'Sanctuary Wellness Cottage', 4100, 2, [mkUnit('1706','available')]),
        mkRoom('H009-R5', 'Deluxe Coconut Grove', 3200, 2, [mkUnit('1707','available'), mkUnit('1708','booked')]),
        mkRoom('H009-R6', 'Grand Sunset Residence', 9500, 6, [mkUnit('1901','available')]),
      ],
    },
    {
      id: 'H010', managerId: 'M010', name: 'Bangkok River Heritage Grand', location: 'เจริญกรุง, กรุงเทพฯ',
      description: 'โรงแรมหรูริมแม่น้ำเจ้าพระยา ดื่มด่ำวิวเมืองและวัดอรุณฯ ยามค่ำคืน พร้อมเรือรับส่ง BTS สะพานตากสินฟรี',
      pricePerNight: 3400, discount: 10, status: 'approved', rejectReason: null,
      images: HOTEL_IMAGES.H010, amenities: ['สระว่ายน้ำริมแม่น้ำ', 'ห้องอาหาร Fine Dining', 'Sky Rooftop Bar', 'ฟิตเนส & ซาวน่า', 'เรือข้ามฟากส่วนตัว'], rating: 4.7,
      rooms: [
        mkRoom('H010-R1', 'Riverview Executive Room', 3400, 2, [mkUnit('1901','available'), mkUnit('1902','booked'), mkUnit('1903','available')]),
        mkRoom('H010-R2', 'Chao Phraya Panoramic Suite', 6800, 4, [mkUnit('2001','available'), mkUnit('2002','available')]),
        mkRoom('H010-R3', 'Deluxe City & River Corner', 2900, 2, [mkUnit('1904','available'), mkUnit('1905','available')]),
        mkRoom('H010-R4', 'Club Level Premier', 4200, 2, [mkUnit('2003','available'), mkUnit('2004','booked')]),
        mkRoom('H010-R5', 'Heritage Thai Suite', 5500, 3, [mkUnit('2101','available')]),
        mkRoom('H010-R6', 'Royal Riverfront Penthouse', 14000, 6, [mkUnit('2201','available')]),
      ],
    },
    {
      id: 'H011', managerId: 'M011', name: 'Khao Yai Forest Mist Eco Lodge', location: 'ปากช่อง, นครราชสีมา',
      description: 'อีโค่ลอดจ์เชิงเขาใหญ่ อากาศเย็นสบายตลอดปี ใกล้อุทยานแห่งชาติเขาใหญ่และไร่องุ่น พร้อมลานก่อกองไฟดูดาว',
      pricePerNight: 2100, discount: 8, status: 'approved', rejectReason: null,
      images: HOTEL_IMAGES.H011, amenities: ['แคมป์ไฟและบาร์บีคิว', 'สระว่ายน้ำกลางแจ้ง', 'จักรยานเสือภูเขาให้เช่า', 'WiFi ฟรี', 'ลานดูดาว'], rating: 4.6,
      rooms: [
        mkRoom('H011-R1', 'Glamping Tent Suite', 2100, 2, [mkUnit('2101','available'), mkUnit('2102','available'), mkUnit('2103','available')]),
        mkRoom('H011-R2', 'Wooden Eco Cottage', 3600, 4, [mkUnit('2201','available'), mkUnit('2202','available')]),
        mkRoom('H011-R3', 'Mountain Stargazing Tent', 2500, 2, [mkUnit('2104','available'), mkUnit('2105','available')]),
        mkRoom('H011-R4', 'Deluxe Forest Cabin', 3100, 2, [mkUnit('2203','available'), mkUnit('2204','available')]),
        mkRoom('H011-R5', 'Family Treehouse Chalet', 4800, 5, [mkUnit('2301','available')]),
        mkRoom('H011-R6', 'Executive Nature Villa', 5900, 4, [mkUnit('2302','available')]),
      ],
    },
    {
      id: 'H012', managerId: 'M012', name: 'Nan Misty Valley Retreat', location: 'ปัว, น่าน',
      description: 'โฮมสเตย์ระดับพรีเมียมกลางทุ่งนาปัว วิวดอยภูคา สัมผัสวิถีชีวิตสโลว์ไลฟ์ สายหมอกและกาแฟดริปยามเช้า',
      pricePerNight: 1750, discount: 0, status: 'approved', rejectReason: null,
      images: HOTEL_IMAGES.H012, amenities: ['ระเบียงชมวิวทุ่งนา 360°', 'เซ็ตอาหารพื้นบ้านน่าน', 'WiFi ฟรี', 'จักรยานฟรี'], rating: 4.8,
      rooms: [
        mkRoom('H012-R1', 'Rice Field View Room', 1750, 2, [mkUnit('2301','available'), mkUnit('2302','available'), mkUnit('2303','available')]),
        mkRoom('H012-R2', 'Doi Phu Kha Wooden Suite', 2800, 4, [mkUnit('2401','available'), mkUnit('2402','available')]),
        mkRoom('H012-R3', 'Slow Life Cottage', 1950, 2, [mkUnit('2304','available'), mkUnit('2305','available')]),
        mkRoom('H012-R4', 'Panoramic Valley Balcony', 2300, 2, [mkUnit('2403','available'), mkUnit('2404','available')]),
        mkRoom('H012-R5', 'Traditional Nan Teak House', 3500, 4, [mkUnit('2501','available')]),
        mkRoom('H012-R6', 'Family Misty Terrace', 3900, 5, [mkUnit('2502','available')]),
      ],
    },
    {
      id: 'H013', managerId: 'M013', name: 'Koh Chang Marine Island Resort', location: 'เกาะช้าง, ตราด',
      description: 'รีสอร์ทติดทะเลฝั่งอ่าวไทย หาดคลองพร้าว น้ำใส ปะการังสมบูรณ์ (รอการอนุมัติเข้าระบบจาก Admin)',
      pricePerNight: 2400, discount: 15, status: 'pending', rejectReason: null,
      images: HOTEL_IMAGES.H013, amenities: ['อุปกรณ์ดำน้ำตื้น', 'สระว่ายน้ำกลางแจ้ง', 'WiFi ฟรี', 'เรือคายัค'], rating: 4.4,
      rooms: [
        mkRoom('H013-R1', 'Island View Deluxe', 2400, 2, [mkUnit('2501','available'), mkUnit('2502','available'), mkUnit('2503','available')]),
        mkRoom('H013-R2', 'Sunset Sea Villa', 4200, 2, [mkUnit('2601','available'), mkUnit('2602','available')]),
        mkRoom('H013-R3', 'Coral Beach Bungalow', 2900, 2, [mkUnit('2504','available'), mkUnit('2505','available')]),
        mkRoom('H013-R4', 'Garden Pool Villa', 3800, 3, [mkUnit('2603','available')]),
        mkRoom('H013-R5', 'Marine Family Suite', 4900, 4, [mkUnit('2701','available')]),
        mkRoom('H013-R6', 'Superior Tropical Twin', 2100, 2, [mkUnit('2506','available')]),
      ],
    },
    {
      id: 'H014', managerId: 'M014', name: 'Rayong Coastal Breeze Hotel', location: 'แกลง, ระยอง',
      description: 'โรงแรมริมหาดแม่พิมพ์ ระยอง ใกล้สวนผลไม้และตลาดอาหารทะเลสด',
      pricePerNight: 1600, discount: 0, status: 'rejected', rejectReason: 'ข้อมูลใบอนุญาตโรงแรมไม่ครบถ้วนและภาพถ่ายไม่ชัดเจน กรุณาแก้ไข',
      images: HOTEL_IMAGES.H014, amenities: ['สระว่ายน้ำ', 'อาหารเช้า', 'ที่จอดรถ'], rating: 3.7,
      rooms: [
        mkRoom('H014-R1', 'Coastal Deluxe Room', 1600, 2, [mkUnit('2701','available'), mkUnit('2702','available'), mkUnit('2703','available')]),
        mkRoom('H014-R2', 'Sea Breeze Suite', 2400, 3, [mkUnit('2801','available'), mkUnit('2802','available')]),
        mkRoom('H014-R3', 'Standard Twin Room', 1300, 2, [mkUnit('2704','available'), mkUnit('2705','available')]),
        mkRoom('H014-R4', 'Family Ocean Room', 3100, 4, [mkUnit('2803','available')]),
        mkRoom('H014-R5', 'Executive Balcony King', 2100, 2, [mkUnit('2706','available')]),
      ],
    },
    {
      id: 'H015', managerId: 'M015', name: 'Ayutthaya Riverside Boutique', location: 'พระนครศรีอยุธยา, พระนครศรีอยุธยา',
      description: 'ที่พักริมแม่น้ำป่าสัก ใกล้โบราณสถานวัดมหาธาตุ ตกแต่งสไตล์ไทยโมเดิร์น (ปิดปรับปรุงระบบชั่วคราว)',
      pricePerNight: 1950, discount: 0, status: 'suspended', rejectReason: null,
      images: HOTEL_IMAGES.H015, amenities: ['สระว่ายน้ำริมน้ำ', 'ร้านอาหารริมน้ำ', 'WiFi ฟรี', 'ที่จอดรถ'], rating: 4.3,
      rooms: [
        mkRoom('H015-R1', 'Heritage River Room', 1950, 2, [mkUnit('2801','available'), mkUnit('2802','available'), mkUnit('2803','available')]),
        mkRoom('H015-R2', 'Ayutthaya Grand Suite', 3200, 4, [mkUnit('2901','available'), mkUnit('2902','available')]),
        mkRoom('H015-R3', 'Thai Classic Deluxe', 2300, 2, [mkUnit('2804','available'), mkUnit('2805','available')]),
        mkRoom('H015-R4', 'Riverfront Balcony Suite', 2800, 2, [mkUnit('2903','available')]),
        mkRoom('H015-R5', 'Family Heritage Residence', 4500, 5, [mkUnit('2904','available')]),
      ],
    },
    {
      id: 'H_ADMIN',
      managerId: 'A001',
      name: 'ฝ่ายบริการลูกค้า (Admin Support)',
      location: 'ศูนย์ช่วยเหลือ Adoga Service',
      description: 'ทีมงานผู้ดูแลระบบพร้อมช่วยเหลือและให้คำปรึกษาตลอด 24 ชั่วโมง',
      pricePerNight: 0,
      discount: 0,
      status: 'approved',
      rejectReason: null,
      images: ['/docs/ui-specs/adoga_logo.png'],
      amenities: ['ช่วยเหลือ 24 ชม.', 'ตอบกลับรวดเร็ว'],
      rating: 5.0,
      rooms: []
    },
  ]

  // ── Bookings ──────────────────────────────────────────────
  const bookings = [
    { id:'B001', userId:'U001', hotelId:'H001', roomId:'H001-R1', roomNo:'102', guests:2, checkIn: isoD(22), checkOut: isoD(24), nights:2, totalPrice:2700, status:'pending_payment', cancelReason:null, paymentMethod:'QR', paymentStatus:'awaiting', createdAt: isoH(-1), expiresAt: isoH(11), checkedInAt:null, checkedOutAt:null },
    { id:'B002', userId:'U001', hotelId:'H002', roomId:'H002-R1', roomNo:'302', guests:2, checkIn: isoD(5), checkOut: isoD(7), nights:2, totalPrice:3740, status:'confirmed', cancelReason:null, paymentMethod:'QR', paymentStatus:'success', createdAt: isoD(-2), expiresAt: isoD(-1), checkedInAt:null, checkedOutAt:null },
    { id:'B003', userId:'U002', hotelId:'H003', roomId:'H003-R1', roomNo:'502', guests:2, checkIn: isoD(10), checkOut: isoD(13), nights:3, totalPrice:6720, status:'confirmed', cancelReason:null, paymentMethod:'BANK_TRANSFER', paymentStatus:'success', createdAt: isoD(-4), expiresAt: isoH(-83), checkedInAt:null, checkedOutAt:null },
    { id:'B004', userId:'U001', hotelId:'H005', roomId:'H005-R1', roomNo:'902', guests:2, checkIn: isoD(-8), checkOut: isoD(-6), nights:2, totalPrice:8624, status:'completed', cancelReason:null, paymentMethod:'QR', paymentStatus:'success', createdAt: isoD(-10), expiresAt: isoH(-228), checkedInAt: isoD(-8), checkedOutAt: isoD(-6) },
    { id:'B005', userId:'U002', hotelId:'H007', roomId:'H007-R1', roomNo:'1302', guests:2, checkIn: isoD(5), checkOut: isoD(7), nights:2, totalPrice:5440, status:'confirmed', cancelReason:null, paymentMethod:'QR', paymentStatus:'success', createdAt: isoD(-2), expiresAt: isoD(-1), checkedInAt:null, checkedOutAt:null },
    { id:'B006', userId:'U002', hotelId:'H002', roomId:'H002-R1', roomNo:'301', guests:2, checkIn: isoD(-15), checkOut: isoD(-13), nights:2, totalPrice:3740, status:'cancelled', cancelReason:'refunded', paymentMethod:'QR', paymentStatus:'refunded', createdAt: isoD(-17), expiresAt: isoH(-385), checkedInAt:null, checkedOutAt:null },
    { id:'B007', userId:'U002', hotelId:'H010', roomId:'H010-R1', roomNo:'1902', guests:2, checkIn: isoD(10), checkOut: isoD(12), nights:2, totalPrice:6120, status:'confirmed', cancelReason:null, paymentMethod:'BANK_TRANSFER', paymentStatus:'success', createdAt: isoD(-3), expiresAt: isoH(-59), checkedInAt:null, checkedOutAt:null },
    { id:'B008', userId:'U002', hotelId:'H001', roomId:'H001-R2', roomNo:'202', guests:2, checkIn: isoD(15), checkOut: isoD(17), nights:2, totalPrice:5040, status:'pending_payment', cancelReason:null, paymentMethod:'QR', paymentStatus:'failed', createdAt: isoH(-7), expiresAt: isoH(5), checkedInAt:null, checkedOutAt:null },
  ]

  // ── Refunds ───────────────────────────────────────────────
  const refunds = [
    { id:'RF001', bookingId:'B002', userId:'U001', hotelId:'H002', amount:3740, reason:'เปลี่ยนแผนการเดินทาง', status:'reviewing', rejectReason:null, createdAt: isoH(-2) },
    { id:'RF002', bookingId:'B006', userId:'U002', hotelId:'H002', amount:3740, reason:'ป่วย กะทันหัน', status:'approved', rejectReason:null, createdAt: isoD(-5) },
    { id:'RF003', bookingId:'B007', userId:'U002', hotelId:'H010', amount:6120, reason:'ติดธุระด่วน', status:'rejected', rejectReason:'ไม่เข้าเงื่อนไขการคืนเงินภายในระยะเวลาที่กำหนด', createdAt: isoD(-3) },
  ]

  // ── Reviews ───────────────────────────────────────────────
  const reviews = [
    { id:'R001', hotelId:'H001', userId:'U001', rating:5, comment:'วิวสวยมากครับ ทีมงานดูแลดีมาก บรรยากาศติดหาดบางแสน', date: isoD(-5) },
    { id:'R002', hotelId:'H001', userId:'U002', rating:4, comment:'ห้องสะอาด พนักงานน่ารัก อาหารเช้าหลากหลาย', date: isoD(-10) },
    { id:'R003', hotelId:'H002', userId:'U002', rating:5, comment:'ใกล้หาดพัทยา เดินสบาย สระว่ายน้ำใหญ่มาก', date: isoD(-12) },
    { id:'R004', hotelId:'H003', userId:'U001', rating:5, comment:'อากาศเชียงใหม่ดีมาก หมอกตอนเช้าสวยประทับใจสุดๆ', date: isoD(-8) },
    { id:'R005', hotelId:'H005', userId:'U002', rating:5, comment:'วิลล่าริมหน้าผาภูเก็ตสวยสมราคา สระว่ายน้ำส่วนตัวฟินมาก', date: isoD(-6) },
    { id:'R006', hotelId:'H007', userId:'U001', rating:5, comment:'กระบี่สวยมาก โรงแรมติดหาดอ่าวนาง สะดวกสุดๆ', date: isoD(-9) },
    { id:'R007', hotelId:'H010', userId:'U002', rating:5, comment:'วิวแม่น้ำเจ้าพระยาตอนกลางคืนสวยงาม มีเรือรับส่ง BTS สะดวก', date: isoD(-4) },
    { id:'R008', hotelId:'H012', userId:'U001', rating:5, comment:'วิวดอยภูคาและทุ่งนาเขียวขจี อากาศดีมาก กาแฟดริปอร่อย', date: isoD(-2) },
  ]

  // ── Messages (Separated per Role & Gmail) ──────────────────
  const messages = [
    // ── 1. User John (user@gmail.com / U001) Messages ────────
    // Thread: U001 ↔ Manager Anan (manager3@gmail.com / M003) at H001
    { id:'MSG001', hotelId:'H001', userId:'U001', sender:'user',    text:'สอบถามเรื่อง Check-in ก่อนเวลาได้ไหมครับ', sentAt: isoH(-4), unread: false },
    { id:'MSG002', hotelId:'H001', userId:'U001', sender:'manager', text:'สวัสดีครับ ขอบคุณที่จองกับเรา ทางโรงแรมยินดีให้บริการครับ (สามารถเช็คอินล่วงหน้าได้ตั้งแต่ 12:00 น.)', sentAt: isoH(-3), unread: true },

    // Thread: U001 ↔ Manager Somchai (manager@gmail.com / M001) at H002
    { id:'MSG003', hotelId:'H002', userId:'U001', sender:'user',    text:'มีที่จอดรถสำหรับรถบัสไหมครับ', sentAt: isoH(-5), unread: false },
    { id:'MSG004', hotelId:'H002', userId:'U001', sender:'manager', text:'ได้เลยครับ ทางโรงแรมมีลานจอดรถบัสรองรับได้ถึง 5 คันครับ ยินดีต้อนรับครับ', sentAt: isoH(-4), unread: true },

    // Thread: U001 ↔ Admin Support (admin@gmail.com / A001) at H_ADMIN
    { id:'MSG005', hotelId:'H_ADMIN', userId:'U001', sender:'user',  text:'สวัสดีครับ สอบถามเรื่องขอใบเสร็จรับเงิน / ใบกำกับภาษีสำหรับการจองที่พักครับ', sentAt: isoH(-2), unread: false },
    { id:'MSG006', hotelId:'H_ADMIN', userId:'U001', sender:'admin', text:'สวัสดีครับคุณ John Doe ทางระบบได้จัดส่ง e-Receipt ไปยังอีเมล user@gmail.com ให้เรียบร้อยแล้วครับ หากต้องการใบกำกับภาษีฉบับเต็ม สามารถดาวน์โหลดในหน้าการจองได้เลยครับ', sentAt: isoH(-1), unread: true },

    // ── 2. User Mary (mary@gmail.com / U002) Messages ─────────
    // Thread: U002 ↔ Manager Suda (manager2@gmail.com / M002) at H003
    { id:'MSG007', hotelId:'H003', userId:'U002', sender:'user',    text:'ต้องการขอเตียงเสริมสำหรับเด็ก 1 ขวบค่ะ', sentAt: isoH(-6), unread: false },
    { id:'MSG008', hotelId:'H003', userId:'U002', sender:'manager', text:'สวัสดีค่ะคุณ Mary ทางเราจัดเตรียมเปลเด็กและชุดเครื่องนอนให้เรียบร้อยแล้วค่ะ ไม่มีค่าใช้จ่ายเพิ่มเติมนะคะ', sentAt: isoH(-5), unread: true },

    // Thread: U002 ↔ Admin Support (admin@gmail.com / A001) at H_ADMIN
    { id:'MSG009', hotelId:'H_ADMIN', userId:'U002', sender:'user',  text:'ขอสอบถามเงื่อนไขการยกเลิกการจองและระยะเวลาคืนเงินค่ะ', sentAt: isoD(-1), unread: false },
    { id:'MSG010', hotelId:'H_ADMIN', userId:'U002', sender:'admin', text:'สวัสดีครับคุณ Mary หากยกเลิกก่อนวันเข้าพักตามนโยบาย จะได้รับเงินคืนภายใน 3-5 วันทำการผ่านช่องทางเดิมที่ชำระเข้ามาครับ', sentAt: isoH(-12), unread: false },

    // ── 3. Manager Somchai (manager@gmail.com / M001) ↔ Admin Support ──
    { id:'MSG011', hotelId:'H_ADMIN', userId:'M001', sender:'user',  text:'สวัสดีครับแอดมิน สอบถามเรื่องรอบการโอนเงินรายได้โรงแรม Pattaya Beach Resort & Spa ประจำสัปดาห์นี้ครับ', sentAt: isoD(-2), unread: false },
    { id:'MSG012', hotelId:'H_ADMIN', userId:'M001', sender:'admin', text:'สวัสดีครับคุณ Somchai ทางทีมการเงินสรุปยอดเรียบร้อยแล้ว จะดำเนินการโอนเข้าบัญชีที่ผูกไว้ในวันศุกร์นี้ครับ ขอบคุณครับ', sentAt: isoD(-1), unread: false },
  ]

  // ── Settings & Filler Bookings ────────────────────────────
  const settings = { enableRefund: true }

  // Filler bookings for charts (~50 items, completed, spread over 12 months)
  const fillers = []
  const fillerHotels = ['H001','H002','H003','H004','H005','H007','H008','H010']
  for (let i = 0; i < 50; i++) {
    const daysBack = Math.floor(Math.random() * 365)
    fillers.push({
      id: `B1${String(i).padStart(2,'0')}`,
      userId: i % 2 === 0 ? 'U001' : 'U002',
      hotelId: fillerHotels[i % fillerHotels.length],
      roomId: `${fillerHotels[i % fillerHotels.length]}-R1`,
      roomNo: '999',
      guests: 2,
      checkIn: isoD(-daysBack - 3),
      checkOut: isoD(-daysBack - 1),
      nights: 2,
      totalPrice: [2700, 3740, 4480, 5040, 8624, 6120][i % 6],
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
  set('adoga_current_session', currentSession)
  set('adoga_meta', { seeded: true, version: VERSION })

  if (db) {
    db['adoga_users'] = users
    db['adoga_hotels'] = hotels
    db['adoga_bookings'] = [...bookings, ...fillers]
    db['adoga_refunds'] = refunds
    db['adoga_reviews'] = reviews
    db['adoga_messages'] = messages
    db['adoga_settings'] = settings
    db['adoga_current_session'] = currentSession
    db['adoga_meta'] = { seeded: true, version: VERSION }
  }
}

