import { LOCAL_BASE_URL } from '@/constants/Constant';
import React, { useState } from 'react';
import { FaTrashAlt, FaFileExcel, FaExclamationTriangle, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';

const BulkDelete = () => {
  const [machineCode, setMachineCode] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteResult, setDeleteResult] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ['.xls', '.xlsx', '.csv'];
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      
      if (!validTypes.includes(`.${fileExtension}`)) {
        toast.error('Please upload Excel file (.xls, .xlsx, .csv)');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleDelete = async () => {
    if (!machineCode) {
      toast.error('Please enter machine code');
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
      const response = await fetch(`${LOCAL_BASE_URL}/corporates/deleteBulkCorporateUsers`, {
        method: 'DELETE',
        body: formData,
        // headers: { 'Authorization': `Bearer ${token}` }
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
      { cardNumber: 'CARD001', employeeID: 'EMP001', mobile_number: '1234567890', id: '' },
      { cardNumber: 'CARD002', employeeID: 'EMP002', mobile_number: '0987654321', id: '' },
      { cardNumber: '', employeeID: 'EMP003', mobile_number: '1122334455', id: '' }
    ];

    // Convert to CSV
    const headers = ['cardNumber', 'employeeID', 'mobile_number', 'id'];
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
    setMachineCode('');
    setDeletionReason('');
    setFile(null);
    setDeleteResult(null);
    document.getElementById('fileInput').value = '';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-100 rounded-full">
            <FaTrashAlt className="text-2xl text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bulk Delete Users</h1>
            <p className="text-gray-600">Delete multiple users using Excel file</p>
          </div>
        </div>

        {!deleteResult ? (
          <>
            <div className="space-y-4">
              {/* Machine Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Machine Code *
                </label>
                <input
                  type="text"
                  value={machineCode}
                  onChange={(e) => setMachineCode(e.target.value)}
                  placeholder="Enter machine code to filter deletions"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Excel File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-500 transition-colors">
                  <input
                    id="fileInput"
                    type="file"
                    onChange={handleFileChange}
                    accept=".xls,.xlsx,.csv"
                    className="hidden"
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FaFileExcel className="text-3xl text-green-500" />
                      <div className="text-left">
                        <p className="font-medium text-gray-800">{file.name}</p>
                        <p className="text-sm text-gray-600">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setFile(null);
                          document.getElementById('fileInput').value = '';
                        }}
                        className="text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="fileInput" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <FaFileExcel className="text-4xl text-gray-400 mb-3" />
                        <p className="text-lg font-medium text-gray-700">
                          Click to upload Excel file
                        </p>
                        <p className="text-gray-500 mt-1">
                          Supports: .xls, .xlsx, .csv
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Template Download */}
              <div className="flex justify-between items-center">
                <button
                  onClick={downloadDeleteTemplate}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <FaDownload />
                  Download Template
                </button>
                <p className="text-sm text-gray-500">
                  Include at least one: cardNumber, employeeID, mobile_number, or id
                </p>
              </div>

              {/* Warning */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <FaExclamationTriangle className="text-red-500 text-xl" />
                  <div>
                    <p className="font-medium text-red-700">Warning: Irreversible Action</p>
                    <p className="text-sm text-red-600 mt-1">
                      This will deactivate all matching user accounts. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleDelete}
                disabled={isLoading || !machineCode || !file}
                className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                  isLoading || !machineCode || !file
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaTrashAlt />
                    Delete Users
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          // Results Display
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-green-700">
                    Deletion Successful!
                  </h3>
                  <p className="text-green-600">
                    {deleteResult.summary.deletedRecords} users deleted
                  </p>
                </div>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  Delete More Users
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-red-600">Deleted</div>
                <div className="text-2xl font-bold text-red-700">
                  {deleteResult.summary.deletedRecords}
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-yellow-600">Not Found</div>
                <div className="text-2xl font-bold text-yellow-700">
                  {deleteResult.summary.notFoundRecords}
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600">Emails Sent</div>
                <div className="text-2xl font-bold text-blue-700">
                  {deleteResult.emails.successful}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Total in File</div>
                <div className="text-2xl font-bold text-gray-700">
                  {deleteResult.summary.totalRecords}
                </div>
              </div>
            </div>

            {/* Deleted Users List */}
            {deleteResult.data.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Deleted Users ({deleteResult.data.length})
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-600 border-b">
                        <th className="pb-2">Card Number</th>
                        <th className="pb-2">Name</th>
                        <th className="pb-2">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deleteResult.data.slice(0, 10).map((user, index) => (
                        <tr key={index} className="border-b border-gray-200 last:border-0">
                          <td className="py-2">{user.cardNumber || 'N/A'}</td>
                          <td className="py-2">{user.name}</td>
                          <td className="py-2 font-semibold text-red-600">
                            ${user.balance}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {deleteResult.data.length > 10 && (
                    <p className="text-sm text-gray-500 mt-2">
                      ... and {deleteResult.data.length - 10} more users
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <FaExclamationTriangle className="text-xl text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Confirm Deletion</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              You are about to delete <strong>{file?.name}</strong> users from machine code <strong>{machineCode}</strong>. This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 px-4 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
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