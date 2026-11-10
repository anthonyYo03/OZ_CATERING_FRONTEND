import React from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { ItemCategory, ItemFormProps } from '../../../types/item'

// Must match the categories in the server's item model
export const categories: ItemCategory[] = ['Sandwiches', 'Salads']

// Up to 8 digits and 2 decimals, the most the database column can hold
const validAmount = /^(\d{1,8}(\.\d{0,2})?|\.\d{1,2})$/

// The fields shared by ObserverCreateItem and ObserverEditItem
export default function ObserverItemForm({ item, setItem, onSubmit, saving, submitLabel, savingLabel, cancelTo }: ItemFormProps) {
  const observerHandleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedItem = {
      ...item,
      item_name: item.item_name.trim(),
      unit_cost: item.unit_cost.trim(),
      unit_price: item.unit_price.trim(),
    }

    if (!trimmedItem.item_name || !trimmedItem.unit_cost || !trimmedItem.unit_price) {
      toast.error('Please fill in all fields')
      return
    }

    if (!validAmount.test(trimmedItem.unit_cost)) {
      toast.error('Unit cost must be a number with up to 2 decimals, e.g. 12.50')
      return
    }

    if (!validAmount.test(trimmedItem.unit_price)) {
      toast.error('Unit price must be a number with up to 2 decimals, e.g. 12.50')
      return
    }

    onSubmit(trimmedItem)
  }

  return (
    <form onSubmit={observerHandleSubmit} className="oz-panel">
      <div className="mb-3">
        <label htmlFor="item_name" className="form-label">Name</label>
        <input
          type="text"
          id="item_name"
          className="form-control"
          maxLength={255}
          autoComplete="off"
          value={item.item_name}
          onChange={e => setItem({ ...item, item_name: e.target.value })}
          placeholder="Enter the item's name"
        />
      </div>

      <div className="mb-3">
        <label htmlFor="categories" className="form-label">Category</label>
        <select
          id="categories"
          className="form-select"
          value={item.categories}
          onChange={e => setItem({ ...item, categories: e.target.value as ItemCategory })}
        >
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label htmlFor="unit_cost" className="form-label">Unit Cost</label>
        <div className="input-group">
          <span className="input-group-text">$</span>
          <input
            type="text"
            inputMode="decimal"
            id="unit_cost"
            className="form-control"
            autoComplete="off"
            value={item.unit_cost}
            onChange={e => setItem({ ...item, unit_cost: e.target.value })}
            placeholder="What the item costs you, e.g. 12.50"
          />
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="unit_price" className="form-label">Unit Price</label>
        <div className="input-group">
          <span className="input-group-text">$</span>
          <input
            type="text"
            inputMode="decimal"
            id="unit_price"
            className="form-control"
            autoComplete="off"
            value={item.unit_price}
            onChange={e => setItem({ ...item, unit_price: e.target.value })}
            placeholder="What the customer pays, e.g. 18.00"
          />
        </div>
      </div>

      <div className="d-flex gap-3 pt-2">
        <Link to={cancelTo} className="btn btn-outline-secondary">
          Cancel
        </Link>
        <button type="submit" className="btn btn-primary flex-grow-1" disabled={saving}>
          {saving ? savingLabel : submitLabel}
        </button>
      </div>
    </form>
  )
}
