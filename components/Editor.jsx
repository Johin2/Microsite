'use client'

import { useState } from 'react'

export function Editor({ initialValue = '', label = 'Notes', onChange = () => {} }) {
  const [value, setValue] = useState(initialValue)

  return (
    <label className="flex flex-col gap-2 text-sm text-neutral-300">
      <span className="font-medium">{label}</span>
      <textarea
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          onChange?.(event.target.value)
        }}
        rows={8}
        className="min-h-[12rem] w-full rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 text-sm text-neutral-100"
        placeholder="Share context, assumptions, or manual updates"
      />
    </label>
  )
}
