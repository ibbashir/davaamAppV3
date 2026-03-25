import React from "react";

interface Props {
  title: string;
  children: React.ReactNode;
}

// Reusable wrapper card — all 4 report cards use this
const StatCard: React.FC<Props> = ({ title, children }) => (
  <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-200">
    <h4 className="text-xl font-semibold text-gray-900 mb-4 border-b-2 border-gray-100 pb-2">
      {title}
    </h4>
    {children}
  </div>
);

export default StatCard;