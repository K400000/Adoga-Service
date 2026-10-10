// src/utils/stateMachine.js
// All transition rules — NEVER write x.status = '...' directly outside services/transitions.js
export const TRANSITIONS = {
  hotel:   {
    pending:   ['approved', 'rejected'],
    approved:  ['pending', 'suspended', 'closed'],
    rejected:  ['pending'],
    suspended: ['approved'],
    closed:    [],
  },
  room:    {
    available:   ['booked', 'maintenance'],
    booked:      ['available'],
    maintenance: ['available'],
  },
  booking: {
    pending_payment: ['confirmed', 'cancelled'],
    confirmed:       ['completed', 'cancelled'],
    completed:       [],
    cancelled:       [],
  },
  payment: {
    awaiting:  ['verifying'],
    verifying: ['success', 'failed'],
    failed:    ['awaiting', 'verifying'],
    success:   ['refunded'],
    refunded:  [],
  },
  refund:  {
    submitted: ['reviewing'],
    reviewing: ['approved', 'rejected'],
    approved:  [],
    rejected:  [],
  },
}

export function transition(entity, record, to) {
  const currentStatus = entity === 'payment' ? (record.paymentStatus || record.status) : record.status
  const allowed = TRANSITIONS[entity]?.[currentStatus] ?? []
  if (!allowed.includes(to)) {
    throw new Error(`[StateMachine] Invalid transition: ${entity} ${currentStatus} → ${to}`)
  }
  if (!record.statusHistory) record.statusHistory = []
  record.statusHistory.push({ entity, from: currentStatus, to, at: new Date().toISOString() })
  if (entity === 'payment') {
    record.paymentStatus = to
  } else {
    record.status = to
  }
  return record
}
