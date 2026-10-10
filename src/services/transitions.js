// src/services/transitions.js — All status changes go through here
import { db } from '../stores/db.js'
import { transition } from '../utils/stateMachine.js'

function findBooking(id) {
  return (db['adoga_bookings'] || []).find(b => b.id === id)
}
function saveBookings(list) { db['adoga_bookings'] = list }
function saveHotels(list)   { db['adoga_hotels'] = list }
function saveRefunds(list)  { db['adoga_refunds'] = list }

function findUnitInHotel(hotelId, roomId, roomNo) {
  const hotel = (db['adoga_hotels'] || []).find(h => h.id === hotelId)
  if (!hotel) return null
  const room = hotel.rooms?.find(r => r.id === roomId)
  if (!room) return null
  return room.units?.find(u => u.no === roomNo)
}

function updateUnit(hotelId, roomId, roomNo, status) {
  const hotels = [...(db['adoga_hotels'] || [])]
  const hIdx = hotels.findIndex(h => h.id === hotelId)
  if (hIdx === -1) return
  const hotel = { ...hotels[hIdx], rooms: hotels[hIdx].rooms.map(r => {
    if (r.id !== roomId) return r
    return { ...r, units: r.units.map(u => u.no !== roomNo ? u : transition('room', {...u}, status)) }
  })}
  hotels[hIdx] = hotel
  saveHotels(hotels)
}

// Booking + Payment creation
export function createBooking({ userId, hotelId, roomId, roomNo, guests, checkIn, checkOut, nights, totalPrice, paymentMethod }) {
  const id = 'B' + Date.now()
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 12 * 3600000).toISOString()
  const booking = { id, userId, hotelId, roomId, roomNo, guests, checkIn, checkOut, nights, totalPrice, status: 'pending_payment', cancelReason: null, paymentMethod, paymentStatus: 'awaiting', createdAt: now, expiresAt, checkedInAt: null, checkedOutAt: null }
  updateUnit(hotelId, roomId, roomNo, 'booked')
  db['adoga_bookings'] = [...(db['adoga_bookings'] || []), booking]
  return booking
}

export function startPayment(bookingId) {
  const bookings = [...(db['adoga_bookings'] || [])]
  const idx = bookings.findIndex(b => b.id === bookingId)
  if (idx === -1) throw new Error('Booking not found')
  if (bookings[idx].paymentStatus === 'failed') {
    transition('payment', bookings[idx], 'awaiting')
  }
  transition('payment', bookings[idx], 'verifying')
  saveBookings(bookings)
}

export function finishPayment(bookingId, success) {
  const bookings = [...(db['adoga_bookings'] || [])]
  const idx = bookings.findIndex(b => b.id === bookingId)
  if (idx === -1) throw new Error('Booking not found')
  if (success) {
    transition('payment', bookings[idx], 'success')
    transition('booking', bookings[idx], 'confirmed')
  } else {
    transition('payment', bookings[idx], 'failed')
  }
  saveBookings(bookings)
}

export function retryPayment(bookingId) {
  const bookings = [...(db['adoga_bookings'] || [])]
  const idx = bookings.findIndex(b => b.id === bookingId)
  if (idx === -1) throw new Error('Booking not found')
  transition('payment', bookings[idx], 'awaiting')
  saveBookings(bookings)
}

export function cancelBooking(bookingId, reason = 'user') {
  const bookings = [...(db['adoga_bookings'] || [])]
  const idx = bookings.findIndex(b => b.id === bookingId)
  if (idx === -1) throw new Error('Booking not found')
  const b = bookings[idx]
  transition('booking', bookings[idx], 'cancelled')
  bookings[idx] = { ...bookings[idx], cancelReason: reason }
  updateUnit(b.hotelId, b.roomId, b.roomNo, 'available')
  saveBookings(bookings)
}

export function sweepExpired() {
  const bookings = [...(db['adoga_bookings'] || [])]
  const now = new Date()
  let changed = false
  bookings.forEach((b, idx) => {
    if (b.status === 'pending_payment' && new Date(b.expiresAt) < now) {
      transition('booking', bookings[idx], 'cancelled')
      bookings[idx] = { ...bookings[idx], cancelReason: 'expired' }
      updateUnit(b.hotelId, b.roomId, b.roomNo, 'available')
      changed = true
    }
  })
  if (changed) saveBookings(bookings)
}

export function checkIn(bookingId) {
  const bookings = [...(db['adoga_bookings'] || [])]
  const idx = bookings.findIndex(b => b.id === bookingId)
  if (idx === -1) throw new Error('Booking not found')
  bookings[idx] = { ...bookings[idx], checkedInAt: new Date().toISOString() }
  saveBookings(bookings)
}

export function checkOut(bookingId) {
  const bookings = [...(db['adoga_bookings'] || [])]
  const idx = bookings.findIndex(b => b.id === bookingId)
  if (idx === -1) throw new Error('Booking not found')
  const b = bookings[idx]
  transition('booking', bookings[idx], 'completed')
  bookings[idx] = { ...bookings[idx], checkedOutAt: new Date().toISOString() }
  updateUnit(b.hotelId, b.roomId, b.roomNo, 'available')
  saveBookings(bookings)
}

