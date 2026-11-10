import  { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import logo from '../../../assets/oz-logo-white.png'
import { ItemData } from '../../../types/item'
import ItemForm from './ItemForm'
import './items.css'

export default function CreateItem() {
  const navigate = useNavigate()
  const [item, setItem] = useState<ItemData>({
    item_name: '',
    categories: 'Sandwiches',
    unit_cost: '',
    unit_price: '',
  })
  const [saving, setSaving] = useState(false)

  const handleCreate = async (newItem: ItemData) => {
    setSaving(true)
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/items/createItem`, newItem, { withCredentials: true })
      toast.success('Item created!')
      navigate('/items', { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not create the item.')
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
          <Link to="/items" className="oz-back-link">&larr; Items</Link>

          <div className="mb-4">
            <h1 className="oz-page-title">New Item</h1>
            <p className="oz-eyebrow mb-0">All fields are required</p>
          </div>

          <ItemForm
            item={item}
            setItem={setItem}
            onSubmit={handleCreate}
            saving={saving}
            submitLabel="Create Item"
            savingLabel="Creating..."
            cancelTo="/items"
          />
        </div>
      </main>
    </div>
  )
}
