import { useEffect, useState } from "react";
import CorporateRegisterForm from "./corporateRegisterForm";
import RegisteredCorporatesList from "./registeredCorporates";
import CorporateHistory from "./corporateHistory";

import { SiteHeader } from "@/components/superAdmin/site-header";
import { getRequest } from "@/Apis/Api";

interface TopupHistoryResponse {
  currentMonthlyTopups?: number;
  status?: number;
  totalEmployees?: number;
  total_companies?: number;
  total_sum?: number;
  total_topups?: number;
  data: TopupHistoryData[];
  pagination?: TopupHistoryPagination;
}

interface TopupHistoryPagination {
  current_page: number;
  has_next: number;
  has_prev: number;
  limit: number;
  total_pages: number;
  total_records: number;
}

interface TopupHistoryData {
  amount: string;
  corporate_name: string;
  created_at: string;
  epoch_time: number;
  id: number;
  purpose_of_payment: string;
  uuid: string;
}

interface PaginationState {
  current_page: number;
  limit: number;
  total_records: number;
  total_pages: number;
}

interface CorporateStats {
  totalEmployees: number;
  total_sum: number;
  total_companies: number;
  total_topups: number;
  overall_topups: number;
  data: TopupHistoryData[];
}

const CorporateTopup = () => {
  const [showModal, setShowModal] = useState(false);

  // Corporate history state
  const [loading, setLoading] = useState(true);
  const [corporates, setCorporates] = useState<CorporateStats>({
    totalEmployees: 0,
    total_sum: 0,
    total_companies: 0,
    total_topups: 0,
    overall_topups: 0,
    data: []
  });
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    current_page: 1,
    limit: 10,
    total_records: 0,
    total_pages: 0,
  });

  const fetchCorporates = async (page: number = 1, limit: number = 10, search="") => {
    try {
      setLoading(true);
      const response = await getRequest(
        `/superadmin/getCorporateTopupHistory?page=${page}&limit=${limit}&search=${search.trim()}`
      ) as TopupHistoryResponse;

      if (response && response.data) {
        setCorporates({
          totalEmployees: response.totalEmployees || 0,
          total_sum: response.total_sum || 0,
          total_companies: response.total_companies || 0,
          total_topups: response.total_topups || 0,
          overall_topups: response.currentMonthlyTopups || 0,
          data: response.data
        });

        // Use response pagination if available, otherwise calculate from total_topups
        if (response.pagination) {
          setPagination({
            current_page: response.pagination.current_page,
            limit: response.pagination.limit,
            total_records: response.pagination.total_records,
            total_pages: response.pagination.total_pages,
          });
        } else if (response.total_topups) {
          setPagination({
            current_page: page,
            limit: limit,
            total_records: response.total_topups,
            total_pages: Math.ceil(response.total_topups / limit),
          });
        } else {
          setPagination({
            current_page: page,
            limit: limit,
            total_records: response.data.length,
            total_pages: 1,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching corporates:", err);
      setError("Failed to load corporate data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorporates(1, 10);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tables Section */}
      <div className="">
        <SiteHeader title="Registered Corporates" />

        <div className="flex justify-start mt-2 mr-2">
          {/* Empty div for layout if needed */}
        </div>

        <div className="bg-white rounded-xl shadow">
          <RegisteredCorporatesList setShowModal={setShowModal} fetchCorporatesAll={fetchCorporates}/>
        </div>

        <div className="bg-white rounded-xl shadow">
          <CorporateHistory 
            loading={loading} 
            corporates={corporates} 
            error={error} 
            pagination={pagination} 
            fetchCorporates={fetchCorporates}
          />
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
              className="absolute top-3 right-4 cursor-pointer text-gray-500 hover:text-gray-700 text-xl"
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