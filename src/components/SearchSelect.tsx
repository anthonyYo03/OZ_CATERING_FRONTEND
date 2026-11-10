import React, { useEffect, useRef, useState } from 'react'

export interface SearchSelectOption {
  value: string,
  label: string,
  searchText?: string,  // what typing is matched against, if it differs from the label
  disabled?: boolean
}

interface SearchSelectProps {
  id: string,
  value: string,
  options: SearchSelectOption[],
  onChange: (value: string) => void,
  placeholder: string,
  noMatchText: string
}

const normalize = (text: string) => text.trim().toLowerCase()

// A search box that suggests matching options as you type and stores the chosen option's value.
export default function SearchSelect({ id, value, options, onChange, placeholder, noMatchText }: SearchSelectProps) {
  const [query, setQuery] = useState('')
  const [typing, setTyping] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const listRef = useRef<HTMLUListElement>(null)

  const listId = `${id}_suggestions`
  const selectedOption = options.find(option => option.value === value)
  const search = normalize(query)
  const open = typing && search !== ''
  const searchTextOf = (option: SearchSelectOption) => normalize(option.searchText ?? option.label)

  // The label check lets someone backspace through a selected "Name - $5.00" and still get a match
  const suggestions = !open ? [] : options
    .filter(option => searchTextOf(option).includes(search) || normalize(option.label).startsWith(search))
    .sort((a, b) => Number(searchTextOf(b).startsWith(search)) - Number(searchTextOf(a).startsWith(search)))

  useEffect(() => {
    if (activeIndex >= 0) listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const stopTyping = () => {
    setTyping(false)
    setQuery('')
    setActiveIndex(-1)
  }

  const choose = (option: SearchSelectOption) => {
    stopTyping()
    onChange(option.value)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setTyping(true)
    setActiveIndex(-1)
    // The text no longer names the selected option, so it must not stay selected
    if (value) onChange('')
  }

  // Leaving the box without picking clears the text, unless it is exactly the name of an option
  const handleBlur = () => {
    if (!typing) return
    const exactMatch = options.find(option => !option.disabled && searchTextOf(option) === search)
    stopTyping()
    if (exactMatch) onChange(exactMatch.value)
  }

  const moveActive = (step: 1 | -1) => {
    const count = suggestions.length
    let next = activeIndex === -1 && step === -1 ? 0 : activeIndex
    for (let tried = 0; tried < count; tried++) {
      next = (next + step + count) % count
      if (!suggestions[next].disabled) {
        setActiveIndex(next)
        return
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      moveActive(e.key === 'ArrowDown' ? 1 : -1)
    } else if (e.key === 'Enter') {
      // Enter picks a suggestion here. It must not submit the invoice.
      e.preventDefault()
      const pick = suggestions[activeIndex] ?? suggestions.find(option => !option.disabled)
      if (pick) choose(pick)
    } else if (e.key === 'Escape') {
      stopTyping()
    }
  }

  return (
    <div className="oz-search-select">
      <input
        type="text"
        id={id}
        className="form-control"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? `${listId}_${activeIndex}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={typing ? query : selectedOption?.label ?? ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={e => e.target.select()}
        onBlur={handleBlur}
      />

      {open && (
        // Pressing inside the list must not take focus from the box, or the blur would close it before the click lands
        <ul className="oz-search-select-list" id={listId} role="listbox" ref={listRef} onMouseDown={e => e.preventDefault()}>
          {suggestions.length === 0 && <li className="oz-search-select-empty">{noMatchText}</li>}
          {suggestions.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}_${index}`}
              role="option"
              aria-selected={index === activeIndex}
              aria-disabled={option.disabled}
              className={`oz-search-select-option${index === activeIndex ? ' is-active' : ''}${option.disabled ? ' is-disabled' : ''}`}
              onClick={() => !option.disabled && choose(option)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
