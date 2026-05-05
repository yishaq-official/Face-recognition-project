import React, { useState } from 'react';
import { Upload, Camera, AlertTriangle, CheckCircle, Fingerprint } from 'lucide-react';

export default function Enrollment() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    employeeId: `AGS-${Math.floor(Math.random() * 9000) + 1000}`, // Auto-generate random ID
    clearance: 'UNCLASSIFIED'
  });
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, enrolling, success, error
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleEnrollment = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus('error');
      setMessage('A verified ID photo must be uploaded.');
      return;
    }

    setStatus('enrolling');
    setMessage('Initiating Live Verification Protocol...');

    // 1. Package the text data into the required JSON structure
    const personnelData = {
      name: { first: formData.firstName, last: formData.lastName },
      employee_id: formData.employeeId,
      position: { clearance_level: formData.clearance }
    };

    // 2. Build the Multi-Part Form Data
    const payload = new FormData();
    payload.append('id_photo', file);
    payload.append('personnel_data', JSON.stringify(personnelData));

    try {
      // 3. Send to Flask Backend
      const response = await fetch('http://localhost:5000/api/verify_and_enroll', {
        method: 'POST',
        body: payload,
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
        // Reset form on success
        setFormData({ ...formData, firstName: '', lastName: '', employeeId: `AGS-${Math.floor(Math.random() * 9000) + 1000}` });
        setFile(null);
      } else {
        setStatus('error');
        setMessage(data.message || 'Verification failed.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('CRITICAL ERROR: Unable to contact Security Server.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 border-b border-zinc-800 pb-4">
        <h1 className="text-3xl font-light tracking-widest text-white uppercase">Personnel Enrollment</h1>
        <p className="text-zinc-500 mt-2 text-sm font-mono">> Biometric Registration & Live Verification Required</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Data Entry */}
        <form onSubmit={handleEnrollment} className="space-y-6 bg-zinc-900 border border-zinc-800 p-6 rounded-lg shadow-2xl">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-zinc-500 mb-2">First Name</label>
              <input type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange}
                className="w-full bg-black border border-zinc-700 rounded p-3 text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs uppercase text-zinc-500 mb-2">Last Name</label>
              <input type="text" name="lastName" required value={formData.lastName} onChange={handleInputChange}
                className="w-full bg-black border border-zinc-700 rounded p-3 text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-zinc-500 mb-2">Agent ID (Auto-Gen)</label>
              <input type="text" name="employeeId" readOnly value={formData.employeeId}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-zinc-500 cursor-not-allowed font-mono" />
            </div>
            <div>
              <label className="block text-xs uppercase text-zinc-500 mb-2">Clearance Level</label>
              <select name="clearance" value={formData.clearance} onChange={handleInputChange}
                className="w-full bg-black border border-zinc-700 rounded p-3 text-white focus:border-green-500 focus:outline-none">
                <option value="UNCLASSIFIED">UNCLASSIFIED</option>
                <option value="SECRET">SECRET</option>
                <option value="TOP SECRET">TOP SECRET</option>
                <option value="TOP SECRET // SCI">TOP SECRET // SCI</option>
              </select>
            </div>
          </div>

          {/* File Upload Zone */}
          <div>
            <label className="block text-xs uppercase text-zinc-500 mb-2">Official ID Photo Reference</label>
            <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 flex flex-col items-center justify-center bg-black/50 hover:bg-black transition-colors relative">
              <input type="file" accept="image/jpeg, image/png" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              {file ? (
                <div className="text-center">
                  <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                  <p className="text-green-400 font-bold">{file.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">Ready for verification</p>
                </div>
              ) : (
                <div className="text-center pointer-events-none">
                  <Upload className="mx-auto text-zinc-500 mb-2" size={32} />
                  <p className="text-zinc-400">Click or drag ID photo here</p>
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={status === 'enrolling'}
            className="w-full bg-green-600 hover:bg-green-500 text-black font-bold uppercase tracking-widest p-4 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {status === 'enrolling' ? (
              <><Fingerprint className="animate-pulse" /> Verifying Live Subject...</>
            ) : (
              'Initiate Verification & Enroll'
            )}
          </button>
        </form>

        {/* RIGHT COLUMN: Live Verification Monitor */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-full shadow-xl">
            <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
              <span className="text-xs uppercase text-zinc-400 flex items-center gap-2">
                <Camera size={14} /> Live Verification Feed
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            </div>
            
            {/* The Live Video Feed from our Flask Server */}
            <div className="flex-1 bg-black relative min-h-[300px]">
               <img 
                  src="http://localhost:5000/video_feed" 
                  alt="Live Scanner" 
                  className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale"
                />
                {/* Scanline overlay for cyber effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none"></div>
            </div>

            {/* Status Readout Console */}
            <div className="p-4 bg-black border-t border-zinc-800 min-h-[100px] font-mono text-sm">
              <p className="text-zinc-600">> Awaiting subject positioning...</p>
              {status === 'enrolling' && <p className="text-yellow-500">> Extracting features from ID photo...<br/>> Capturing live frame...<br/>> Comparing 128-point matrices...</p>}
              {status === 'success' && <p className="text-green-500 font-bold flex items-center gap-2 mt-2"><CheckCircle size={16} /> {message}</p>}
              {status === 'error' && <p className="text-red-500 font-bold flex items-center gap-2 mt-2"><AlertTriangle size={16} /> {message}</p>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}