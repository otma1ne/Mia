import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export function getWeekRange(refDate: Date) {
  return {
    from: startOfWeek(refDate, { weekStartsOn: 1 }),
    to: endOfWeek(refDate, { weekStartsOn: 1 }),
  }
}

export function getMonthRange(refDate: Date) {
  return {
    from: startOfMonth(refDate),
    to: endOfMonth(refDate),
  }
}
