import React, { useState, useEffect } from 'react';
import { Users, Download, Eye, Edit, Trash2, RefreshCw, XCircle, Upload } from 'lucide-react';
import { Table } from '../Shared/Table';
import { Modal } from '../Shared/Modal';
import { Donor } from '../../types';
import axios from '../../utils/axios';

export function DonorManagement() {
  const [searchValue, setSearchValue] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDonors, setSelectedDonors] = useState<string[]>([]);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit'>('view');
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bloodGroup: '',
    address: '',
    status: 'available'
  });
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<any | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Fetch donors from API
  const fetchDonors = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching donors from database...');
      const response = await axios.get('/admin/donors');
      if (response.data.success) {
        setDonors(response.data.donors);
        console.log('Fetched donors:', response.data.donors.length);
      } else {
        throw new Error(response.data.message || 'Failed to fetch donors');
      }
    } catch (err: any) {
      console.error('Error fetching donors:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch donors');
    } finally {
      setLoading(false);
    }
  };

  // Fetch donors on component mount
  useEffect(() => {
    fetchDonors();
  }, []);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isModalOpen) {
      if (modalType === 'edit' && selectedDonor) {
        setFormData({
          name: selectedDonor.name,
          email: selectedDonor.email,
          phone: selectedDonor.phone,
          bloodGroup: selectedDonor.bloodGroup,
          address: selectedDonor.address || '',
          status: selectedDonor.status || 'available'
        });
      }
    }
  }, [isModalOpen, modalType, selectedDonor]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update donor
  const handleUpdateDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonor) return;
    
    try {
      const response = await axios.put(`/admin/donors/${selectedDonor._id}`, formData);
      if (response.data.success) {
        await fetchDonors();
        setIsModalOpen(false);
        setSelectedDonor(null);
      }
    } catch (err: any) {
      console.error('Error updating donor:', err);
      setError(err.response?.data?.message || 'Failed to update donor');
    }
  };

  // Delete donor
  const handleDeleteDonor = async (donorId: string) => {
    if (!confirm('Are you sure you want to delete this donor?')) return;
    
    try {
      const response = await axios.delete(`/admin/donors/${donorId}`);
      if (response.data.success) {
        await fetchDonors();
      }
    } catch (err: any) {
      console.error('Error deleting donor:', err);
      setError(err.response?.data?.message || 'Failed to delete donor');
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const statuses = ['available', 'responded', 'unavailable'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'responded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'unavailable':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const columns = [
    {
      key: 'select' as keyof Donor,
      label: '',
      render: (_: any, donor: Donor) => (
        <input
          type="checkbox"
          checked={selectedDonors.includes(donor._id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedDonors([...selectedDonors, donor._id]);
            } else {
              setSelectedDonors(selectedDonors.filter(id => id !== donor._id));
            }
          }}
          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
        />
      )
    },
    { key: 'name' as keyof Donor, label: 'Name' },
    { key: 'bloodGroup' as keyof Donor, label: 'Blood Group' },
    { key: 'phone' as keyof Donor, label: 'Contact' },
    {
      key: 'lastDonation' as keyof Donor,
      label: 'Last Donation',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    { key: 'address' as keyof Donor, label: 'Location' },
    {
      key: 'status' as keyof Donor,
      label: 'Status',
      render: (status: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
          {status}
        </span>
      )
    },
    {
      key: 'id' as keyof Donor,
      label: 'Actions',
      render: (_: any, donor: Donor) => (
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedDonor(donor);
              setModalType('view');
              setIsModalOpen(true);
            }}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedDonor(donor);
              setModalType('edit');
              setIsModalOpen(true);
            }}
            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button 
            onClick={() => handleDeleteDonor(donor._id)}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const filteredDonors = donors.filter(donor => {
    const matchesSearch = donor.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                         donor.email.toLowerCase().includes(searchValue.toLowerCase()) ||
                         donor.phone.includes(searchValue);
    const matchesBloodGroup = !selectedBloodGroup || donor.bloodGroup === selectedBloodGroup;
    const matchesStatus = !selectedStatus || donor.status === selectedStatus;
    
    return matchesSearch && matchesBloodGroup && matchesStatus;
  });

  // (Removed old bulk action handler – now only bulk delete is supported)

  const handleSelectAll = () => {
    if (selectedDonors.length === filteredDonors.length) {
      setSelectedDonors([]);
    } else {
      setSelectedDonors(filteredDonors.map(donor => donor._id));
    }
  };

  // Build CSV from current donors and trigger download
  const handleExport = () => {
    if (!donors.length) return;
    const headers = ['name','email','phone','bloodGroup','rollNo'];
    const lines = [headers.join(',')];
    donors.forEach(d => {
      const row = [d.name, d.email, d.phone, d.bloodGroup, d.rollNo || '']
        .map(value => {
          if (value == null) return '';
          const needsQuote = /[",\n]/.test(String(value));
          let v = String(value).replace(/"/g, '""');
            return needsQuote ? `"${v}"` : v;
        });
      lines.push(row.join(','));
    });
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donors_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Trigger hidden file input
  const triggerImport = () => {
    setImportSummary(null);
    fileInputRef.current?.click();
  };

  // Very small CSV parser (no external lib)
  const parseCSV = (text: string) => {
    const clean = text.replace(/\uFEFF/g,'');
    const rawLines = clean.split(/\r?\n/);
    const lines = rawLines.filter(l => l.trim().length > 0);
    if (!lines.length) return [];
    // parse header line with quotes
    const headerLine = lines[0];
    const headers: string[] = [];
    let hCur = ''; let hQuotes = false;
    for (let i=0;i<headerLine.length;i++) {
      const ch = headerLine[i];
      if (ch === '"') { if (hQuotes && headerLine[i+1]==='"'){ hCur+='"'; i++; } else hQuotes=!hQuotes; }
      else if (ch === ',' && !hQuotes) { headers.push(hCur.trim().replace(/^"|"$/g,'')); hCur=''; }
      else hCur += ch;
    }
    headers.push(hCur.trim().replace(/^"|"$/g,''));

    const mapKey = (k:string) => k.toLowerCase().replace(/[^a-z0-9]/g,'');
    const headerMap: Record<string,string> = {};
    headers.forEach(h=>{
      const sk = mapKey(h);
      if (/^name/.test(sk)) headerMap[h] = 'name';
      else if (sk === 'email' || sk === 'mail' || sk === 'emailid') headerMap[h] = 'email';
      else if (sk.startsWith('phone')||sk.includes('mobile')||sk==='contact'||sk==='number') headerMap[h] = 'phone';
      else if (sk.startsWith('blood')) headerMap[h] = 'bloodGroup';
      else if (sk.startsWith('roll')||sk.includes('enroll')||sk==='id'||sk==='studentid') headerMap[h] = 'rollNo';
      else headerMap[h] = h; // keep original
    });

    const rows: any[] = [];
    for (let li=1; li<lines.length; li++) {
      const line = lines[li];
      const cols: string[] = [];
      let cur=''; let inQuotes=false;
      for (let i=0;i<line.length;i++) {
        const ch = line[i];
        if (ch==='"') { if (inQuotes && line[i+1]==='"'){ cur+='"'; i++; } else inQuotes=!inQuotes; }
        else if (ch===',' && !inQuotes) { cols.push(cur); cur=''; }
        else cur+=ch;
      }
      cols.push(cur);
      if (cols.every(c=>c.trim()==='')) continue; // skip blank row
      const obj:any = {};
      headers.forEach((h, idx) => {
        obj[headerMap[h]] = (cols[idx]||'').trim();
      });
      rows.push(obj);
    }
    return rows;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (!rows.length) throw new Error('No data rows found');
      // Send to backend
      const response = await axios.post('/admin/donors/import', { donors: rows }, { headers: { 'Content-Type': 'application/json' }});
      setImportSummary(response.data);
      await fetchDonors();
    } catch (err: any) {
      console.error('Import failed', err);
      setImportSummary({ success: false, message: err.message || 'Import failed'});
    } finally {
      setImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const headers = 'name,email,phone,bloodGroup,rollNo';
    const sample = 'John Doe,john@example.com,9876543210,A+,12345';
    const csv = headers + '\n' + sample;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'donor_import_template.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Donor Management</h2>
          {!loading && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {donors.length} donors found
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={fetchDonors}
            disabled={loading}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button onClick={handleExport} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>{donors.length ? 'Export' : 'Export (0)'}</span>
          </button>
          <button onClick={triggerImport} disabled={importing} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
            <Upload className={`h-4 w-4 ${importing ? 'animate-pulse' : ''}`} />
            <span>{importing ? 'Importing...' : 'Import CSV'}</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading donors...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-red-700 dark:text-red-300">Error loading donors: {error}</span>
          </div>
          <button
            onClick={fetchDonors}
            className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content - Only show when not loading and no error */}
      {!loading && !error && (
        <>
          {importSummary && (
            <div className={`p-4 rounded-lg border text-sm ${importSummary.success ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <strong>{importSummary.message || (importSummary.success ? 'Import complete' : 'Import failed')}</strong>
                  {importSummary.inserted != null && (
                    <span className="ml-2">Inserted: {importSummary.inserted} | Skipped: {importSummary.skipped} | Total: {importSummary.total}</span>
                  )}
                </div>
                {importSummary.credentials && importSummary.credentials.length > 0 && (
                  <button onClick={() => {
                    const header = 'email,tempPassword';
                    const rows = importSummary.credentials.map((c: any) => `${c.email},${c.tempPassword}`);
                    const csv = header + '\n' + rows.join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'new_donor_credentials.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
                  }} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Download Passwords</button>
                )}
              </div>
              {importSummary.results && importSummary.results.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer">Details ({importSummary.results.length})</summary>
                  <div className="max-h-40 overflow-auto mt-2 space-y-1 text-xs">
                    {importSummary.results.slice(0,200).map((r: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span>Row {r.index}: {r.email || 'N/A'}</span>
                        <span className={`ml-2 ${r.status === 'inserted' ? 'text-green-600' : r.status === 'skipped' ? 'text-yellow-600' : 'text-red-600'}`}>{r.status}{r.reason ? ` - ${r.reason}` : ''}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
              <div className="mt-2 flex space-x-2">
                <button onClick={downloadTemplate} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Template</button>
                <button onClick={() => setImportSummary(null)} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Dismiss</button>
              </div>
            </div>
          )}
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Donors</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{donors.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
                  <p className="text-2xl font-bold text-green-600">{donors.filter(d => d.status === 'available').length}</p>
                </div>
            <div className="w-8 h-8 rounded-full bg-green-500"></div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Responded</p>
              <p className="text-2xl font-bold text-blue-600">{donors.filter(d => d.status === 'responded').length}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-500"></div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unavailable</p>
              <p className="text-2xl font-bold text-red-600">{donors.filter(d => d.status === 'unavailable').length}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-red-500"></div>
          </div>
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={selectedBloodGroup}
              onChange={(e) => setSelectedBloodGroup(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Blood Groups</option>
              {bloodGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {selectedDonors.length > 0 && (
            <div className="flex space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 self-center">
                {selectedDonors.length} selected
              </span>
              <button
                onClick={async () => {
                  if (!confirm(selectedDonors.length === donors.length ? 'Delete ALL donors? This cannot be undone.' : `Delete ${selectedDonors.length} selected donors?`)) return;
                  try {
                    if (selectedDonors.length === donors.length) {
                      await axios.delete('http://localhost:5000/admin/donors', { data: { all: true } });
                    } else {
                      await axios.delete('http://localhost:5000/admin/donors', { data: { ids: selectedDonors } });
                    }
                    setSelectedDonors([]);
                    await fetchDonors();
                  } catch (err:any) {
                    alert('Bulk delete failed: ' + (err.response?.data?.message || err.message));
                  }
                }}
                className="flex items-center space-x-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete{selectedDonors.length === donors.length ? ' All' : ''}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table with Select All */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={selectedDonors.length === filteredDonors.length && filteredDonors.length > 0}
              onChange={handleSelectAll}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Select All</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search donors..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        
        <Table
          data={filteredDonors}
          columns={columns}
        />
      </div>

      {/* Donor Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalType === 'view' ? 'Donor Details' : 'Edit Donor'}
        size="lg"
      >
        {selectedDonor && modalType === 'view' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <p className="text-gray-900 dark:text-white">{selectedDonor.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Blood Group</label>
                <p className="text-gray-900 dark:text-white">{selectedDonor.bloodGroup}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <p className="text-gray-900 dark:text-white">{selectedDonor.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <p className="text-gray-900 dark:text-white">{selectedDonor.phone}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                <p className="text-gray-900 dark:text-white">{selectedDonor.address || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDonor.status || 'available')}`}>
                  {selectedDonor.status || 'available'}
                </span>
              </div>
            </div>
          </div>
        )}

        {selectedDonor && modalType === 'edit' && (
          <form onSubmit={handleUpdateDonor} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Blood Group</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {bloodGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>
        </>
      )}
    </div>
  );
}