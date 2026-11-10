import  { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useParams } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import { Item } from '../../../types/item'
import './items.css'

export default function GetOneItem() {
  const { id } = useParams()
  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const fetchItem = async () => {
      try {
        const response = await axios.get<Item>(`${process.env.REACT_APP_BACKEND_URL}/api/items/getOneItem/${id}`, { withCredentials: true, signal: controller.signal })
        setItem(response.data)
        setLoading(false)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setError(err.response?.data?.message || 'Could not load this item.')
        setLoading(false)
        console.error(err)
      }
    }

    fetchItem()
    return () => controller.abort()
  }, [id])

  return (
    <div className="min-vh-100">
      <header className="oz-topbar">
        <div className="container">
          <img src={logo} alt="OZ by ozarome" className="oz-topbar-logo" />
        </div>
      </header>

      <main className="container py-5">
        <div className="item-page">
          <Link to="/items" className="oz-back-link">&larr; Items</Link>

          {loading && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading item...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {item && (
            <>
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
                <div className="item-title">
                  <h1 className="oz-page-title">{item.item_name}</h1>
                  <p className="oz-eyebrow mb-0">Item details</p>
                </div>
                <Link to={`/items/${item.item_id}/edit`} className="btn btn-primary">
                  Edit
                </Link>
              </div>

              <dl className="oz-panel oz-details">
                <div className="oz-details-row">
                  <dt>Name</dt>
                  <dd>{item.item_name}</dd>
                </div>
                <div className="oz-details-row">
                  <dt>Category</dt>
                  <dd>{item.categories}</dd>
                </div>
                <div className="oz-details-row">
                  <dt>Unit Cost</dt>
                  <dd>${item.unit_cost}</dd>
                </div>
                <div className="oz-details-row">
                  <dt>Unit Price</dt>
                  <dd>{item.unit_price !== null ? `$${item.unit_price}` : 'Not set'}</dd>
                </div>
              </dl>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
