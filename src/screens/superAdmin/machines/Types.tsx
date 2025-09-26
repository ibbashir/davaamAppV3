// Machine types
type ApiMachine = {
    id: number
    machine_code: string
    machine_name: string
    machine_location: string
    machine_type: string
    created_at: number
    is_active: string
    lat: number | null
    lng: number | null
    access: string | null
    status: string
    statusCode: string
    lastUpdated: number
}

// Brand types
type LatestFilling = {
    id: number
    brand_id: number
    litres?: string
    quantity?: number
    created_at: string
    epoch_time: number
    batch_number: string
    expiry_date: string
    stockedby: string | null
    lastBatchRefill: number | null
    currentStock: number | null
}

type DispensingBrand = {
    id: number
    name: string
    image: string
    litre_price: string
    machine_code: string
    row_num: number
    location_name: string | null
    map_location: string | null
    latestFilling: LatestFilling | null
    brandType: "dispensing"
    totalTransactions: string | null
    availableQuantity: number
}

type VendingBrand = {
    id: number
    name: string
    image: string
    price: string
    machine_code: string
    row_num: number
    location_name: string | null
    location_link: string | null
    latestFilling: LatestFilling | null
    brandType: "vending"
    totalTransactions: string | null
    availableQuantity: number
}

type StatusSummary = {
    online: number
    offline: number
    idle: number
}

// Main API response type
type MachinesResponse = {
    success: boolean
    data: {
        machines: {
            [category: string]: ApiMachine[]
        }
        brands: {
            dispensing: DispensingBrand[]
            vending: VendingBrand[]
        }
        statusSummary: StatusSummary
    }
}

export type { ApiMachine, MachinesResponse, DispensingBrand, VendingBrand, StatusSummary, LatestFilling }
