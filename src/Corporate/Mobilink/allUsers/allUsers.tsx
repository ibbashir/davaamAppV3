import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { deleteRequest, postRequest, putRequest } from "@/Apis/Api"
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  Plus 
} from "lucide-react"
import { motion } from "framer-motion"

type CorporateUser = {
  id: number
  card_number: string | null
  pin: string
  name: string
  mobile_number: string
  balance: number
  is_active: number
  created_at: string
  machine_code: string
}

type ApiResponse = {
  data: CorporateUser[]
  totalPages: number
  currentPage: number
  totalItems: number
}

const AllUsers = () => {
  const [users, setUsers] = useState<CorporateUser[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [activeUser, setActiveUser] = useState<CorporateUser | null>(null)

  // -------------------------
  // Add User Form State
  // -------------------------
  const [addForm, setAddForm] = useState({
    cardNumber: "",
    employeeID: "",
    name: "",
    balance: "",
    machine_code: ""
  })

  const handleAddChange = (e: any) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value })
  }

  const handleAddSubmit = async () => {
    if (!addForm.balance || !addForm.machine_code) {
      alert("Balance & Machine Code are required")
      return
    }

    try {
      await postRequest("/corporates/addCorporateUsers", addForm)

      setShowAddModal(false)
      fetchCorporateUsers(currentPage, debouncedSearch)
    } catch (err) {
      console.error("Add User Error:", err)
    }
  }

  // -------------------------
  // Edit User Form State
  // -------------------------
  const [editForm, setEditForm] = useState({
    name: "",
    mobile_number: "",
    balance: "",
    pin: ""
  })

  // -------------------------
  // Debounce search
  // -------------------------
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 800)
    return () => clearTimeout(handler)
  }, [search])

  // -------------------------
  // PinCell Component
  // -------------------------
  const PinCell = ({ pin }: { pin: string }) => {
    const [show, setShow] = useState(false)
    return (
      <td className="p-3">
        <div className="flex items-center gap-2">
          <span>{show ? pin : "•••••"}</span>
          <button 
            onClick={() => setShow(!show)} 
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </td>
    )
  }

  // -------------------------
  // Fetch users
  // -------------------------
  const fetchCorporateUsers = async (page: number, searchQuery = "") => {
    setLoading(true)
    try {
      const storedCodes = localStorage.getItem("machines")
      const machineCodes: string[] = storedCodes ? JSON.parse(storedCodes) : []

      const res = await postRequest<ApiResponse>(
        `/corporates/getAllCorporatesUsers?page=${page}&limit=${itemsPerPage}&search=${encodeURIComponent(searchQuery)}`,
        { machine_code: machineCodes }
      )

      setUsers(res.data || [])
      setTotalPages(res.totalPages || 1)
      setCurrentPage(res.currentPage || page)
      setTotalItems(res.totalItems || 0)
    } catch (error) {
      console.error("Error:", error)
      setUsers([])
      setTotalPages(1)
      setTotalItems(0)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCorporateUsers(currentPage, debouncedSearch)
  }, [currentPage, debouncedSearch, itemsPerPage])

  // -------------------------
  // Pagination Handlers
  // -------------------------
  const goToFirstPage = () => setCurrentPage(1)
  const goToLastPage = () => setCurrentPage(totalPages)
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1))
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1))

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Show first 3 pages, current page, and last 2 pages
      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i)
        }
        pageNumbers.push('...')
        pageNumbers.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pageNumbers.push(1)
        pageNumbers.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i)
        }
      } else {
        // In the middle
        pageNumbers.push(1)
        pageNumbers.push('...')
        pageNumbers.push(currentPage - 1)
        pageNumbers.push(currentPage)
        pageNumbers.push(currentPage + 1)
        pageNumbers.push('...')
        pageNumbers.push(totalPages)
      }
    }
    
    return pageNumbers
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">All Corporate Users</h2>
          <p className="text-sm text-gray-500 mt-1">
            Showing {users.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} users
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </CardHeader>

      <CardContent>
        {/* SEARCH AND FILTERS */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by Name, Phone, or Machine Code"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="items-per-page" className="text-sm whitespace-nowrap">
                Show:
              </Label>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto rounded-lg border mb-6">
          <table className="w-full border-collapse min-w-[900px]">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3 text-left">Employee ID</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Employee Pin</th>
                <th className="p-3 text-left">Balance</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center p-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-2 border-t-blue-600 border-r-transparent border-b-blue-600 border-l-blue-600 rounded-full animate-spin"></div>
                      <span className="text-gray-500">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-12 h-12 text-gray-300" />
                      <span className="text-gray-500">No users found</span>
                      {debouncedSearch && (
                        <p className="text-sm text-gray-400">
                          Try adjusting your search or filter
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="p-3">{user.mobile_number}</td>
                    <td className="p-3 font-medium">{user.name?.split(" ")[0]}</td>
                    <PinCell pin={user.pin} />
                    <td className="p-3 font-semibold">Rs. {user.balance.toLocaleString()}</td>

                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setActiveUser(user)
                            setEditForm({
                              name: user.name,
                              mobile_number: user.mobile_number,
                              balance: user.balance.toString(),
                              pin: user.pin
                            })
                            setShowEditModal(true)
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-2"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveUser(user)
                            setShowDeleteModal(true)
                          }}
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center gap-2"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {users.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} • {totalItems} total users
            </div>
            
            <div className="flex items-center gap-2">
              {/* Items per page selector */}
              <div className="flex items-center gap-2 mr-4">
                <span className="text-sm text-gray-600">Rows per page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pagination buttons */}
              <nav className="flex items-center gap-1">
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 mx-2">
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2 py-1">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page as number)}
                        className={`w-8 h-8 rounded-md flex items-center justify-center text-sm transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </nav>

              {/* Go to page input */}
              <div className="flex items-center gap-2 ml-4">
                <span className="text-sm text-gray-600">Go to:</span>
                <Input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value)
                    if (page >= 1 && page <= totalPages) {
                      setCurrentPage(page)
                    }
                  }}
                  className="w-16 h-8 text-center"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const page = parseInt(e.currentTarget.value)
                      if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page)
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ADD USER MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg shadow-xl p-6 w-[450px]"
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Corporate User
              </h2>

              <div className="flex flex-col gap-3">
                <Input name="cardNumber" placeholder="Card Number (optional)" onChange={handleAddChange} />
                <Input name="employeeID" placeholder="Employee ID (optional)" onChange={handleAddChange} />
                <Input name="name" placeholder="Employee Name" onChange={handleAddChange} />
                <Input name="balance" type="number" placeholder="Balance (required)" onChange={handleAddChange} />
                <Input name="machine_code" type="number" placeholder="Machine Code (required)" onChange={handleAddChange} />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setShowAddModal(false)} 
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                >
                  Cancel
                </button>

                <button 
                  onClick={handleAddSubmit} 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add User
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* EDIT USER MODAL */}
        {showEditModal && activeUser && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit User
              </h3>

              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input value={editForm.mobile_number} onChange={(e) => setEditForm({ ...editForm, mobile_number: e.target.value })} />
                </div>

                <div>
                  <Label>Balance</Label>
                  <Input type="number" value={editForm.balance} onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })} />
                </div>

                <div>
                  <Label>Pin</Label>
                  <Input value={editForm.pin} onChange={(e) => setEditForm({ ...editForm, pin: e.target.value })} />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  onClick={() => setShowEditModal(false)} 
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={async () => {
                    try {
                      await putRequest(`/corporates/changeCorporateUser/${activeUser.id}`, {
                        name: editForm.name,
                        mobile_number: editForm.mobile_number,
                        balance: editForm.balance,
                        pin: editForm.pin,
                        card_number: activeUser.card_number
                      })
                      setShowEditModal(false)
                      fetchCorporateUsers(currentPage, debouncedSearch)
                    } catch (error) {
                      console.error("Update Error:", error)
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE MODAL */}
        {showDeleteModal && activeUser && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
              <h3 className="text-xl font-semibold text-red-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Delete User
              </h3>

              <p className="mt-3">
                Are you sure you want to delete <strong>{activeUser.name}</strong>? This action cannot be undone.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <button
                  onClick={async () => {
                    try {
                      await deleteRequest(`/corporates/deleteCorporateUsers/${activeUser.id}`)
                      setShowDeleteModal(false)
                      fetchCorporateUsers(currentPage, debouncedSearch)
                    } catch (error) {
                      console.error("Delete Error:", error)
                    }
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AllUsers