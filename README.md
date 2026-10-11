# Adoga Service - Hotel Booking and Management System

## 1. ข้อมูลโครงงาน
โครงงานพัฒนาระบบจำลองการจองที่พักและการจัดการโรงแรม Adoga Service จัดทำขึ้นสำหรับรายวิชาการวิเคราะห์และออกแบบระบบ (System Analysis) ภาควิชาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยเกษตรศาสตร์ เพื่อจำลองและสาธิตกระบวนการทำงานของระบบบริการจองโรงแรมและการบริหารจัดการหลังบ้านอย่างเป็นรูปธรรม

---

## 2. สมาชิกผู้จัดทำ

| ลำดับ | ชื่อ - นามสกุล | รหัสนิสิต |
| :---: | :--- | :---: |
| 1 | นางสาวประภาพร ตาจันทร์ | 6730200219 |
| 2 | นายปิยกร คชานนท์ | 6730200227 |
| 3 | นายสุพศิน คำพะแย | 6730200359 |
| 4 | นางสาวอัสรา ทราจารวัตร | 6730200391 |

---

## 3. เทคโนโลยีและเครื่องมือที่ใช้ (Tech Stack)

### ภาษาที่ใช้พัฒนา (Languages)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

### เฟรมเวิร์กและไลบรารี (Frameworks & Libraries)
![Vue.js](https://img.shields.io/badge/Vue_3-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vue Router](https://img.shields.io/badge/Vue_Router-42B883?style=for-the-badge&logo=vuedotjs&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

### สถาปัตยกรรมและการจำลองระบบ (System Architecture)
- รูปแบบการพัฒนา: Interactive Web Prototype & Mockup
- ระบบจัดเก็บข้อมูลจำลอง: Web Storage (LocalStorage) และ In-Memory Reactive State
- การจัดการสไตล์และไอคอน: Tailwind CSS พร้อมชุดไอคอน Lucide Icons (@lucide/vue)

---

## 4. เป้าหมายและจุดเน้นของการออกแบบระบบ (System Analysis Focus)

การพัฒนานี้มุ่งเน้นการแปลงผลลัพธ์จากการวิเคราะห์ระบบตามหลักวิชา System Analysis (ภาควิชาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยเกษตรศาสตร์) มาสู่การทำงานจริงของโปรแกรม โดยแบ่งตามแผนภาพการวิเคราะห์ดังนี้:

| แผนภาพการวิเคราะห์ | จุดประสงค์ในการออกแบบ | การนำไปประยุกต์ใช้ในระบบ Adoga Service |
| :--- | :--- | :--- |
| **Use Case Diagram** | กำหนดขอบเขตสิทธิ์และหน้าที่ของผู้ใช้งาน | แบ่งแยกหน้าที่ชัดเจนระหว่าง Customer, Manager และ Admin |
| **State Diagram** | กำหนดสถานะและเงื่อนไขการเปลี่ยนสถานะของข้อมูล | ควบคุมสถานะการจอง (Booking), การขอเงินคืน (Refund) และการอนุมัติโรงแรม (Hotel Status) |
| **Data Flow Diagram (DFD)** | วิเคราะห์ทิศทางการไหลและการประมวลผลข้อมูล | กำหนด Flow การส่งข้อมูลคำขอจอง, การส่งตรวจโรงแรม และการขอคืนเงิน |
| **Class Diagram (UML)** | กำหนดโครงสร้างข้อมูลและ Entity Relationship | ออกแบบ Object Model ของผู้ใช้, โรงแรม, ห้องพัก, การจอง และประวัติการแก้ไข (Audit Log) |
| **Activity Diagram** | แสดงลำดับกิจกรรมและการตัดสินใจทางตรรกะ | ลำดับการจองห้องพัก, การตรวจสอบสิทธิ์ และกระบวนการพิจารณาคำขอคืนเงิน |
| **Sequence Diagram** | แสดงลำดับการส่งผ่านข้อมูลระหว่าง Object/Component | การเรียกใช้งาน Service Function เช่น transitions.js, authService.js และ stateMachine.js |

---

## 5. บทบาทผู้ใช้งานและขั้นตอนการทำงาน (User Roles & Workflows)

### 1. ลูกค้าทั่วไป (Customer)
ผู้ใช้งานที่ต้องการค้นหาและจองห้องพัก
- **ขั้นตอนการทำงาน (Workflow):**
  1. ค้นหาโรงแรมตามทำเลหรือชื่อที่ต้องการ และเลือกดูข้อมูลรายละเอียดที่พัก
  2. เลือกประเภทห้องพัก วันที่เข้าพัก และกรอกข้อมูลการจอง
  3. ชำระเงินผ่านระบบจำลองและรับหลักฐานยืนยันการจอง (Booking Confirmation)
  4. จัดการการจองของตนเองในหน้ารายการจอง และสามารถส่งคำร้องขอคืนเงิน (Refund Request) พร้อมแนบเหตุผลได้ตามเงื่อนไข

### 2. ผู้จัดการโรงแรม (Hotel Manager)
ผู้ประกอบการที่ได้รับสิทธิ์จากระบบในการดูแลโรงแรมและห้องพัก
- **ขั้นตอนการทำงาน (Workflow):**
  1. เข้าสู่ระบบด้วยบัญชี Gmail ที่ได้รับการกำหนดสิทธิ์จากผู้ดูแลระบบ
  2. สร้างโพสต์โรงแรมใหม่ ระบุข้อมูล สิ่งอำนวยความสะดวก และเพิ่มประเภทห้องพักพร้อมจำนวนยูนิต
  3. ส่งข้อมูลโรงแรมให้ผู้ดูแลระบบตรวจสอบและอนุมัติ (Status: Pending)
  4. จัดการสถานะห้องพักในระบบ เช่น ปรับห้องพักเป็นสถานะซ่อมบำรุง (Maintenance) หรือเปิดใช้งาน (Available)
  5. ตรวจสอบรายชื่อลูกค้าที่เข้าพัก และตรวจสอบคำร้องขอคืนเงิน
  6. ตรวจสอบรายงานภาพรวม ยอดรายได้ และสถิติการเข้าพักผ่าน Dashboard

### 3. ผู้ดูแลระบบ (System Admin)
ผู้ควบคุมความถูกต้องและความปลอดภัยของระบบทั้งหมด
- **ขั้นตอนการทำงาน (Workflow):**
  1. กำหนดสิทธิ์ผู้จัดการโรงแรม (Manager Permissions) โดยเพิ่มบัญชี Gmail และเปิด-ปิดสิทธิ์การเข้าใช้งาน
  2. ตรวจสอบคำขอเปิดโรงแรมใหม่ และคำขอแก้ไขข้อมูลโรงแรม
  3. ตรวจสอบประวัติการส่งแก้ไข (Audit Log) ในหน้าต่างรายละเอียดเพื่อเปรียบเทียบข้อมูลเดิมและข้อมูลใหม่ที่ส่งมา
  4. ทำการอนุมัติ (Approve) หรือปฏิเสธ (Reject พร้อมระบุเหตุผล) เพื่อแจ้งเตือนกลับไปยังผู้จัดการโรงแรม
  5. ติดตามภาพรวมของระบบและรายงานสถิติต่างๆ ใน Admin Dashboard

---

## 6. การติดตั้งและเปิดใช้งานโปรเจกต์

ติดตั้ง Dependency ที่จำเป็น:
```bash
npm install
```

รัน Development Server สำหรับทดสอบ:
```bash
npm run dev
```

สร้าง Production Build:
```bash
npm run build
```
