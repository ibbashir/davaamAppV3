import React, { useState, useEffect } from 'react';
import CashCollectionTable from './components/cashCollectionTable';
import { getRequest } from '@/Apis/Api';
import { LOCAL_BASE_URL } from '@/constants/Constant';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, PieChart as PieChartIcon, 
  BarChart as BarChartIcon, DollarSign,
  Download, RefreshCw, FileText
} from 'lucide-react';

const CashCollectionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('table');
  const [data, setData] = useState<CashCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getRequest(`/fulfillment/getAllCashCollection`);
      
      if (result.success) {
        setData(result.data);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError('Error fetching data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Prepare chart data
  const chartData = data.reduce((acc, item) => {
    const date = new Date(item.created_at).toLocaleDateString();
    const existing = acc.find(d => d.date === date);
    const amount = parseFloat(item.cash_received);
    
    if (existing) {
      existing.amount += amount;
      existing.count += 1;
    } else {
      acc.push({ date, amount, count: 1 });
    }
    
    return acc;
  }, [] as { date: string; amount: number; count: number }[]);

  // Prepare user distribution data
  const userDistribution = Object.entries(
    data.reduce((acc, item) => {
      acc[item.username] = (acc[item.username] || 0) + parseFloat(item.cash_received);
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Prepare location distribution data
  const locationDistribution = Object.entries(
    data.reduce((acc, item) => {
      acc[item.location] = (acc[item.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const handleExport = (exportData: CashCollection[]) => {
    const csvContent = [
      ['ID', 'User ID', 'Username', 'Machine Code', 'Location', 'Amount', 'Date'],
      ...exportData.map(item => [
        item.id,
        item.user_id,
        item.username,
        item.machine_code,
        item.location,
        parseFloat(item.cash_received),
        new Date(item.created_at).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cash-collections-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Calculate totals
  const totals = {
    totalAmount: data.reduce((sum, item) => sum + parseFloat(item.cash_received || '0'), 0),
    totalCollections: data.length,
    uniqueMachines: new Set(data.map(item => item.machine_code)).size,
    uniqueUsers: new Set(data.map(item => item.username)).size,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cash Collections</h1>
              <p className="mt-1 text-gray-600">View and manage all cash collection records</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              
              <button
                onClick={() => handleExport(data)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                Export All
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('table')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'table'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Table View
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('charts')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'charts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChartIcon className="h-4 w-4" />
                  Charts & Analytics
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('summary')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'summary'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4" />
                  Summary
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Loading State */}
        {loading && activeTab !== 'table' && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && activeTab !== 'table' && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Error loading data: {error}
          </div>
        )}

        {/* Table View */}
        {activeTab === 'table' && (
          <CashCollectionTable
            data={data}
            loading={loading}
            error={error}
            onRefresh={fetchData}
            onExport={handleExport}
          />
        )}

        {/* Charts View */}
        {activeTab === 'charts' && !loading && !error && (
          <div className="space-y-6">
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Trend Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Daily Collections Trend</h3>
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => {
                        if (name === 'amount') return [`PKR ${value}`, 'Amount'];
                        return [value, 'Collections'];
                      }} />
                      <Legend />
                      <Bar dataKey="amount" name="Amount (PKR)" fill="#8884d8" />
                      <Bar dataKey="count" name="Number of Collections" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* User Distribution Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">User Distribution</h3>
                  <PieChartIcon className="h-5 w-5 text-green-600" />
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {userDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`PKR ${value}`, 'Amount']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Locations Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Top Locations by Collection Count</h3>
                <BarChartIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={150} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Number of Collections" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Summary View */}
        {activeTab === 'summary' && !loading && !error && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Total Collections</span>
                    <span className="text-xl font-bold text-gray-900">{totals.totalCollections}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="text-xl font-bold text-green-600">
                      {new Intl.NumberFormat('en-PK', {
                        style: 'currency',
                        currency: 'PKR',
                        minimumFractionDigits: 0,
                      }).format(totals.totalAmount)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-600">Unique Machines</span>
                    <span className="text-xl font-bold text-blue-600">{totals.uniqueMachines}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-gray-600">Unique Users</span>
                    <span className="text-xl font-bold text-purple-600">{totals.uniqueUsers}</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
                <div className="space-y-3">
                  {data.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.machine_code} • {item.username}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-green-600">
                          PKR {parseFloat(item.cash_received).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 truncate">
                        {item.location}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Top Machine</h4>
                {(() => {
                  const machineCounts = data.reduce((acc, item) => {
                    acc[item.machine_code] = (acc[item.machine_code] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  
                  const topMachine = Object.entries(machineCounts).sort((a, b) => b[1] - a[1])[0];
                  
                  return topMachine ? (
                    <>
                      <p className="text-2xl font-bold text-gray-900">{topMachine[0]}</p>
                      <p className="text-sm text-gray-600">{topMachine[1]} collections</p>
                    </>
                  ) : (
                    <p className="text-gray-500">No data</p>
                  );
                })()}
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Top User</h4>
                {(() => {
                  const userCounts = data.reduce((acc, item) => {
                    acc[item.username] = (acc[item.username] || 0) + parseFloat(item.cash_received);
                    return acc;
                  }, {} as Record<string, number>);
                  
                  const topUser = Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0];
                  
                  return topUser ? (
                    <>
                      <p className="text-2xl font-bold text-gray-900">{topUser[0]}</p>
                      <p className="text-sm text-gray-600">
                        {new Intl.NumberFormat('en-PK', {
                          style: 'currency',
                          currency: 'PKR',
                          minimumFractionDigits: 0,
                        }).format(topUser[1])}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500">No data</p>
                  );
                })()}
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Average Collection</h4>
                {(() => {
                  const avg = totals.totalAmount / totals.totalCollections || 0;
                  return (
                    <>
                      <p className="text-2xl font-bold text-gray-900">
                        {new Intl.NumberFormat('en-PK', {
                          style: 'currency',
                          currency: 'PKR',
                          minimumFractionDigits: 0,
                        }).format(avg)}
                      </p>
                      <p className="text-sm text-gray-600">per collection</p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashCollectionPage;