import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { deleteRequest, postRequest, putRequest } from "@/Apis/Api"
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,Eye, EyeOff } from "lucide-react"
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal,setShowAddModal]=useState(false);

    const [editForm, setEditForm] = useState({
    name: "",
    mobile_number: "",
    balance: "",
    pin: "",
    });

  // ⏳ Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 800)
    return () => clearTimeout(handler)
  }, [search])

  const PinCell = ({ pin }: { pin: string }) => {
  const [show, setShow] = useState(false);

  return (
    <td className="p-3">
      <div className="flex items-center gap-2">
        <span>{show ? pin : "•••••"}</span>

        <button
          onClick={() => setShow(!show)}
          className="p-1 hover:bg-gray-200 rounded"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </td>
  );
};


  const fetchCorporateUsers = async (page: number, searchQuery = "") => {
    setLoading(true)
    try {
      const storedCodes = localStorage.getItem("machines")
      const machineCodes: string[] = storedCodes ? JSON.parse(storedCodes) : []

      const res = await postRequest<ApiResponse>(
        `/corporates/getAllCorporatesUsers?page=${page}&limit=${itemsPerPage}&search=${encodeURIComponent(
          searchQuery
        )}`,
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

  const [activeUser, setActiveUser] = useState<CorporateUser | null>(null)

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">All Corporate Users</h2>
      </CardHeader>
      <CardHeader className="flex flex-col gap-2">
            <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm w-fit"
            >
                Add User
            </button>

            <h2 className="text-xl font-semibold">All Corporate Users</h2>
        </CardHeader>

      <CardContent>
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by Name, Phone, or Machine Code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto rounded-lg border">
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
                  <td colSpan={6} className="text-center p-6">Loading...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-6">No users found</td>
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
                    
                    <td className="p-3 font-semibold">Rs. {user.balance}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                            setActiveUser(user);
                            setEditForm({
                            name: user.name,
                            mobile_number: user.mobile_number,
                            balance: user.balance.toString(),
                            pin: user.pin
                            });
                            setShowEditModal(true);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                        Edit
                        </button>

                        <button
                        onClick={() => {
                            setActiveUser(user);
                            setShowDeleteModal(true);
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm ml-2"
                        >
                        Delete
                        </button>

                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {users.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="hidden lg:flex text-sm text-muted-foreground">
              Showing {users.length} of {totalItems} users
            </div>

            <div className="flex gap-4 items-center">
              {/* Rows per page */}
              <div className="hidden lg:flex items-center gap-2">
                <Label>Rows</Label>
                <Select
                  value={`${itemsPerPage}`}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder={itemsPerPage} />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50, 100].map((n) => (
                      <SelectItem key={n} value={`${n}`}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Page info */}
              <div>
                Page {currentPage} of {totalPages}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 border rounded disabled:opacity-30"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border rounded disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded disabled:opacity-30"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        {/* EDIT USER MODAL */}
        {showEditModal && activeUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4">Edit User</h3>

            <div className="space-y-3">
                <div>
                <Label>Name</Label>
                <Input
                    value={editForm.name}
                    onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                    }
                />
                </div>

                <div>
                <Label>Phone</Label>
                <Input
                    value={editForm.mobile_number}
                    onChange={(e) =>
                    setEditForm({ ...editForm, mobile_number: e.target.value })
                    }
                />
                </div>

                <div>
                <Label>Balance</Label>
                <Input
                    type="number"
                    value={editForm.balance}
                    onChange={(e) =>
                    setEditForm({ ...editForm, balance: e.target.value })
                    }
                />
                </div>

                <div>
                <Label>Pin</Label>
                <Input
                    value={editForm.pin}
                    onChange={(e) =>
                    setEditForm({ ...editForm, pin: e.target.value })
                    }
                />
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
                <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-100 rounded-lg"
                >
                Cancel
                </button>

                <button
                onClick={async () => {
                    try {
                    await putRequest(
                        `/corporates/changeCorporateUser/${activeUser.id}`,
                        {
                        name: editForm.name,
                        mobile_number: editForm.mobile_number,
                        balance: editForm.balance,
                        pin: editForm.pin,
                        card_number: activeUser.card_number,
                        }
                    );

                    setShowEditModal(false);
                    fetchCorporateUsers(currentPage, debouncedSearch); // refresh data
                    } catch (error) {
                    console.error("Update Error:", error);
                    }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                Save Changes
                </button>
            </div>
            </div>
        </div>
        )}


        {/* DELETE CONFIRMATION MODAL */}
        {showDeleteModal && activeUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-xl font-semibold text-red-600">Delete User</h3>

            <p className="mt-3">
                Are you sure you want to delete user{" "}
                <strong>{activeUser.name}</strong>? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
                <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-100 rounded-lg"
                >
                Cancel
                </button>

                <button
                onClick={async () => {
                    try {
                    await deleteRequest(
                        `/corporates/deleteCorporateUsers/${activeUser.id}`
                    );

                    setShowDeleteModal(false);
                    fetchCorporateUsers(currentPage, debouncedSearch); // refresh table
                    } catch (error) {
                    console.error("Delete Error:", error);
                    }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
                >
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
