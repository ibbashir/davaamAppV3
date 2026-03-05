import React, { useState, useEffect } from "react";
import { BASE_URL } from "@/constants/Constant";
import { getRequest, postRequest } from "@/Apis/Api";
import {
  Calendar,
  Clock,
  Users,
  Package,
  Droplets,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  MapPin,
  UserPlus,
  CalendarDays
} from "lucide-react";

const AddMaintenanceSchedule = () => {
  const [formData, setFormData] = useState({
    machine_code: "",
    alignedTo: "",
    datetime: ""
  });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [vendingMachines, setVendingMachines] = useState([]);
  const [sanitaryMachines, setSanitaryMachines] = useState([]);
  const [selectedType, setSelectedType] = useState("vending");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fetchRoles = async () => {
    try {
      const res = await getRequest(
        `${BASE_URL}/fulfillment/getAllStockRolesForAdmin`
      );
      setRoles(res.data || []);

      const getAllMachines = await getRequest(
        `${BASE_URL}/fulfillment/getAllMachinesForAdmin`
      );
      setVendingMachines(getAllMachines.vendingMachines || []);
      setSanitaryMachines(getAllMachines.sanitaryMachines || []);
    } catch (error) {
      console.log("Error fetching data:", error);
      setMessage({
        text: "Failed to load machine data",
        type: "error"
      });
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });
    setIsSubmitted(false);

    try {
      const res = await postRequest(
        `${BASE_URL}/fulfillment/postRequestForAdmin`,
        formData
      );

      if (res.status === 200) {
        setMessage({
          text: "Schedule added successfully!",
          type: "success"
        });
        setIsSubmitted(true);
        // Reset form
        setFormData({
          machine_code: "",
          alignedTo: "",
          datetime: ""
        });
        
        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setMessage({ text: "", type: "" });
        }, 5000);
      }
    } catch (err) {
      console.log(err);
      setMessage({
        text: "Error adding schedule. Please try again.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const machines = selectedType === "vending" ? vendingMachines : sanitaryMachines;

  // Format date for min attribute (must be future date)
  const today = new Date().toISOString().slice(0, 16);

  // Stats for header
  const stats = {
    vending: vendingMachines.length,
    sanitary: sanitaryMachines.length,
    total: vendingMachines.length + sanitaryMachines.length,
    users: roles.length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Schedule Maintenance
              </h1>
              <p className="text-gray-600">
                Assign maintenance tasks to team members
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CalendarDays className="w-4 h-4" />
                <span>{new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Machines</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.total}
                  </p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Package className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </div>

            <div 
              onClick={() => setSelectedType("vending")}
              className={`bg-white rounded-xl shadow-sm p-4 border cursor-pointer transition-all hover:shadow-md ${
                selectedType === "vending" 
                  ? "border-blue-500 ring-2 ring-blue-100" 
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Vending Machines</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.vending}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${
                  selectedType === "vending" ? "bg-blue-100" : "bg-gray-100"
                }`}>
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div 
              onClick={() => setSelectedType("sanitary")}
              className={`bg-white rounded-xl shadow-sm p-4 border cursor-pointer transition-all hover:shadow-md ${
                selectedType === "sanitary" 
                  ? "border-teal-500 ring-2 ring-teal-100" 
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Sanitary Machines</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.sanitary}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${
                  selectedType === "sanitary" ? "bg-teal-100" : "bg-gray-100"
                }`}>
                  <Droplets className="w-5 h-5 text-teal-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Available Staff</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.users}
                  </p>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  New Maintenance Schedule
                </h2>
                <p className="text-blue-100 text-sm">
                  Fill in the details below to schedule maintenance
                </p>
              </div>
            </div>
          </div>

          {/* Message Alert */}
          {message.text && (
            <div className={`mx-6 mt-6 p-4 rounded-xl border ${
              message.type === "success"
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}>
              <div className="flex items-center gap-3">
                {message.type === "success" ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <p className={`font-medium ${
                  message.type === "success" ? "text-green-700" : "text-red-700"
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Machine Type Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Machine Type
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedType("vending")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                    selectedType === "vending"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  <Package className="w-5 h-5" />
                  <span className="font-medium">Vending Machines</span>
                  <span className="text-sm px-2 py-0.5 bg-white/50 rounded-full">
                    {vendingMachines.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedType("sanitary")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                    selectedType === "sanitary"
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  <Droplets className="w-5 h-5" />
                  <span className="font-medium">Sanitary Machines</span>
                  <span className="text-sm px-2 py-0.5 bg-white/50 rounded-full">
                    {sanitaryMachines.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Machine Selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Package className="w-4 h-4" />
                Select Machine
              </label>
              <div className="relative">
                <select
                  name="machine_code"
                  value={formData.machine_code}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none"
                  required
                  disabled={machines.length === 0}
                >
                  <option value="">Choose a machine...</option>
                  {machines.length > 0 ? (
                    machines.map((m) => (
                      <option key={m.machine_code} value={m.machine_code}>
                        {m.machine_code} - {m.location_name || "No location specified"}
                      </option>
                    ))
                  ) : (
                    <option disabled>Loading machines...</option>
                  )}
                </select>
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Package className="w-5 h-5 text-gray-400" />
                </div>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {formData.machine_code && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>
                    {machines.find(m => m.machine_code === formData.machine_code)?.location_name || "Location not specified"}
                  </span>
                </div>
              )}
            </div>

            {/* User Assignment */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <UserPlus className="w-4 h-4" />
                Assign To Team Member
              </label>
              <div className="relative">
                <select
                  name="alignedTo"
                  value={formData.alignedTo}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none"
                  required
                >
                  <option value="">Select team member...</option>
                  {roles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.username}
                    </option>
                  ))}
                </select>
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4" />
                Schedule Date & Time
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  name="datetime"
                  value={formData.datetime}
                  onChange={handleChange}
                  min={today}
                  className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  required
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select a future date and time for maintenance
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || isSubmitted}
                className={`w-full py-3.5 px-4 rounded-xl font-medium text-white transition-all flex items-center justify-center gap-3 ${
                  loading || isSubmitted
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Schedule...
                  </>
                ) : isSubmitted ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Schedule Created!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Create Maintenance Schedule
                  </>
                )}
              </button>
              
              {!loading && !isSubmitted && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  This will notify the assigned team member about the scheduled maintenance
                </p>
              )}
            </div>
          </form>

          {/* Preview Card */}
          {(formData.machine_code || formData.alignedTo || formData.datetime) && (
            <div className="mx-6 mb-6 p-5 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Schedule Preview
              </h3>
              <div className="space-y-3">
                {formData.machine_code && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Machine</p>
                      <p className="font-medium">{formData.machine_code}</p>
                    </div>
                  </div>
                )}
                {formData.alignedTo && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <UserPlus className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Assigned To</p>
                      <p className="font-medium">
                        {roles.find(r => r.id === formData.alignedTo)?.username || "User"}
                      </p>
                    </div>
                  </div>
                )}
                {formData.datetime && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Calendar className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Scheduled For</p>
                      <p className="font-medium">
                        {new Date(formData.datetime).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddMaintenanceSchedule;