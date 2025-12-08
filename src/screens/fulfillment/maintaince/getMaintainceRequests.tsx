import React, { useEffect, useState } from "react";
import { LOCAL_BASE_URL } from "@/constants/Constant";
import { getRequest } from "@/Apis/Api";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Wrench, 
  User, 
  Calendar,
  ChevronRight,
  Filter,
  RefreshCw
} from "lucide-react";

const AdminMaintenanceRequests = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({ pending: 0, fulfilled: 0 });

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (type) => {
    setLoading(true);
    setError("");
    try {
      const apiURL =
        type === "pending"
          ? `${LOCAL_BASE_URL}/fulfillment/getPendingRequestForAdmin`
          : `${LOCAL_BASE_URL}/fulfillment/getFullfilledRequestForAdmin`;

      const res = await getRequest(apiURL);
      
      // Update stats based on fetched data
      if (type === "pending") {
        setStats(prev => ({ ...prev, pending: res?.data?.length || 0 }));
      } else {
        setStats(prev => ({ ...prev, fulfilled: res?.data?.length || 0 }));
      }
      console.log(data)
      setData(res?.data || []);
    } catch (err) {
      console.log(err);
      setError("Unable to fetch data. Please try again.");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      in_progress: "bg-blue-100 text-blue-800 border-blue-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200"
    };
    return statusMap[status.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status) => {
    switch(status.toLowerCase()) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <Wrench className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleRefresh = () => {
    fetchData(activeTab);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Maintenance Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage and track maintenance requests</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Requests</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.pending + stats.fulfilled}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Wrench className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab("pending")}
              className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500 cursor-pointer transition-transform hover:scale-[1.02] ${
                activeTab === "pending" ? "ring-2 ring-yellow-300" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.pending}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </div>

            <div 
              onClick={() => setActiveTab("fulfilled")}
              className={`bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500 cursor-pointer transition-transform hover:scale-[1.02] ${
                activeTab === "fulfilled" ? "ring-2 ring-green-300" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Fulfilled</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stats.fulfilled}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Tab Header */}
          <div className="border-b border-gray-200">
            <div className="px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setActiveTab("pending")}
                    className={`px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                      activeTab === "pending"
                        ? "bg-yellow-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Pending Requests
                    <span className="ml-1 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                      {stats.pending}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab("fulfilled")}
                    className={`px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                      activeTab === "fulfilled"
                        ? "bg-green-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Fulfilled Requests
                    <span className="ml-1 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                      {stats.fulfilled}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Loading & Error States */}
          <div className="px-6 py-4">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600">Loading requests...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Data Cards/Table */}
          {!loading && data.length > 0 && (
            <div className="px-6 pb-6">
              <div className="grid gap-4">
                {data.map((req) => {
                  const { date, time } = formatDate(req.request_date);
                  const {date:completeDate,time:completeTime}=formatDate(req.completion_time);
                  return (
                    <div
                      key={req.id}
                      className="group bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-300"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="font-bold text-blue-600">#{req.id}</span>
                              </div>
                              <h3 className="font-semibold text-lg text-gray-900">
                                {req.machine_code}
                              </h3>
                            </div>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${getStatusColor(req.request_status)}`}>
                              {getStatusIcon(req.request_status)}
                              <span className="text-sm font-medium capitalize">
                                {req.request_status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Assigned To</p>
                                <p className="font-medium text-gray-900 uppercase">{req.username}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Requested At</p>
                                <p className="font-medium text-gray-900">{date}</p>
                                <p className="text-xs text-gray-500">{time}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Completed At</p>
                                <p className="font-medium text-gray-900">{completeDate}</p>
                                <p className="text-xs text-gray-500">{completeTime}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Complete Status</p>
                                <p className="font-medium text-gray-900">ON TIME</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && data.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Wrench className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No {activeTab === "pending" ? "Pending" : "Fulfilled"} Requests
              </h3>
              <p className="text-gray-500 text-center max-w-md">
                {activeTab === "pending" 
                  ? "All maintenance requests have been addressed. Great work!"
                  : "No fulfilled requests found. Complete pending requests to see them here."}
              </p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminMaintenanceRequests;