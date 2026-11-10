export type ItemCategory = 'Sandwiches' | 'Salads'

export type ItemCategoryFilter = ItemCategory | 'All'

export interface ItemData {
    item_name: string,
    categories: ItemCategory,
    unit_cost: string,
    unit_price: string
}

// unit_price can be null on older items that were created before it existed
export interface Item extends Omit<ItemData, 'unit_price'> {
    item_id: number,
    unit_price: string | null,
    createdAt: string,
    updatedAt: string
}

export interface ItemFormProps {
    item: ItemData,
    setItem: (item: ItemData) => void,
    onSubmit: (item: ItemData) => void,
    saving: boolean,
    submitLabel: string,
    savingLabel: string,
    cancelTo: string
}
