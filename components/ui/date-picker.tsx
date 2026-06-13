'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DatePickerProps {
  /** Name used for the hidden input (for form submission) */
  name?: string
  /** Controlled value */
  value?: Date
  /** Default uncontrolled value */
  defaultValue?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** Earliest selectable date */
  fromDate?: Date
  /** Latest selectable date */
  toDate?: Date
}

export function DatePicker({
  name,
  value,
  defaultValue,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  className,
  fromDate,
  toDate,
}: DatePickerProps) {
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(defaultValue)
  const [open, setOpen] = React.useState(false)

  const isControlled = value !== undefined
  const selected = isControlled ? value : internalDate

  function handleSelect(date: Date | undefined) {
    if (!isControlled) setInternalDate(date)
    onChange?.(date)
    if (date) setOpen(false)
  }

  return (
    <>
      {name && (
        <input
          type="hidden"
          name={name}
          value={selected ? format(selected, 'yyyy-MM-dd') : ''}
        />
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              data-empty={!selected}
              className={cn(
                'w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground',
                className
              )}
            />
          }
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {selected ? format(selected, 'PPP') : <span>{placeholder}</span>}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            fromDate={fromDate}
            toDate={toDate}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </>
  )
}
