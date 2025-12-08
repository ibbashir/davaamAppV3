import React, { useState, useEffect } from "react";
import { BASE_URL } from "@/constants/Constant";
import { getRequest, postRequest } from "@/Apis/Api";

const AddMaintenanceSchedule = () => {
  const [machine_code, setMachineCode] = useState("");
  const [alignedTo, setAlignedTo] = useState("");  // this will store role_id
  const [datetime, setDatetime] = useState("");

  const [roles, setRoles] = useState([]);          // for dropdown
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("accessToken");

  const fetchRoles = async () => {
    try {
      const res = await getRequest(`${BASE_URL}/api/stockApp/getAllStockRoles`);

      setRoles(res.data?.data || []); // assuming API returns {data:[...]}
    } catch (error) {
      console.log("Error fetching roles:", error);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await postRequest(
        `${BASE_URL}/api/stockApp/postRequestForAdmin`,
        {
          machine_code,
          alignedTo, // sending role_id
          datetime,
        }
      );

      if (res.status === 200) {
        setMessage("Schedule added successfully!");
        setMachineCode("");
        setAlignedTo("");
        setDatetime("");
      }
    } catch (err) {
      console.log(err);
      setMessage("Error adding schedule.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">

      <div className="flex-1 p-10">
        <div className="max-w-xl mx-auto bg-white shadow-lg rounded-lg p-6">

          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Add Maintenance Schedule
          </h2>

          {message && (
            <div
              className={`mb-4 p-3 rounded ${
                message.includes("success")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Machine Code */}
            <div>
              <label className="block text-gray-600 mb-1">Machine Code</label>
              <input
                type="text"
                value={machine_code}
                onChange={(e) => setMachineCode(e.target.value)}
                className="w-full border p-2 rounded outline-none"
                required
              />
            </div>

            {/* Aligned To (Username dropdown) */}
            <div>
              <label className="block text-gray-600 mb-1">Assign To</label>

              <select
                value={alignedTo}
                onChange={(e) => setAlignedTo(e.target.value)}
                className="w-full border p-2 rounded outline-none"
                required
              >
                <option value="">Select User</option>

                {roles.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-gray-600 mb-1">
                Maintenance Date & Time
              </label>
              <input
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                className="w-full border p-2 rounded outline-none"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              {loading ? "Saving..." : "Add Schedule"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default AddMaintenanceSchedule;
