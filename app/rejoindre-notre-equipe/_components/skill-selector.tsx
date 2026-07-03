'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ApplicationSkill } from '@/app/actions/trainer-applications'

const LEVELS: { value: ApplicationSkill['level']; label: string }[] = [
  { value: 'DEBUTANT',      label: 'Débutant'      },
  { value: 'INTERMEDIAIRE', label: 'Intermédiaire' },
  { value: 'AVANCE',        label: 'Avancé'        },
  { value: 'EXPERT',        label: 'Expert'        },
]

interface SkillSelectorProps {
  skills: { id: string; name: string }[]
  onChange: (skills: ApplicationSkill[]) => void
}

export default function SkillSelector({ skills, onChange }: SkillSelectorProps) {
  const [selected, setSelected] = useState<Record<string, ApplicationSkill['level'] | null>>({})

  function toggleSkill(skill: { id: string; name: string }) {
    setSelected(prev => {
      const next = { ...prev }
      if (next[skill.id] !== undefined) {
        delete next[skill.id]
      } else {
        next[skill.id] = 'INTERMEDIAIRE'
      }
      const result: ApplicationSkill[] = skills
        .filter(s => next[s.id] !== undefined)
        .map(s => ({ skillId: s.id, name: s.name, level: next[s.id]! }))
      onChange(result)
      return next
    })
  }

  function setLevel(skillId: string, level: ApplicationSkill['level']) {
    setSelected(prev => {
      const next = { ...prev, [skillId]: level }
      const result: ApplicationSkill[] = skills
        .filter(s => next[s.id] !== undefined)
        .map(s => ({ skillId: s.id, name: s.name, level: next[s.id]! }))
      onChange(result)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {skills.map(skill => {
        const isSelected = selected[skill.id] !== undefined
        const level      = selected[skill.id]

        return (
          <div key={skill.id} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleSkill(skill)}
              className={[
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                isSelected
                  ? 'border-violet-600 bg-violet-50 text-violet-700'
                  : 'border-border bg-background text-foreground hover:border-violet-300',
              ].join(' ')}
            >
              <span className={[
                'h-2 w-2 rounded-full',
                isSelected ? 'bg-violet-600' : 'bg-muted-foreground/30',
              ].join(' ')} />
              {skill.name}
            </button>

            {isSelected && (
              <Select
                value={level ?? 'INTERMEDIAIRE'}
                onValueChange={v => setLevel(skill.id, v as ApplicationSkill['level'])}
              >
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map(l => (
                    <SelectItem key={l.value} value={l.value} className="text-xs">
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )
      })}
    </div>
  )
}
