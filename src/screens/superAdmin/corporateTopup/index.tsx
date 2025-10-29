"use client";

import React, { useState } from "react";
import { FaPlus } from "react-icons/fa";
import CorporateRegisterForm from "./corporateRegisterForm";
import RegisteredCorporatesList from "./registeredCorporates";
import CorporateHistory from "./corporateHistory";

const CorporateTopup = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Corporate Topup Management
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
        >
          <FaPlus /> Add Corporate
        </button>
      </div>

      {/* Tables Section */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">
            Registered Corporates
          </h2>
          <RegisteredCorporatesList />
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">
            Corporate History
          </h2>
          <CorporateHistory />
        </div>
      </div>

      {/* ✅ Modal Section */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Background blur but not black */}
          <div
            className="absolute inset-0 bg-white/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 z-10">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
              Register New Corporate
            </h2>
            <CorporateRegisterForm closeModal={() => setShowModal(false)} />

            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorporateTopup;
