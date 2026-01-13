'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-6">
            Maria Resorts
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            Premium Hotel Management System
          </p>
          
          <Link href="/login">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full text-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
              Log In to Dashboard
            </button>
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-4">
              <div className="text-4xl mb-4">🏨</div>
              <h3 className="font-semibold text-gray-900 text-lg">Room Operations</h3>
              <p className="text-gray-600 mt-2">Manage availability, cleaning, and maintenance with ease</p>
            </div>
            
            <div className="text-center p-4">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="font-semibold text-gray-900 text-lg">Guest Services</h3>
              <p className="text-gray-600 mt-2">Seamless check-ins, reservations, and guest profiles</p>
            </div>
            
            <div className="text-center p-4">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-semibold text-gray-900 text-lg">Financial Reports</h3>
              <p className="text-gray-600 mt-2">Real-time revenue tracking and detailed analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
