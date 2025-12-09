import React, { useState, useCallback } from 'react';
import ExcelReader from './components/ExcelReader';
import BulkUploadResult from './components/BulkDataResults';
import { FaFileExcel, FaFileAlt, FaLayerGroup, FaTable, FaDownload } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from './components/DataTables';
import { BASE_URL } from '@/constants/Constant';
import { SiteHeader } from '@/components/superAdmin/site-header';



// Types
interface UploadedUser {
  id: string | number;
  cardNumber: string;
  pin: string;
  name: string;
  mobileNumber: string;
  employeeID: string;
  balance: string;
  email: string;
  machineCode: string;
  createdAt: string;
  isActive: boolean;
  pinDisplay: string;
}

interface BulkUploadResponse {
  statusCode: number;
  message: string;
  data: UploadedUser[];
  emails: {
    totalSent: number;
    successful: number;
    failed: number;
    results: Array<{
      email: string;
      name: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }>;
  };
  summary: {
    totalRecords: number;
    validRecords: number;
    insertedRecords: number;
    duplicateRecords: number;
    invalidRecords: number;
    generatedPINs: number;
    usersWithEmails: number;
    usersWithoutEmails: number;
  };
}

function AddEmployees() {
  const [excelData, setExcelData] = useState<any>(null);
  const [fileName, setFileName] = useState<string>('');
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [bulkUploadResult, setBulkUploadResult] = useState<BulkUploadResponse | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);

  // Function to handle bulk upload
  const handleBulkUpload = async (file: File, machineCode: string) => {
    setUploadStatus('uploading');
    
    const formData = new FormData();
    formData.append('excelFile', file);
    formData.append('machine_code', machineCode);

    try {
      const response = await fetch(`${BASE_URL}/corporates/addBulkCorporateUsers`, {
        method: 'POST',
        body: formData,
        // Add headers if you have authentication
        // headers: {
        //   'Authorization': `Bearer ${localStorage.getItem('token')}`,
        // },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result: BulkUploadResponse = await response.json();
      
      if (result.statusCode === 201) {
        setBulkUploadResult(result);
        setUploadStatus('success');
        setShowResults(true);
        
        // Show success toast
        toast.success(`${result.summary.insertedRecords} users added successfully!`, {
          position: "top-right",
          autoClose: 5000,
        });
        
        // Also show email status
        if (result.emails.totalSent > 0) {
          toast.info(`${result.emails.successful} emails sent successfully, ${result.emails.failed} failed`, {
            position: "top-right",
            autoClose: 7000,
          });
        }
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      
      // Try to get error details from response
      let errorMessage = 'Failed to upload file';
      try {
        const errorData = await error.response?.json();
        errorMessage = errorData?.error || errorData?.message || error.message;
      } catch {
        errorMessage = error.message || 'Network error or server not responding';
      }
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setUploadStatus('idle');
    }
  };

  // Function to handle file read (for preview)
  const handleFileRead = useCallback((data: any, name: string) => {
    setExcelData(data);
    setFileName(name);
    if (data.sheets.length > 0) {
      setActiveSheet(data.sheets[0].name);
    }
  }, []);

  const handleReset = () => {
    setExcelData(null);
    setFileName('');
    setActiveSheet('');
    setBulkUploadResult(null);
    setShowResults(false);
    setUploadStatus('idle');
  };

  const activeSheetData = excelData?.sheets?.find((sheet: any) => sheet.name === activeSheet);

  // Function to download results as Excel
  const downloadResultsAsExcel = () => {
    if (!bulkUploadResult?.data) return;

    import('xlsx').then((XLSX) => {
      // Prepare data for Excel
      const data = bulkUploadResult.data.map(user => ({
        'Card Number': user.cardNumber,
        'PIN': user.pin,
        'Name': user.name,
        'Mobile Number': user.mobileNumber,
        'Employee ID': user.employeeID,
        'Balance': user.balance,
        'Email': user.email,
        'Machine Code': user.machineCode,
        'Created At': user.createdAt,
        'Status': user.isActive ? 'Active' : 'Inactive'
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Added Users');
      
      // Add summary sheet
      const summaryData = [
        ['Summary', ''],
        ['Total Records', bulkUploadResult.summary.totalRecords],
        ['Valid Records', bulkUploadResult.summary.validRecords],
        ['Inserted Users', bulkUploadResult.summary.insertedRecords],
        ['Duplicate Records', bulkUploadResult.summary.duplicateRecords],
        ['Invalid Records', bulkUploadResult.summary.invalidRecords],
        ['PINs Generated', bulkUploadResult.summary.generatedPINs],
        ['Users with Emails', bulkUploadResult.summary.usersWithEmails],
        ['Users without Emails', bulkUploadResult.summary.usersWithoutEmails],
        ['', ''],
        ['Email Summary', ''],
        ['Total Emails Sent', bulkUploadResult.emails.totalSent],
        ['Successful Emails', bulkUploadResult.emails.successful],
        ['Failed Emails', bulkUploadResult.emails.failed]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `users_upload_${timestamp}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
      
      toast.success(`Results downloaded as ${filename}`, {
        position: "top-right",
        autoClose: 3000,
      });
    });
  };

  // Function to download results as CSV
  const downloadResultsAsCSV = () => {
    if (!bulkUploadResult?.data) return;

    const headers = ['Card Number', 'PIN', 'Name', 'Mobile Number', 'Employee ID', 'Balance', 'Email', 'Machine Code', 'Created At'];
    const csvRows = [
      headers.join(','),
      ...bulkUploadResult.data.map(user => 
        [
          `"${user.cardNumber}"`,
          `"${user.pin}"`,
          `"${user.name}"`,
          `"${user.mobileNumber}"`,
          `"${user.employeeID}"`,
          `"${user.balance}"`,
          `"${user.email}"`,
          `"${user.machineCode}"`,
          `"${user.createdAt}"`
        ].join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `users_with_pins_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV file downloaded with PINs', {
      position: "top-right",
      autoClose: 3000,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <ToastContainer />
     <SiteHeader title="🌱 Add Bulk Employees"/>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Upload Section */}
          <div className="mb-8">
            <ExcelReader 
              onFileRead={handleFileRead}
              onReset={handleReset}
              currentFile={fileName}
              onBulkUpload={handleBulkUpload}
              uploadStatus={uploadStatus}
            />
          </div>
          
          {/* Results Section */}
          {showResults && bulkUploadResult && (
            <div className="mb-8 bg-white rounded-xl shadow-lg p-6 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <FaFileAlt className="text-green-500" />
                  Upload Results
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={downloadResultsAsCSV}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                  >
                    <FaDownload /> Download CSV with PINs
                  </button>
                  <button
                    onClick={downloadResultsAsExcel}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
                  >
                    <FaFileExcel /> Download Excel Report
                  </button>
                </div>
              </div>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-600">Total Users</div>
                  <div className="text-2xl font-bold text-green-700">{bulkUploadResult.summary.insertedRecords}</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600">PINs Generated</div>
                  <div className="text-2xl font-bold text-blue-700">{bulkUploadResult.summary.generatedPINs}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600">Emails Sent</div>
                  <div className="text-2xl font-bold text-purple-700">{bulkUploadResult.emails.successful}/{bulkUploadResult.emails.totalSent}</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-yellow-600">Duplicates</div>
                  <div className="text-2xl font-bold text-yellow-700">{bulkUploadResult.summary.duplicateRecords}</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-sm text-red-600">Invalid</div>
                  <div className="text-2xl font-bold text-red-700">{bulkUploadResult.summary.invalidRecords}</div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="text-sm text-indigo-600">Success Rate</div>
                  <div className="text-2xl font-bold text-indigo-700">
                    {Math.round((bulkUploadResult.summary.insertedRecords / bulkUploadResult.summary.totalRecords) * 100)}%
                  </div>
                </div>
              </div>
              
              {/* Quick User List */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Recently Added Users (First 5)</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-600 border-b">
                        <th className="pb-2">Card Number</th>
                        <th className="pb-2">Name</th>
                        <th className="pb-2">PIN</th>
                        <th className="pb-2">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkUploadResult.data.slice(0, 5).map((user, index) => (
                        <tr key={index} className="border-b border-gray-200 last:border-0">
                          <td className="py-2">{user.cardNumber || 'N/A'}</td>
                          <td className="py-2">{user.name}</td>
                          <td className="py-2">
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">{user.pin}</span>
                          </td>
                          <td className="py-2 font-semibold text-green-600">${user.balance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bulkUploadResult.data.length > 5 && (
                    <p className="text-sm text-gray-500 mt-2">
                      ... and {bulkUploadResult.data.length - 5} more users
                    </p>
                  )}
                </div>
              </div>
              
              {/* Email Status */}
              {bulkUploadResult.emails.totalSent > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Email Notification Status</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-blue-700">
                        {bulkUploadResult.emails.successful} emails sent successfully
                      </span>
                      <span className="text-sm text-red-600">
                        {bulkUploadResult.emails.failed} emails failed
                      </span>
                    </div>
                    {bulkUploadResult.emails.results.filter(r => !r.success).length > 0 && (
                      <div className="text-sm text-red-600 mt-2">
                        Failed emails: {bulkUploadResult.emails.results.filter(r => !r.success).map(r => r.email).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Excel Preview Section */}
          {excelData && !showResults && (
            <div className="space-y-6 animate-fade-in">
              {/* File Info & Sheet Selector */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3 mb-3">
                      <FaFileAlt className="text-green-500" />
                      <span className="truncate">File Preview: {fileName}</span>
                      <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium ml-2">
                        <FaLayerGroup />
                        {excelData.sheets.length} sheet(s)
                      </span>
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span>Size: {(excelData.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                      <span>Type: {excelData.fileType}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 lg:text-right">
                    <p className="text-sm text-gray-500 mb-1">Active Sheet</p>
                    <p className="text-lg font-semibold text-gray-800">{activeSheet}</p>
                  </div>
                </div>
                
                {excelData.sheets.length > 1 && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Select Sheet:</h3>
                    <div className="flex flex-wrap gap-2">
                      {excelData.sheets.map((sheet: any) => (
                        <button
                          key={sheet.name}
                          onClick={() => setActiveSheet(sheet.name)}
                          className={`
                            px-4 py-2 rounded-lg transition-all duration-200 font-medium
                            flex items-center gap-2
                            ${activeSheet === sheet.name 
                              ? 'bg-blue-500 text-white shadow-md' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                          `}
                        >
                          <span className="truncate max-w-[200px]">{sheet.name}</span>
                          {activeSheet === sheet.name && (
                            <span className="w-2 h-2 bg-white rounded-full"></span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Data Table Preview */}
              <DataTable 
                data={activeSheetData?.data || []}
                headers={activeSheetData?.headers || []}
                sheetName={activeSheet}
              />
              
              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-5 text-center border border-gray-200">
                <p className="text-gray-700 flex items-center justify-center gap-3">
                  <FaTable className="text-blue-500" />
                  <span>
                    <span className="font-bold text-gray-900">{activeSheetData?.data.length || 0}</span> rows × 
                    <span className="font-bold text-gray-900"> {activeSheetData?.headers.length || 0}</span> columns
                  </span>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Upload this file to add users to the system
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="container mx-auto px-4 py-6 mt-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 text-center shadow-sm">
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-gray-600 text-sm">
              <span className="flex items-center gap-2">
                <span className="font-medium">Supports:</span> .xlsx, .xls, .csv
              </span>
              <span className="hidden md:block text-gray-300">•</span>
              <span>Automatically generates 4-digit PINs</span>
              <span className="hidden md:block text-gray-300">•</span>
              <span>Sends email notifications</span>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Corporate Users Bulk Upload System - Secure user management with Excel integration
            </p>
          </div>
        </div>
      </footer>
      
      {/* Bulk Upload Results Modal */}
      {showResults && bulkUploadResult && (
        <BulkUploadResult 
          result={bulkUploadResult}
          onClose={() => setShowResults(false)}
          onDownloadCSV={downloadResultsAsCSV}
          onDownloadExcel={downloadResultsAsExcel}
        />
      )}
    </div>
  );
}

export default AddEmployees;