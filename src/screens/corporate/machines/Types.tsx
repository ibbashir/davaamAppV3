// Machine types
export type ApiMachine = {
  id: number
  machine_code: number
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
  lastUpdated: number | null
}

// Brand / Stock types
export type LatestFilling = {
  id: number
  brand_id: number
  litres?: string
  quantity?: number
  created_at: string
  epoch_time: number
  batch_number: string
  expiry_date: string
  stockedby: string | null
}

export type DispensingBrand = {
  id: number
  name: string
  image: string
  litre_price: string
  machine_code: number
  row_num: number
  location_name: string | null
  map_location: string | null
  latestFilling: LatestFilling | null
  brandType: "dispensing"
  totalTransactions: string | null
  availableQuantity: number
}

export type VendingBrand = {
  id: number
  name: string
  image: string
  price: string
  machine_code: number
  row_num: number
  location_name: string | null
  location_link: string | null
  latestFilling: LatestFilling | null
  brandType: "vending"
  totalTransactions: string | null
  availableQuantity: number
}

// API response for Machines list
export type MachinesResponse = {
  success: boolean
  data: {
    machines: {
      [category: string]: ApiMachine[]
    }
    brands: {
      dispensing: DispensingBrand[]
      vending: VendingBrand[]
    }
  }
}

// Visit page types
export type MachineBrand = {
  id: number
  name: string
  availableQuantity: number
  price: number
}

export type MachineTransaction = {
  id: number
  user: string
  amount: number
  date: string
}

export type MachineFilling = {
  id: number
  batch_number: string
  quantity?: number
  litres?: string
}

export type MachineDetails = {
  machine_code: number
  machine_name: string
  machine_type: string
  statusCode: string
  created_at: string
  brands: MachineBrand[]
  fillings: MachineFilling[]
  transactions: MachineTransaction[]
}
