import React, { useState, useEffect } from 'react';
import CashCollectionTable from './components/cashCollectionTable';
import { getRequest, postRequest } from '@/Apis/Api';
import { 
  TrendingUp, PieChart as PieChartIcon, 
  BarChart as BarChartIcon, DollarSign,
  Download, RefreshCw, FileText, Calendar,
  Users, MapPin, Filter, ChevronDown,
  ExternalLink, CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MachineReport {
  machine_code: string;
  location: string;
  total_cash_received: string;
  transaction_count: number;
  transactions: {
    id: number;
    user_id: number;
    created_at: string;
    cash_received?: string;
  }[];
}

interface DailyData {
  date: string;
  amount: number;
  transactions: number;
}

interface LocationData {
  location: string;
  amount: number;
}

interface UserData {
  username: string;
  amount: number;
  transactions: number;
}

interface MonthlyReportData {
  total_amount: number;
  total_transactions: number;
  average_transaction: number;
  top_locations: LocationData[];
  top_users: UserData[];
  daily_data: DailyData[];
}

interface CashCollection {
  id: number;
  user_id: number;
  username: string;
  machine_code: string;
  location: string;
  cash_received: string;
  created_at: string;
}

const SuperAdminCashCollectionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('table');
  const [data, setData] = useState<CashCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  
  // Report states
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [dateRange, setDateRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // Generate months and years for dropdowns
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  // Fetch cash collection data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getRequest(`/superadmin/getAllCashCollection`);
      
      if (result && result.success && result.data) {
        setData(result.data);
      } else if (result && result.data) {
        setData(result.data);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching data');
      console.error('Fetch data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch monthly report
  const fetchMonthlyReport = async () => {
    try {
      setReportLoading(true);
      setReportError(null);
      setMonthlyReport(null); // Clear previous report

      console.log('Fetching report for:', { month: selectedMonth, year: selectedYear });

      const result = await postRequest(
        '/superadmin/monthlyCashCollectionReport',
        { 
          month: selectedMonth, 
          year: selectedYear 
        }
      );

      console.log('API Response:', result);

      if (!result) {
        setReportError('No response from server');
        return;
      }

      if (!result.grouped_by_machine || !Array.isArray(result.grouped_by_machine)) {
        setReportError('Invalid report data format');
        return;
      }

      const machines: MachineReport[] = result.grouped_by_machine;

      if (machines.length === 0) {
        setReportError('No data found for selected period');
        return;
      }

      let totalAmount = 0;
      let totalTransactions = 0;

      const dailyMap: Record<string, { amount: number; transactions: number }> = {};
      const locationMap: Record<string, number> = {};

      machines.forEach(machine => {
        const machineAmount = parseFloat(machine.total_cash_received || '0');
        totalAmount += machineAmount;
        totalTransactions += machine.transaction_count || 0;

        // Aggregate by location
        if (machine.location) {
          locationMap[machine.location] = (locationMap[machine.location] || 0) + machineAmount;
        }

        // Aggregate daily data from transactions
        if (machine.transactions && Array.isArray(machine.transactions)) {
          machine.transactions.forEach(tx => {
            if (!tx.created_at) return;

            try {
              const date = tx.created_at.split('T')[0]; // Handle ISO format
              const dayDate = date.split(' ')[0]; // Handle datetime format
              
              if (!dailyMap[dayDate]) {
                dailyMap[dayDate] = { amount: 0, transactions: 0 };
              }

              const txAmount = parseFloat(tx.cash_received || '0');
              dailyMap[dayDate].amount += txAmount;
              dailyMap[dayDate].transactions += 1;
            } catch (e) {
              console.warn('Failed to process transaction:', tx);
            }
          });
        }
      });

      // Convert daily map to array and sort by date
      const daily_data = Object.entries(dailyMap)
        .map(([date, data]) => ({
          date,
          amount: data.amount,
          transactions: data.transactions
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Convert location map to array and sort by amount
      const top_locations = Object.entries(locationMap)
        .map(([location, amount]) => ({ 
          location: location || 'Unknown Location', 
          amount 
        }))
        .sort((a, b) => b.amount - a.amount);

      // Prepare the monthly report data
      const reportData: MonthlyReportData = {
        total_amount: totalAmount,
        total_transactions: totalTransactions,
        average_transaction: totalTransactions > 0 ? totalAmount / totalTransactions : 0,
        top_locations,
        top_users: [], // API doesn't provide user data
        daily_data
      };

      console.log('Generated Report Data:', reportData);
      setMonthlyReport(reportData);

    } catch (err: any) {
      console.error('Report generation error:', err);
      setReportError(err.message || 'Failed to generate report');
    } finally {
      setReportLoading(false);
    }
  };

  // Handle Generate Report button click
  const handleGenerateReport = () => {
    fetchMonthlyReport();
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-fetch report when tab changes to reports
  useEffect(() => {
    if (activeTab === 'reports') {
      // Only fetch if we don't already have data for the selected month/year
      fetchMonthlyReport();
    }
  }, [activeTab]);

  const handleExport = (exportData: CashCollection[]) => {
    if (!exportData || exportData.length === 0) {
      alert('No data to export');
      return;
    }
    
    try {
      const csvContent = [
        ['ID', 'User ID', 'Username', 'Machine Code', 'Location', 'Amount', 'Date'],
        ...exportData.map(item => [
          item.id,
          item.user_id,
          item.username,
          item.machine_code,
          item.location,
          item.cash_received,
          new Date(item.created_at).toLocaleString()
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cash-collections-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data');
    }
  };

  const handleExportReport = () => {
    if (!monthlyReport) {
      alert('No report data to export');
      return;
    }
    
    try {
      const csvContent = [
        ['Monthly Cash Collection Report'],
        [`Period: ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`],
        [''],
        ['Summary'],
        [`Total Amount: ${monthlyReport.total_amount.toFixed(2)}`],
        [`Total Transactions: ${monthlyReport.total_transactions}`],
        [`Average Transaction: ${monthlyReport.average_transaction.toFixed(2)}`],
        [''],
        ['Top Locations'],
        ['Location', 'Amount'],
        ...monthlyReport.top_locations.map(item => [item.location, item.amount.toFixed(2)]),
        [''],
        ['Daily Data'],
        ['Date', 'Amount', 'Transactions'],
        ...monthlyReport.daily_data.map(item => [
          item.date, 
          item.amount.toFixed(2), 
          item.transactions
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cash-report-${selectedYear}-${selectedMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Report export error:', err);
      alert('Failed to export report');
    }
  };

  // Chart data configurations with safety checks
  const lineChartData = {
    labels: monthlyReport?.daily_data?.map(item => {
      // Extract day from date (e.g., "2024-01-15" -> "15")
      try {
        return item.date.split('-')[2] || item.date;
      } catch {
        return item.date;
      }
    }) || [],
    datasets: [
      {
        label: 'Daily Collection',
        data: monthlyReport?.daily_data?.map(item => item.amount) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const barChartData = {
    labels: monthlyReport?.top_locations?.slice(0, 5).map(item => item.location) || [],
    datasets: [
      {
        label: 'Collection by Location',
        data: monthlyReport?.top_locations?.slice(0, 5).map(item => item.amount) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)'
        ],
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <DollarSign className="text-green-600" size={32} />
                Cash Collections
              </h1>
              <p className="mt-1 text-gray-600">View and manage all cash collection records</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={() => handleExport(data)}
                disabled={loading || data.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-all flex items-center gap-2 ${
                  activeTab === 'table'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="h-4 w-4" />
                Table View
              </button>
              
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-all flex items-center gap-2 ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <PieChartIcon className="h-4 w-4" />
                Reports & Analytics
              </button>
            </nav>
          </div>
        </div>

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

        {/* Reports View */}
        {activeTab === 'reports' && (
          <div className="space-y-8">
            {/* Date Filter Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Monthly Report</h2>
                  <p className="text-sm text-gray-600">Select month and year to generate report</p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      disabled={reportLoading}
                      className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {months.map(month => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                  
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      disabled={reportLoading}
                      className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
                  
                  <button
                    onClick={handleGenerateReport}
                    disabled={reportLoading}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                  >
                    <RefreshCw className={`h-4 w-4 ${reportLoading ? 'animate-spin' : ''}`} />
                    {reportLoading ? 'Generating...' : 'Generate Report'}
                  </button>
                  
                  <button
                    onClick={handleExportReport}
                    disabled={!monthlyReport || reportLoading}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Export Report
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {reportLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Generating report...</p>
              </div>
            )}

            {/* Error State */}
            {reportError && !reportLoading && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                <div className="flex items-start">
                  <AlertCircle className="text-red-500 mr-3 mt-0.5" size={20} />
                  <div>
                    <p className="text-red-700 font-medium">Error Loading Report</p>
                    <p className="text-red-600 text-sm mt-1">{reportError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Stats */}
            {monthlyReport && !reportLoading && !reportError && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Total Collection</p>
                        <p className="text-2xl font-bold text-blue-800 mt-1">
                          Rs {monthlyReport.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          {monthlyReport.total_transactions} transactions
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Total Transactions</p>
                        <p className="text-2xl font-bold text-green-800 mt-1">
                          {monthlyReport.total_transactions.toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600 mt-2">
                          This month
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-600 font-medium">Top Location</p>
                        <p className="text-lg font-bold text-orange-800 mt-1 truncate">
                          {monthlyReport.top_locations[0]?.location || 'N/A'}
                        </p>
                        <p className="text-xs text-orange-600 mt-2">
                          Rs {monthlyReport.top_locations[0]?.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Locations Chart */}
                  {monthlyReport.top_locations.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">Top Locations</h3>
                          <p className="text-sm text-gray-600">Collection distribution by location</p>
                        </div>
                        <ExternalLink size={18} className="text-gray-400 cursor-pointer hover:text-gray-600" />
                      </div>
                      <div className="h-72">
                        <Bar data={barChartData} options={chartOptions} />
                      </div>
                    </div>
                  )}

                  {/* Detailed Breakdown */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-800">Detailed Breakdown</h3>
                      <p className="text-sm text-gray-600">Transaction insights and analysis</p>
                    </div>
                    
                    <div className="space-y-6">
                      {monthlyReport.top_locations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Top Locations</h4>
                          <div className="space-y-3">
                            {monthlyReport.top_locations.map((location, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <span className="text-blue-600 font-medium">{index + 1}</span>
                                  </div>
                                  <span className="font-medium text-gray-800">{location.location}</span>
                                </div>
                                <span className="font-bold text-gray-900">
                                  Rs {location.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {monthlyReport.daily_data.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Daily Performance</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {monthlyReport.daily_data.slice(-5).reverse().map((day, index) => (
                              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                <p className="font-medium text-gray-800">{day.date}</p>
                                <div className="mt-2 flex justify-between">
                                  <div>
                                    <p className="text-sm text-gray-600">Amount</p>
                                    <p className="font-bold text-gray-900">
                                      Rs {day.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-gray-600">Transactions</p>
                                    <p className="font-bold text-gray-900">{day.transactions}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Monthly Summary</h3>
                      <p className="text-sm text-gray-600">
                        {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">Peak Collection Day</p>
                      <p className="font-semibold text-gray-900 mt-1">
                        {(() => {
                          if (!monthlyReport.daily_data.length) return 'N/A';
                          const peakDay = monthlyReport.daily_data.reduce((prev, current) => 
                            (prev.amount > current.amount) ? prev : current
                          );
                          return peakDay?.date ? new Date(peakDay.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            day: 'numeric' 
                          }) : 'N/A';
                        })()}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">Average Daily Collection</p>
                      <p className="font-semibold text-gray-900 mt-1">
                        Rs {(monthlyReport.total_amount / Math.max(monthlyReport.daily_data.length, 1)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">Busiest Day</p>
                      <p className="font-semibold text-gray-900 mt-1">
                        {(() => {
                          if (!monthlyReport.daily_data.length) return '0 transactions';
                          const busiestDay = monthlyReport.daily_data.reduce((prev, current) => 
                            (prev.transactions > current.transactions) ? prev : current
                          );
                          return `${busiestDay?.transactions || 0} transactions`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Empty State */}
            {!monthlyReport && !reportLoading && !reportError && (
              <div className="text-center py-12">
                <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                  <PieChartIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700">No Report Generated</h3>
                <p className="text-gray-500 mt-1">
                  Select a month and year, then click "Generate Report"
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminCashCollectionPage;