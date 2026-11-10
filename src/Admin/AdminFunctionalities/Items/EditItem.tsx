import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Link, useNavigate, useParams } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import { Item, ItemData } from '../../../types/item'
import ItemForm from './ItemForm'
import './items.css'

export default function EditItem() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState<ItemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    const fetchItem = async () => {
      try {
        const response = await axios.get<Item>(`${process.env.REACT_APP_BACKEND_URL}/api/items/getOneItem/${id}`, { withCredentials: true, signal: controller.signal })
        const { item_name, categories, unit_cost, unit_price } = response.data
        setItem({ item_name, categories, unit_cost, unit_price: unit_price ?? '' })
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

  const handleUpdate = async (updatedItem: ItemData) => {
    setSaving(true)
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/items/updateItem/${id}`, updatedItem, { withCredentials: true })
      toast.success('Item updated!')
      navigate(`/items/${id}`, { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not update the item.')
      console.error(err)
      setSaving(false)
    }
  }

  return (
    <div className="min-vh-100">
      <header className="oz-topbar">
        <div className="container">
          <img src={logo} alt="OZ by ozarome" className="oz-topbar-logo" />
        </div>
      </header>

      <main className="container py-5">
        <div className="item-page">
          <Link to={`/items/${id}`} className="oz-back-link">&larr; Item details</Link>

          <div className="mb-4">
            <h1 className="oz-page-title">Edit Item</h1>
            <p className="oz-eyebrow mb-0">All fields are required</p>
          </div>

          {loading && (
            <div className="oz-spinner spinner-border" role="status">
              <span className="visually-hidden">Loading item...</span>
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          {item && (
            <ItemForm
              item={item}
              setItem={setItem}
              onSubmit={handleUpdate}
              saving={saving}
              submitLabel="Save Changes"
              savingLabel="Saving..."
              cancelTo={`/items/${id}`}
            />
          )}
        </div>
      </main>
    </div>
  )
}
