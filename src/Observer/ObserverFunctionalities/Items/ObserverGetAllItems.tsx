import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import SearchSelect from '../../../components/SearchSelect'
import { Item, ItemCategoryFilter } from '../../../types/item'
import { categories } from './ObserverItemForm'
import './ObserverItems.css'

export default function ObserverGetAllItems() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ItemCategoryFilter>('All')

  useEffect(() => {
    const controller = new AbortController()

    const observerFetchItems = async () => {
      try {
        const response = await axios.get<Item[]>(`${process.env.REACT_APP_BACKEND_URL}/api/items/getItems`, { withCredentials: true, signal: controller.signal })
        setItems(response.data)
        setLoading(false)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setError(err.response?.data?.message || 'Could not load items.')
        setLoading(false)
        console.error(err)
      }
    }

    observerFetchItems()
    return () => controller.abort()
  }, [])

  const visibleItems = categoryFilter === 'All' ? items : items.filter(item => item.categories === categoryFilter)

  return (
    <div className="min-vh-100">
      <header className="oz-topbar">
        <div className="container">
          <img src={logo} alt="OZ by ozarome" className="oz-topbar-logo" />
        </div>
      </header>

      <main className="container py-5 oz-page-with-fab">
        <div className="item-page">
          <Link to="/observerDashboard" className="oz-back-link">&larr; Dashboard</Link>

          <div className="mb-4">
            <h1 className="oz-page-title">Items</h1>
            <p className="oz-eyebrow mb-0">Select an item to see its details</p>
          </div>

          {loading && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading items...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {!loading && !error && items.length === 0 && (
            <p className="oz-empty-state">No items yet. Press + to add your first one.</p>
          )}

          {items.length > 0 && (
            <div className="mb-3">
              <label htmlFor="item_search" className="form-label">Search items</label>
              <SearchSelect
                id="item_search"
                value=""
                options={visibleItems.map(item => ({ value: String(item.item_id), label: item.item_name }))}
                onChange={itemId => navigate(`/observer/items/${itemId}`)}
                placeholder="Search by item name"
                noMatchText="No items found"
              />
            </div>
          )}

          {items.length > 0 && (
            <div className="item-filter mb-3">
              <label htmlFor="category_filter" className="form-label">Filter by category</label>
              <select
                id="category_filter"
                className="form-select"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value as ItemCategoryFilter)}
              >
                <option value="All">All</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          )}

          {items.length > 0 && visibleItems.length === 0 && (
            <p className="oz-empty-state">No {categoryFilter.toLowerCase()} yet. Press + to add one.</p>
          )}

          {visibleItems.length > 0 && (
            <ul className="oz-list">
              {visibleItems.map(item => (
                <li key={item.item_id}>
                  <Link to={`/observer/items/${item.item_id}`} className="oz-list-row">
                    <span className="oz-list-row-title">{item.item_name}</span>
                    <span className="oz-list-row-arrow" aria-hidden="true">&rarr;</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Link to="/observer/items/create" className="oz-fab" aria-label="Add item" title="Add item">+</Link>
    </div>
  )
}
