import { useState, useEffect } from 'react';
import { Droplet, Save, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface BloodStock {
  _id?: string;
  bloodGroup: string;
  unitsAvailable: number;
  status: string;
  lastUpdated: string | null;
  notes?: string;
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
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'available':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'low':
    case 'critical':
      return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    case 'out_of_stock':
      return <AlertTriangle className="h-5 w-5 text-red-600" />;
    default:
      return null;
  }
};

export function BloodStockManagement() {
  const [stocks, setStocks] = useState<BloodStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({});
  const [editValues, setEditValues] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/blood-stock/my-stock', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const stockData = response.data.stocks || [];
        
        // Ensure all blood groups are represented
        const fullStockData = BLOOD_GROUPS.map(bg => {
          const existing = stockData.find((s: BloodStock) => s.bloodGroup === bg);
          return existing || {
            bloodGroup: bg,
            unitsAvailable: 0,
            status: 'out_of_stock',
            lastUpdated: null
          };
        });
        
        setStocks(fullStockData);
        
        // Initialize edit values
        const initialValues: { [key: string]: number } = {};
        fullStockData.forEach((stock: BloodStock) => {
          initialValues[stock.bloodGroup] = stock.unitsAvailable;
        });
        setEditValues(initialValues);
      }
    } catch (error: any) {
      console.error('Error fetching stock:', error);
      toast.error('Failed to load blood stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bloodGroup: string) => {
    setEditMode({ ...editMode, [bloodGroup]: true });
  };

  const handleCancel = (bloodGroup: string) => {
    const originalStock = stocks.find(s => s.bloodGroup === bloodGroup);
    if (originalStock) {
      setEditValues({ ...editValues, [bloodGroup]: originalStock.unitsAvailable });
    }
    setEditMode({ ...editMode, [bloodGroup]: false });
  };

  const handleSave = async (bloodGroup: string) => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const units = editValues[bloodGroup] || 0;

      const response = await axios.post(
        'http://localhost:5000/blood-stock/update',
        {
          bloodGroup,
          unitsAvailable: units
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success(`${bloodGroup} stock updated successfully`);
        setEditMode({ ...editMode, [bloodGroup]: false });
        await fetchStockData();
      }
    } catch (error: any) {
      console.error('Error updating stock:', error);
      toast.error(error.response?.data?.error || 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const stocksToUpdate = BLOOD_GROUPS.map(bg => ({
        bloodGroup: bg,
        unitsAvailable: editValues[bg] || 0
      }));

      const response = await axios.post(
        'http://localhost:5000/blood-stock/bulk-update',
        { stocks: stocksToUpdate },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('All blood stocks updated successfully');
        setEditMode({});
        await fetchStockData();
      }
    } catch (error: any) {
      console.error('Error bulk updating stocks:', error);
      toast.error(error.response?.data?.error || 'Failed to update stocks');
    } finally {
      setSaving(false);
    }
  };

  const handleValueChange = (bloodGroup: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setEditValues({ ...editValues, [bloodGroup]: Math.max(0, numValue) });
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Droplet className="h-8 w-8 text-red-600 mr-3" />
              Blood Stock Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your hospital's blood inventory
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchStockData}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleBulkSave}
              disabled={saving}
              className="flex items-center px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Stock Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">Available</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {stocks.filter(s => s.status === 'available').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {stocks.filter(s => s.status === 'low').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 dark:text-orange-400">Critical</p>
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {stocks.filter(s => s.status === 'critical').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 dark:text-red-400">Out of Stock</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {stocks.filter(s => s.status === 'out_of_stock').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      {/* Stock List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Blood Group
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Units Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {stocks.map((stock) => (
                <tr key={stock.bloodGroup} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Droplet className="h-5 w-5 text-red-600 mr-2" />
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {stock.bloodGroup}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editMode[stock.bloodGroup] ? (
                      <input
                        type="number"
                        min="0"
                        value={editValues[stock.bloodGroup]}
                        onChange={(e) => handleValueChange(stock.bloodGroup, e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    ) : (
                      <span className="text-xl font-semibold text-gray-900 dark:text-white">
                        {stock.unitsAvailable}
                      </span>
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">units</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(stock.status)}`}>
                      {getStatusIcon(stock.status)}
                      <span className="ml-2 capitalize">{stock.status.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {stock.lastUpdated 
                      ? new Date(stock.lastUpdated).toLocaleString()
                      : 'Never updated'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {editMode[stock.bloodGroup] ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave(stock.bloodGroup)}
                          disabled={saving}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => handleCancel(stock.bloodGroup)}
                          disabled={saving}
                          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 font-medium disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(stock.bloodGroup)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Stock Status Guide</h3>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
            <li>• <strong>Available:</strong> More than 10 units</li>
            <li>• <strong>Low:</strong> 6-10 units</li>
            <li>• <strong>Critical:</strong> 1-5 units</li>
            <li>• <strong>Out of Stock:</strong> 0 units</li>
          </ul>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h3 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">Best Practices</h3>
          <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-400">
            <li>• Update stock daily, preferably in the morning</li>
            <li>• Maintain minimum 10 units for common blood groups</li>
            <li>• Notify donors when critical or out of stock</li>
            <li>• Use bulk save to update all groups at once</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
