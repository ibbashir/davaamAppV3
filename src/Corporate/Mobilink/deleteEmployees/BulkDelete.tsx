import { SiteHeader } from '@/components/superAdmin/site-header';
import { BASE_URL } from '@/constants/Constant';
import { useAuth } from '@/contexts/AuthContext';
import React, { useEffect, useState, useRef } from 'react';
import { FaTrashAlt, FaFileExcel, FaExclamationTriangle, FaDownload, FaUpload, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';

const BulkDelete = () => {
  const [deletionReason, setDeletionReason] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const { state } = useAuth();
  const [machineCode, setMachineCode] = useState<string>('');
  const fileInputRef = useRef(null);

  // Set machine code from user only once
  useEffect(() => {
    if (state?.user?.machines?.[0]) {
      setMachineCode(state.user.machines[0].machine_code);
    }
  }, [state?.user]);

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging to false if leaving the drop zone
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const validTypes = ['.xls', '.xlsx', '.csv'];
    const fileExtension = '.' + selectedFile.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      toast.error('Please upload Excel file (.xls, .xlsx, .csv)');
      return;
    }

    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleDelete = async () => {
    if (!machineCode) {
      toast.error('Machine code is required');
      return;
    }

    if (!file) {
      toast.error('Please upload Excel file');
      return;
    }

    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    setShowConfirm(false);

    const formData = new FormData();
    formData.append('excelFile', file);
    formData.append('machine_code', machineCode);
    if (deletionReason) {
      formData.append('deletion_reason', deletionReason);
    }

    try {
      const response = await fetch(`${BASE_URL}/corporates/deleteBulkCorporateUsers`, {
        method: 'DELETE',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setDeleteResult(result);
        toast.success(`Successfully deleted ${result.summary.deletedRecords} users`);
      } else {
        toast.error(result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete users');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadDeleteTemplate = () => {
    // Create template Excel data
    const templateData = [
      { employeeID: '1001'},
    ];

    const headers = ['employeeID'];
    const csvRows = [
      headers.join(','),
      ...templateData.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'delete_users_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setDeletionReason('');
    setFile(null);
    setDeleteResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen">
      <SiteHeader title="🌱 Delete Bulk Employees"/>
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">

        {!deleteResult ? (
          <>
            <div className="space-y-6">
              {/* Deletion Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deletion Reason (Optional)
                </label>
                <textarea
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="Reason for deleting these users..."
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Drag & Drop File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Excel File *
                </label>
                <div
                  className={`relative border-3 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                    isDragging
                      ? 'border-teal-500 bg-teal-50 scale-[1.02]'
                      : 'border-gray-300 hover:border-teal-400 hover:bg-teal-50'
                  } ${file ? 'bg-green-50 border-green-400' : ''}`}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleDropZoneClick}
                >
                  <input
                    id="fileInput"
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".xls,.xlsx,.csv"
                    className="hidden"
                  />
                  
                  {file ? (
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-green-200 w-full max-w-md shadow-sm">
                        <FaFileExcel className="text-4xl text-green-500 flex-shrink-0" />
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{file.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm text-gray-600">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              ✓ Ready to delete
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile();
                          }}
                          className="text-teal-500 hover:text-teal-600 p-2 rounded-full hover:bg-teal-50 transition-colors flex-shrink-0"
                          title="Remove file"
                        >
                          <FaTimes className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500">
                        Click or drag & drop to upload a different file
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      {isDragging ? (
                        <>
                          <div className="w-20 h-20 mb-4 flex items-center justify-center">
                            <div className="relative">
                              <div className="w-16 h-16 border-4 border-teal-500 border-dashed rounded-full animate-pulse"></div>
                              <FaUpload className="absolute inset-0 m-auto text-teal-500 text-2xl" />
                            </div>
                          </div>
                          <p className="text-xl font-semibold text-teal-600 animate-pulse">
                            Drop to upload
                          </p>
                          <p className="text-gray-500 mt-2">
                            Release to upload your Excel file
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 mb-4 flex items-center justify-center bg-gray-100 rounded-full">
                            <FaUpload className="text-3xl text-gray-400" />
                          </div>
                          <p className="text-lg font-semibold text-gray-700">
                            Drag & drop your file here
                          </p>
                          <p className="text-gray-500 mt-1">or click to browse</p>
                          <div className="mt-4 flex flex-wrap justify-center gap-2">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                              .xls
                            </span>
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                              .xlsx
                            </span>
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                              .csv
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-4">
                            Maximum file size: 5MB
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Upload instructions */}
                <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                  <span>Supported formats: Excel (.xls, .xlsx, .csv)</span>
                  <span>Max size: 5MB</span>
                </div>
              </div>

              {/* Template Download */}
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-teal-800">Need a template?</h3>
                    <p className="text-sm text-teal-600 mt-1">
                      Download our template to ensure proper formatting
                    </p>
                  </div>
                  <button
                    onClick={downloadDeleteTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors whitespace-nowrap"
                  >
                    <FaDownload />
                    Download Template
                  </button>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <p className="font-medium">File must include at least one of these fields:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <code className="px-2 py-1 bg-gray-100 rounded text-xs">employeeID</code>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-5">
                <div className="flex items-start gap-4">
                  <FaExclamationTriangle className="text-teal-500 text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-teal-700 text-lg">⚠️ Warning: Irreversible Action</p>
                    <p className="text-teal-600 mt-2">
                      This action will <span className="font-bold">permanently delete</span> all matching user accounts from machine code <span className="font-bold">{machineCode}</span>. 
                      This process cannot be undone.
                    </p>
                    <ul className="list-disc list-inside text-teal-600 mt-2 text-sm space-y-1">
                      <li>Deleted users will lose access immediately</li>
                      <li>All user data will be permanently removed</li>
                      <li>Ensure you have a backup before proceeding</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleDelete}
                disabled={isLoading || !machineCode || !file}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${
                  isLoading || !machineCode || !file
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Deleting Users...
                  </>
                ) : (
                  <>
                    <FaTrashAlt className="w-6 h-6" />
                    Delete Users Now
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          // Results Display
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <FaTrashAlt className="text-2xl text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-green-800">
                      🎉 Deletion Successful!
                    </h3>
                    <p className="text-green-700 mt-1">
                      Successfully deleted <span className="font-bold">{deleteResult.summary.deletedRecords}</span> users
                      {deleteResult.summary.notFoundRecords > 0 && (
                        <span className="text-yellow-700 ml-2">
                          ({deleteResult.summary.notFoundRecords} not found)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-md"
                  >
                    Delete More Users
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-xl p-6 shadow-sm">
                <div className="text-sm font-semibold text-teal-700 uppercase tracking-wide">Deleted</div>
                <div className="text-4xl font-bold text-teal-800 mt-2">
                  {deleteResult.summary.deletedRecords}
                </div>
                <div className="text-xs text-teal-600 mt-2">Users permanently removed</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6 shadow-sm">
                <div className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">Not Found</div>
                <div className="text-4xl font-bold text-yellow-800 mt-2">
                  {deleteResult.summary.notFoundRecords}
                </div>
                <div className="text-xs text-yellow-600 mt-2">No matching records</div>
              </div>
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-xl p-6 shadow-sm">
                <div className="text-sm font-semibold text-teal-700 uppercase tracking-wide">Emails Sent</div>
                <div className="text-4xl font-bold text-teal-800 mt-2">
                  {deleteResult.emails?.successful || 0}
                </div>
                <div className="text-xs text-teal-600 mt-2">Notification emails sent</div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-300 rounded-xl p-6 shadow-sm">
                <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Total in File</div>
                <div className="text-4xl font-bold text-gray-800 mt-2">
                  {deleteResult.summary.totalRecords}
                </div>
                <div className="text-xs text-gray-600 mt-2">Records processed</div>
              </div>
            </div>

            {/* Deleted Users List */}
            {deleteResult.data?.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-800">
                      Deleted Users ({deleteResult.data.length})
                    </h4>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      Showing first 10 records
                    </span>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-100 z-10">
                      <tr className="text-left text-sm font-semibold text-gray-700">
                        <th className="px-6 py-4 border-b border-gray-200">Card Number</th>
                        <th className="px-6 py-4 border-b border-gray-200">Name</th>
                        <th className="px-6 py-4 border-b border-gray-200">Phone</th>
                        <th className="px-6 py-4 border-b border-gray-200">Balance</th>
                        <th className="px-6 py-4 border-b border-gray-200">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deleteResult.data.slice(0, 10).map((user, index) => (
                        <tr 
                          key={index} 
                          className={`border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4 font-medium">{user.cardNumber || '—'}</td>
                          <td className="px-6 py-4">{user.name}</td>
                          <td className="px-6 py-4">{user.mobile_number || '—'}</td>
                          <td className="px-6 py-4 font-bold text-teal-600">
                            Rs: {user.balance ? parseFloat(user.balance).toFixed(2) : '0.00'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-teal-100 text-teal-800 text-xs font-semibold rounded-full">
                              Deleted
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {deleteResult.data.length > 10 && (
                  <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        ... and {deleteResult.data.length - 10} more users
                      </p>
                      <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                        View Complete List →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-scale-in">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-teal-100 rounded-xl">
                <FaExclamationTriangle className="text-2xl text-teal-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Confirm Deletion</h3>
                <p className="text-gray-600">Please review before proceeding</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
                <div className="flex items-center gap-3">
                  <FaFileExcel className="text-green-500 text-xl" />
                  <div>
                    <p className="font-semibold text-gray-800">{file?.name}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span>{(file?.size / 1024).toFixed(2)} KB</span>
                      <span>•</span>
                      <span>Machine: <strong>{machineCode}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
              
              {deletionReason && (
                <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
                  <p className="text-sm font-semibold text-teal-800 mb-1">Deletion Reason:</p>
                  <p className="text-gray-700">"{deletionReason}"</p>
                </div>
              )}
            </div>
            
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-teal-500 mt-0.5 flex-shrink-0" />
                <p className="text-teal-700 font-medium">
                  This action <span className="font-bold underline">cannot be undone</span>. 
                  All matching users will be permanently deleted.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl font-semibold flex items-center justify-center gap-3 transition-all"
              >
                <FaTrashAlt />
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkDelete;