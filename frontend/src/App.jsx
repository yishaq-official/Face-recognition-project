import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('localhost:5000');

function App() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    socket.on('new_attendance', (data) => {
      // Add new record to the top of the list
      setLogs((prevLogs) => [
        { ...data, timestamp: new Date().toLocaleTimeString() },
        ...prevLogs.slice(0, 9), // Keep last 10 entries
      ]);
    });

    return () => socket.off('new_attendance');
  }, []);

  return (
    <div className="min-h-screen bg-black text-green-500 p-8 font-mono">
      <header className="flex justify-between border-b border-green-900 pb-4 mb-8">
        <h1 className="text-2xl font-bold tracking-widest">SYSTEM_FACE_RECOG_v2.0</h1>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs">LIVE_FEED</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Feed Section */}
        <div className="lg:col-span-2">
          <div className="border border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] rounded-lg overflow-hidden bg-zinc-900">
            <img 
              src="http://localhost:5000/video_feed" 
              alt="Feed" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Attendance Sidebar */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold border-l-4 border-green-500 pl-3">RECENT_LOGS</h2>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-zinc-600 italic">Waiting for detection...</p>
            ) : (
              logs.map((log, index) => (
                <div 
                  key={index} 
                  className="bg-zinc-900 border border-green-900 p-4 rounded flex justify-between items-center animate-in fade-in slide-in-from-right-4 duration-500"
                >
                  <div>
                    <p className="text-white font-bold">{log.name}</p>
                    <p className="text-[10px] text-green-600 uppercase">{log.status}</p>
                  </div>
                  <span className="text-xs text-zinc-500">{log.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;