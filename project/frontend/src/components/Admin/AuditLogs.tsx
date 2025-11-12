import React, { useState, useEffect } from 'react';
import { Download, FileText, Loader } from 'lucide-react';
import axios from '../../utils/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AuditLog {
  id: string;
  action: string;
  details: string;
  hospital: string;
  timestamp: string;
  type: string;
}

const AuditLogs = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch audit logs from API
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      console.log('Fetching audit logs...');
      const response = await axios.get('/blood-requests/admin/audit-logs');
      
      if (response.data && response.data.success) {
        setAuditLogs(response.data.data);
        setError(null);
        console.log('Audit logs loaded:', response.data.data.length);
      } else {
        setError('Failed to load audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setError('Unable to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Load audit logs on component mount
  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // Export functionality
  const exportAuditLogs = (format: 'csv' | 'pdf') => {
    if (auditLogs.length === 0) {
      alert('No audit logs to export');
      return;
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `audit-logs-${currentDate}`;

    if (format === 'csv') {
      // CSV Export
      const csvHeaders = [
        'Action',
        'Details',
        'Hospital/User',
        'Timestamp',
        'Type'
      ];

      const csvData = auditLogs.map(log => [
        log.action || 'N/A',
        log.details || 'N/A',
        log.hospital || 'N/A',
        log.timestamp || 'N/A',
        log.type || 'N/A'
      ]);

      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } else if (format === 'pdf') {
      // PDF Export
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text('Audit Logs Report', 14, 22);
      
      // Add generation date
      doc.setFontSize(11);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
      doc.text(`Total Records: ${auditLogs.length}`, 14, 40);

      // Prepare table data
      const tableHeaders = ['Action', 'Details', 'Hospital/User', 'Timestamp', 'Type'];
      const tableData = auditLogs.map(log => [
        log.action || 'N/A',
        (log.details || 'N/A').length > 50 ? (log.details || 'N/A').substring(0, 50) + '...' : log.details || 'N/A',
        log.hospital || 'N/A',
        log.timestamp || 'N/A',
        log.type || 'N/A'
      ]);

      // Add table using autoTable plugin
      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 50,
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [220, 38, 38], // Red color matching the theme
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          0: { cellWidth: 30 }, // Action
          1: { cellWidth: 70 }, // Details
          2: { cellWidth: 35 }, // Hospital/User
          3: { cellWidth: 40 }, // Timestamp
          4: { cellWidth: 25 }  // Type
        },
        margin: { top: 50, left: 14, right: 14 },
        didDrawPage: (data: any) => {
          // Add page numbers
          doc.setFontSize(8);
          doc.text(`Page ${data.pageNumber}`, 
            doc.internal.pageSize.width - 30, 
            doc.internal.pageSize.height - 10
          );
        }
      });

      // Save the PDF
      doc.save(`${filename}.pdf`);
    }
  };

  return (
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
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader className="h-5 w-5 animate-spin text-red-500" />
                    <span className="text-gray-600">Loading audit logs...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="py-8 text-center">
                  <div className="text-red-600">
                    <p className="font-medium">Error loading audit logs</p>
                    <p className="text-sm">{error}</p>
                    <button 
                      onClick={fetchAuditLogs}
                      className="mt-2 text-red-500 hover:text-red-700 underline"
                    >
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            ) : auditLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  No audit logs found
                </td>
              </tr>
            ) : (
              auditLogs.map((log) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  );
};

export { AuditLogs };