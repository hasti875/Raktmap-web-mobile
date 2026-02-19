import { useState, useEffect } from 'react';
import { Droplet, MapPin, Phone, RefreshCw, Search, Building2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Hospital {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  emergencyContact?: string;
}

interface Stock {
  bloodGroup: string;
  unitsAvailable: number;
  status: string;
  lastUpdated: string;
}

interface HospitalStock {
  hospital: Hospital;
  stocks: Stock[];
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'low':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'critical':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'out_of_stock':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function AvailableBloodStock() {
  const [hospitals, setHospitals] = useState<HospitalStock[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<HospitalStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAvailableStock();
  }, []);

  useEffect(() => {
    filterHospitals();
  }, [selectedBloodGroup, searchQuery, hospitals]);

  const fetchAvailableStock = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/blood-stock/all');

      if (response.data.success) {
        setHospitals(response.data.hospitals || []);
      }
    } catch (error: any) {
      console.error('Error fetching blood stock:', error);
      toast.error('Failed to load blood stock data');
    } finally {
      setLoading(false);
    }
  };

  const filterHospitals = () => {
    let filtered = [...hospitals];

    // Filter by blood group
    if (selectedBloodGroup) {
      filtered = filtered.filter(h =>
        h.stocks.some(s => s.bloodGroup === selectedBloodGroup && s.unitsAvailable > 0)
      ).map(h => ({
        ...h,
        stocks: h.stocks.filter(s => s.bloodGroup === selectedBloodGroup)
      }));
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(h =>
        h.hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.hospital.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredHospitals(filtered);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Droplet className="h-8 w-8 text-red-600 mr-3" />
              Available Blood Stock
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Find hospitals with available blood near you
            </p>
          </div>
          <button
            onClick={fetchAvailableStock}
            className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search hospitals by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Blood Group Filter */}
          <select
            value={selectedBloodGroup}
            onChange={(e) => setSelectedBloodGroup(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Blood Groups</option>
            {BLOOD_GROUPS.map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-blue-900 dark:text-blue-300">
          <strong>{filteredHospitals.length}</strong> {filteredHospitals.length === 1 ? 'hospital' : 'hospitals'} with available blood
          {selectedBloodGroup && <strong> type {selectedBloodGroup}</strong>}
        </p>
      </div>

      {/* Hospital List */}
      {filteredHospitals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Hospitals Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {selectedBloodGroup
              ? `No hospitals currently have ${selectedBloodGroup} blood in stock.`
              : 'No hospitals have updated their blood stock.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredHospitals.map((hospitalStock) => (
            <div
              key={hospitalStock.hospital._id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Hospital Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{hospitalStock.hospital.name}</h2>
                    {hospitalStock.hospital.address && (
                      <div className="flex items-center text-red-100 mb-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="text-sm">{hospitalStock.hospital.address}</span>
                      </div>
                    )}
                    {(hospitalStock.hospital.phone || hospitalStock.hospital.emergencyContact) && (
                      <div className="flex items-center text-red-100">
                        <Phone className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          {hospitalStock.hospital.emergencyContact || hospitalStock.hospital.phone}
                        </span>
                      </div>
                    )}
                  </div>
                  <Building2 className="h-12 w-12 text-red-100" />
                </div>
              </div>

              {/* Stock Information */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Available Blood Stock
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {hospitalStock.stocks.map((stock) => (
                    <div
                      key={stock.bloodGroup}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center"
                    >
                      <div className="flex items-center justify-center mb-2">
                        <Droplet className="h-5 w-5 text-red-600 mr-1" />
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {stock.bloodGroup}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-red-600 mb-2">
                        {stock.unitsAvailable}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">units</div>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(stock.status)}`}>
                        {stock.status.replace('_', ' ')}
                      </span>
                      {stock.lastUpdated && (
                        <div className="text-xs text-gray-400 mt-2">
                          Updated: {new Date(stock.lastUpdated).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">⚠️ Important Note</h3>
        <p className="text-sm text-amber-800 dark:text-amber-400">
          Blood stock availability shown here is as per the last update by the hospital. 
          Always call the hospital to confirm availability before visiting. Emergency situations take priority.
        </p>
      </div>
    </div>
  );
}
