import React, { useState } from 'react';
import { FaCheckCircle, FaCopy, FaEye, FaEyeSlash, FaTimes, FaDownload, FaEnvelope } from 'react-icons/fa';

interface AddedUser {
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

interface BulkUploadResultProps {
  result: {
    data: AddedUser[];
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
  };
  onClose: () => void;
  onDownloadCSV: () => void;
  onDownloadExcel: () => void;
}

const BulkUploadResult: React.FC<BulkUploadResultProps> = ({ 
  result, 
  onClose, 
  onDownloadCSV,
  onDownloadExcel 
}) => {
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'emails'>('users');

  const togglePinVisibility = (id: string | number) => {
    setShowPins(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = (text: string, id: string | number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id.toString());
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-10 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FaCheckCircle className="text-green-500" />
                Bulk Upload Completed Successfully!
              </h2>
              <p className="text-gray-600 mt-1">
                {result.summary.insertedRecords} users added with auto-generated PINs
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl p-2 hover:bg-gray-100 rounded-full"
            >
              <FaTimes />
            </button>
          </div>
          
          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-600">Total Records</div>
              <div className="text-2xl font-bold text-green-700">{result.summary.totalRecords}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-600">Inserted Users</div>
              <div className="text-2xl font-bold text-blue-700">{result.summary.insertedRecords}</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-purple-600">PINs Generated</div>
              <div className="text-2xl font-bold text-purple-700">{result.summary.generatedPINs}</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-sm text-yellow-600">Duplicates</div>
              <div className="text-2xl font-bold text-yellow-700">{result.summary.duplicateRecords}</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-sm text-red-600">Invalid</div>
              <div className="text-2xl font-bold text-red-700">{result.summary.invalidRecords}</div>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg">
              <div className="text-sm text-indigo-600">Email Success</div>
              <div className="text-2xl font-bold text-indigo-700">
                {result.emails.totalSent > 0 
                  ? `${Math.round((result.emails.successful / result.emails.totalSent) * 100)}%`
                  : 'N/A'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'users'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Added Users ({result.data.length})
            </button>
            <button
              onClick={() => setActiveTab('emails')}
              className={`px-6 py-3 font-medium flex items-center gap-2 ${
                activeTab === 'emails'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaEnvelope />
              Email Status ({result.emails.totalSent})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[50vh]">
          {activeTab === 'users' ? (
            <table className="w-full">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Employee ID</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">PIN</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Balance</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {result.data.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="p-3">{user.name}</td>
                    <td className="p-3">{user.mobileNumber}</td>
                    
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="font-mono bg-gray-100 px-3 py-1 rounded-lg">
                          {showPins[user.id] ? user.pin : '••••'}
                        </div>
                        <button
                          onClick={() => togglePinVisibility(user.id)}
                          className="text-gray-400 hover:text-blue-500 text-sm"
                          title={showPins[user.id] ? "Hide PIN" : "Show PIN"}
                        >
                          {showPins[user.id] ? <FaEyeSlash /> : <FaEye />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(user.pin, `pin_${user.id}`)}
                          className="text-gray-400 hover:text-blue-500 text-sm"
                          title="Copy PIN"
                        >
                          {copiedId === `pin_${user.id}` ? (
                            <FaCheckCircle className="text-green-500" />
                          ) : (
                            <FaCopy />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-green-600">Rs: {user.balance}</td>
                    <td className="p-3 text-sm">{user.email || 'N/A'}</td>
                    <td className="p-3">
                      <button
                        onClick={() => copyToClipboard(`${user.cardNumber}: ${user.pin}`, `full_${user.id}`)}
                        className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg"
                      >
                        {copiedId === `full_${user.id}` ? 'Copied!' : 'Copy'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-green-500 text-2xl" />
                    <div>
                      <div className="text-sm text-green-600">Successful</div>
                      <div className="text-2xl font-bold text-green-700">{result.emails.successful}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaTimes className="text-red-500 text-2xl" />
                    <div>
                      <div className="text-sm text-red-600">Failed</div>
                      <div className="text-2xl font-bold text-red-700">{result.emails.failed}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaEnvelope className="text-blue-500 text-2xl" />
                    <div>
                      <div className="text-sm text-blue-600">Total</div>
                      <div className="text-2xl font-bold text-blue-700">{result.emails.totalSent}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {result.emails.results.map((email, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${
                      email.success 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-800">{email.name}</div>
                        <div className="text-sm text-gray-600">{email.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {email.success ? (
                          <>
                            <FaCheckCircle className="text-green-500" />
                            <span className="text-sm text-green-600">Sent</span>
                          </>
                        ) : (
                          <>
                            <FaTimes className="text-red-500" />
                            <span className="text-sm text-red-600">Failed</span>
                          </>
                        )}
                      </div>
                    </div>
                    {email.error && (
                      <div className="mt-2 text-sm text-red-600">
                        Error: {email.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-3">
              <button
                onClick={onDownloadCSV}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center gap-2"
              >
                <FaDownload /> Download CSV
              </button>
              <button
                onClick={onDownloadExcel}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2"
              >
                <FaDownload /> Download Excel
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadResult;