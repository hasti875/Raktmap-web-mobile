import React from 'react';
import { Download, FileText } from 'lucide-react';

const mockAuditLogs = [
  {
    id: 1,
    action: 'Login',
    details: 'Admin logged in',
    hospital: 'City Hospital',
    timestamp: '2025-07-28 10:00',
    type: 'notification',
  },
  {
    id: 2,
    action: 'Blood Request',
    details: 'Requested 2 units O+',
    hospital: 'Metro Hospital',
    timestamp: '2025-07-28 10:10',
    type: 'location',
  },
  {
    id: 3,
    action: 'Donor Added',
    details: 'New donor registered',
    hospital: 'City Hospital',
    timestamp: '2025-07-28 10:20',
    type: 'other',
  },
];

function exportAuditLogs(format: 'csv' | 'pdf') {
  // Placeholder for export logic
  alert(`Exporting as ${format.toUpperCase()}`);
}

const AuditLogs = () => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Audit Panel</h2>
        <p className="text-gray-600">System activity logs and security audit trail</p>
      </div>
      <div className="flex space-x-3">
        <button 
          onClick={() => exportAuditLogs('csv')}
          className="bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-lg"
        >
          <Download className="h-5 w-5" />
          <span>Export CSV</span>
        </button>
        <button 
          onClick={() => exportAuditLogs('pdf')}
          className="bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center space-x-2 shadow-lg"
        >
          <FileText className="h-5 w-5" />
          <span>Export PDF</span>
        </button>
      </div>
    </div>

    <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-100">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-4 px-4 font-semibold text-gray-700">Action</th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">Details</th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">Hospital/User</th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">Timestamp</th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">Type</th>
            </tr>
          </thead>
          <tbody>
            {mockAuditLogs.map((log) => (
              <tr key={log.id} className="border-b border-gray-100 hover:bg-red-50 transition-colors">
                <td className="py-4 px-4 font-medium text-gray-900">{log.action}</td>
                <td className="py-4 px-4 text-gray-600">{log.details}</td>
                <td className="py-4 px-4 text-gray-600">{log.hospital}</td>
                <td className="py-4 px-4 text-gray-600">{log.timestamp}</td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    log.type === 'notification' 
                      ? 'bg-blue-100 text-blue-800' 
                      : log.type === 'location'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {log.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export { AuditLogs };