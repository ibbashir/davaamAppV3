import { useAuth } from '@/contexts/AuthContext';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FaFileExcel, FaUpload, FaTimes, FaInfoCircle, FaSpinner } from 'react-icons/fa';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ExcelReader: React.FC<ExcelReaderProps> = ({ 
  onFileRead, 
  onReset,
  currentFile,
  onBulkUpload, // New prop for bulk upload
  uploadStatus // New prop for upload status
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  
  const { state } = useAuth();
  const [machineCode, setMachineCode] = useState<string>('');

  // Set machine code from user only once
  useEffect(() => {
    if (state?.user?.machines?.[0]) {
      setMachineCode(state.user.machines[0].machine_code);
    }
  }, [state?.user]);


  const processExcelFile = async (file: File) => {
    if (!file) return;
    
    // Check if file is an Excel file
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidType = ['xls', 'xlsx', 'csv', 'ods'].includes(fileExtension || '');
    
    if (!isValidType) {
      setError('Please upload a valid Excel file (.xls, .xlsx, .csv)');
      return;
    }
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size should be less than 10MB');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // If bulk upload function provided, use it
      if (onBulkUpload && machineCode) {
        await onBulkUpload(file, machineCode);
      } else {
        // Otherwise use local processing (original functionality)
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            // Process Excel file locally
            // ... existing Excel processing code ...
            // Call onFileRead with processed data
          } catch (err) {
            setError('Error reading Excel file. Please make sure the file is valid.');
            console.error('Excel read error:', err);
          } finally {
            setIsLoading(false);
          }
        };
        
        reader.onerror = () => {
          setError('Error reading file. Please try again.');
          setIsLoading(false);
        };
        
        reader.readAsBinaryString(file);
      }
    } catch (err) {
      setError('Error processing file. Please try again.');
      setIsLoading(false);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processExcelFile(files[0]);
    }
  }, [machineCode]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processExcelFile(files[0]);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <ToastContainer position="top-right" autoClose={5000} />
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".xls,.xlsx,.csv,.ods"
        className="hidden"
      />
      
      {uploadStatus === 'uploading' ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center animate-pulse">
          <FaSpinner className="text-5xl text-blue-500 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800">Uploading and Processing Excel File...</h3>
          <p className="text-gray-600 mt-2">Please wait while we add users to the system</p>
        </div>
      ) : currentFile ? (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-green-500 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <FaFileExcel className="text-4xl text-green-500 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800 truncate">{currentFile}</h3>
                <p className="text-gray-600">File loaded successfully</p>
              </div>
            </div>
            <button
              onClick={onReset}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <FaTimes /> Clear File
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Drop Zone */}
          <div
            className={`
              border-3 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-300
              cursor-pointer
              ${isDragging 
                ? 'border-green-500 bg-green-50 scale-[1.02]' 
                : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
              }
              ${isLoading ? 'opacity-75 pointer-events-none' : ''}
              ${!machineCode ? 'opacity-50 pointer-events-none' : ''}
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={machineCode ? handleBrowseClick : undefined}
            title={!machineCode ? "Please enter machine code first" : ""}
          >
            <div className="flex flex-col items-center justify-center">
              {isLoading ? (
                <div className="flex flex-col items-center gap-4">
                  <FaSpinner className="text-5xl text-blue-500 animate-spin" />
                  <p className="text-lg text-gray-600 font-medium">Processing Excel file...</p>
                </div>
              ) : (
                <>
                  <div className={`
                    p-4 rounded-full mb-6 transition-colors duration-300
                    ${isDragging ? 'bg-green-100' : 'bg-blue-100'}
                  `}>
                    <FaUpload className={`
                      text-5xl transition-colors duration-300
                      ${isDragging ? 'text-green-500' : 'text-blue-500'}
                    `} />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {isDragging ? 'Drop your Excel file here' : 'Drag & Drop Excel File Here'}
                  </h3>
                  
                  <p className="text-gray-600 text-lg mb-4">
                    {machineCode 
                      ? `Machine Code: ${machineCode}` 
                      : 'Please enter machine code above'
                    }
                  </p>
                  
                  {machineCode && (
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                      <FaInfoCircle />
                      Supports: .xlsx, .xls, .csv
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-fade-in">
              <div className="flex items-center gap-2">
                <FaTimes className="text-red-500 flex-shrink-0" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}
          
          {!error && !currentFile && machineCode && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaInfoCircle className="text-blue-500" />
                How to use:
              </h4>
              <ol className="list-decimal pl-5 space-y-3 text-gray-700">
                <li className="pl-2">Enter machine code above</li>
                <li className="pl-2">Drag and drop an Excel file into the zone</li>
                <li className="pl-2">Or click to browse and select a file</li>
                <li className="pl-2">Users will be added to the system automatically</li>
                <li className="pl-2">Emails with PINs will be sent to provided email addresses</li>
                <li className="pl-2">Download the results with generated PINs</li>
              </ol>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-semibold text-blue-800 mb-2">Excel File Format:</h5>
                <p className="text-sm text-gray-700">
                  Required columns: <code className="bg-gray-100 px-2 py-1 rounded">cardNumber</code> OR <code className="bg-gray-100 px-2 py-1 rounded">employeeID</code> AND <code className="bg-gray-100 px-2 py-1 rounded">balance</code>
                  <br />
                  Optional columns: <code className="bg-gray-100 px-2 py-1 rounded">name</code>, <code className="bg-gray-100 px-2 py-1 rounded">email</code>, <code className="bg-gray-100 px-2 py-1 rounded">mobile_number</code>
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExcelReader;