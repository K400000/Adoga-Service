// src/constants/status.js
// Single source of truth for all status labels, colors, icons, hints
export const STATUS = {
  hotel: {
    pending:    { label: 'รออนุมัติ',    color: 'amber',   icon: 'Clock',        hint: 'รอผู้ดูแลระบบตรวจสอบ' },
    approved:   { label: 'เปิดใช้งาน',   color: 'emerald', icon: 'CircleCheck',  hint: 'โรงแรมพร้อมรับจอง' },
    rejected:   { label: 'ถูกปฏิเสธ',   color: 'rose',    icon: 'CircleX',      hint: 'กรุณาแก้ไขและส่งใหม่' },
    suspended:  { label: 'ปิดชั่วคราว', color: 'slate',   icon: 'PauseCircle',  hint: 'หยุดรับจองชั่วคราว' },
    closed:     { label: 'ปิดกิจการ',   color: 'slate',   icon: 'Archive',      hint: 'ปิดดำเนินการถาวร' },
  },
  room: {
    available:    { label: 'ว่าง',          color: 'emerald', icon: 'CircleCheck', hint: 'พร้อมจอง' },
    booked:       { label: 'ถูกจอง',        color: 'indigo',  icon: 'BedDouble',   hint: 'มีผู้จองแล้ว' },
    maintenance:  { label: 'ปิดปรับปรุง',  color: 'slate',   icon: 'Wrench',      hint: 'อยู่ระหว่างปรับปรุง' },
  },
  booking: {
    pending_payment: { label: 'รอชำระเงิน', color: 'amber',   icon: 'Clock',       hint: 'กรุณาชำระภายใน 12 ชม.' },
    confirmed:       { label: 'ยืนยันแล้ว', color: 'emerald', icon: 'CircleCheck', hint: 'การจองได้รับการยืนยัน' },
    completed:       { label: 'เสร็จสิ้น',  color: 'slate',   icon: 'CheckCheck',  hint: 'การเข้าพักเสร็จสิ้น' },
    cancelled:       { label: 'ยกเลิก',     color: 'rose',    icon: 'CircleX',     hint: 'การจองถูกยกเลิก' },
    checked_in:      { label: 'เข้าพักอยู่', color: 'indigo',  icon: 'LogIn',       hint: 'ผู้เข้าพักอยู่ในโรงแรม' },
  },
  payment: {
    awaiting:   { label: 'รอชำระ',        color: 'amber',   icon: 'Clock',       hint: 'รอการชำระเงิน' },
    verifying:  { label: 'รอตรวจสอบ',    color: 'indigo',  icon: 'Loader2',     hint: 'กำลังตรวจสอบการชำระ' },
    success:    { label: 'สำเร็จ',        color: 'emerald', icon: 'CircleCheck', hint: 'ชำระเงินสำเร็จ' },
    failed:     { label: 'ล้มเหลว',       color: 'rose',    icon: 'CircleX',     hint: 'การชำระเงินไม่สำเร็จ' },
    refunded:   { label: 'คืนเงินแล้ว',  color: 'violet',  icon: 'Undo2',       hint: 'คืนเงินเรียบร้อยแล้ว' },
  },
  refund: {
    submitted:  { label: 'ถูกยื่น',           color: 'amber',   icon: 'Send',        hint: 'รอพนักงานตรวจสอบ' },
    reviewing:  { label: 'กำลังตรวจสอบ',     color: 'indigo',  icon: 'Loader2',     hint: 'พนักงานกำลังตรวจสอบ' },
    approved:   { label: 'อนุมัติ',           color: 'emerald', icon: 'CircleCheck', hint: 'คำขอคืนเงินได้รับการอนุมัติ' },
    rejected:   { label: 'ปฏิเสธ',           color: 'rose',    icon: 'CircleX',     hint: 'คำขอคืนเงินถูกปฏิเสธ' },
  },
}

// Color classes per color name
export const COLOR_CLASSES = {
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-200'   },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-700',    ring: 'ring-rose-200'    },
  indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  ring: 'ring-indigo-200'  },
  slate:   { bg: 'bg-slate-100',  text: 'text-slate-600',   ring: 'ring-slate-200'   },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-700',  ring: 'ring-violet-200'  },
}
