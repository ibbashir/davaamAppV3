import React from "react";

interface Props {
  status: string;
}

/**
 * Pill badge that visually distinguishes ongoing vs completed rides.
 */
const RideStatusBadge: React.FC<Props> = ({ status }) => {
  const isOngoing = status === "ongoing";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        isOngoing ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
      }`}
    >
      {isOngoing ? "🔵 Ongoing" : "✅ Completed"}
    </span>
  );
};

export default RideStatusBadge;