export function requestRefund({ bookingId, userId, hotelId, amount, reason }) {
  const id = 'RF' + Date.now()
  const refund = { id, bookingId, userId, hotelId, amount, reason, status: 'submitted', rejectReason: null, createdAt: new Date().toISOString() }
  db['adoga_refunds'] = [...(db['adoga_refunds'] || []), refund]
  return refund
}

export function startReview(refundId) {
  const refunds = [...(db['adoga_refunds'] || [])]
  const idx = refunds.findIndex(r => r.id === refundId)
  if (idx === -1) throw new Error('Refund not found')
  transition('refund', refunds[idx], 'reviewing')
  saveRefunds(refunds)
}

export function approveRefund(refundId) {
  const refunds = [...(db['adoga_refunds'] || [])]
  const idx = refunds.findIndex(r => r.id === refundId)
  if (idx === -1) throw new Error('Refund not found')
  if (refunds[idx].status === 'submitted') {
    transition('refund', refunds[idx], 'reviewing')
  }
  transition('refund', refunds[idx], 'approved')
  saveRefunds(refunds)
  const refund = refunds[idx]
  // side effects
  const bookings = [...(db['adoga_bookings'] || [])]
  const bIdx = bookings.findIndex(b => b.id === refund.bookingId)
  if (bIdx !== -1) {
    const b = bookings[bIdx]
    bookings[bIdx] = { ...b, paymentStatus: 'refunded', status: 'cancelled', cancelReason: 'refunded' }
    updateUnit(b.hotelId, b.roomId, b.roomNo, 'available')
    saveBookings(bookings)
  }
}

export function rejectRefund(refundId, rejectReason) {
  const refunds = [...(db['adoga_refunds'] || [])]
  const idx = refunds.findIndex(r => r.id === refundId)
  if (idx === -1) throw new Error('Refund not found')
  if (refunds[idx].status === 'submitted') {
    transition('refund', refunds[idx], 'reviewing')
  }
  transition('refund', refunds[idx], 'rejected')
  refunds[idx] = { ...refunds[idx], rejectReason }
  saveRefunds(refunds)
}

export function approveHotel(hotelId) {
  const hotels = [...(db['adoga_hotels'] || [])]
  const idx = hotels.findIndex(h => h.id === hotelId)
  if (idx === -1) throw new Error('Hotel not found')
  transition('hotel', hotels[idx], 'approved')
  saveHotels(hotels)
}

export function rejectHotel(hotelId, rejectReason) {
  const hotels = [...(db['adoga_hotels'] || [])]
  const idx = hotels.findIndex(h => h.id === hotelId)
  if (idx === -1) throw new Error('Hotel not found')
  transition('hotel', hotels[idx], 'rejected')
  hotels[idx] = { ...hotels[idx], rejectReason }
  saveHotels(hotels)
}

export function suspendHotel(hotelId) {
  const hotels = [...(db['adoga_hotels'] || [])]
  const idx = hotels.findIndex(h => h.id === hotelId)
  if (idx === -1) throw new Error('Hotel not found')
  transition('hotel', hotels[idx], 'suspended')
  saveHotels(hotels)
}

export function activateHotel(hotelId) {
  const hotels = [...(db['adoga_hotels'] || [])]
  const idx = hotels.findIndex(h => h.id === hotelId)
  if (idx === -1) throw new Error('Hotel not found')
  transition('hotel', hotels[idx], 'approved')
  saveHotels(hotels)
}

export function createHotel({ managerId, name, location, description, pricePerNight, discount = 0, amenities = [], images = [], rooms = [] }) {
  const id = 'H' + Date.now()
  const hotel = {
    id,
    managerId,
    name: name.trim(),
    location: location.trim(),
    description: description?.trim() || '',
    pricePerNight: Number(pricePerNight) || 1000,
    discount: Number(discount) || 0,
    rating: 4.8,
    amenities,
    images: images.length ? images : ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'],
    rooms: rooms.length ? rooms : [
      {
        id: 'R' + Date.now(),
        type: 'Standard Room',
        capacity: 2,
        price: Number(pricePerNight) || 1000,
        units: [
          { no: '101', status: 'available' },
          { no: '102', status: 'available' }
        ]
      }
    ],
    status: 'pending',
    rejectReason: null,
    statusHistory: [{ status: 'pending', at: new Date().toISOString() }],
  }
  db['adoga_hotels'] = [...(db['adoga_hotels'] || []), hotel]
  return hotel
}

export function updateHotel(hotelId, data) {
  const hotels = [...(db['adoga_hotels'] || [])]
  const idx = hotels.findIndex(h => h.id === hotelId)
  if (idx === -1) throw new Error('Hotel not found')
  const h = { ...hotels[idx], ...data }
  if (h.status === 'approved' || h.status === 'rejected') {
    transition('hotel', h, 'pending')
  }
  h.rejectReason = null
  hotels[idx] = h
  saveHotels(hotels)
  return h
}

export function closeHotel(hotelId) {
  const hotels = [...(db['adoga_hotels'] || [])]
  const idx = hotels.findIndex(h => h.id === hotelId)
  if (idx === -1) throw new Error('Hotel not found')
  transition('hotel', hotels[idx], 'closed')
  saveHotels(hotels)
}

export function setUnitMaintenance(hotelId, roomId, roomNo) {
  updateUnit(hotelId, roomId, roomNo, 'maintenance')
}

export function setUnitAvailable(hotelId, roomId, roomNo) {
  updateUnit(hotelId, roomId, roomNo, 'available')
}

