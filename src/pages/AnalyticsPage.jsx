import React from 'react';

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">City Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Issues</h3>
          <p className="text-3xl font-bold text-gray-900">156</p>
          <p className="text-sm text-green-600 mt-2">+12% from last month</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Resolved</h3>
          <p className="text-3xl font-bold text-green-600">142</p>
          <p className="text-sm text-gray-500 mt-2">91% resolution rate</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Active Users</h3>
          <p className="text-3xl font-bold text-blue-600">2,847</p>
          <p className="text-sm text-green-600 mt-2">+23% growth</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Response Time</h3>
          <p className="text-3xl font-bold text-purple-600">2.4h</p>
          <p className="text-sm text-green-600 mt-2">-30min improvement</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Issues by Category</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Infrastructure</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '65%'}}></div>
                </div>
                <span className="text-sm font-medium">65%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sanitation</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '20%'}}></div>
                </div>
                <span className="text-sm font-medium">20%</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Transport</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{width: '15%'}}></div>
                </div>
                <span className="text-sm font-medium">15%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium text-gray-800">New water leak reported</p>
                <p className="text-sm text-gray-500">Bole District</p>
              </div>
              <span className="text-sm text-gray-500">5 min ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium text-gray-800">Road repair completed</p>
                <p className="text-sm text-gray-500">Mekane Yesus</p>
              </div>
              <span className="text-sm text-gray-500">1 hour ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-800">Community cleanup scheduled</p>
                <p className="text-sm text-gray-500">Meskel Square</p>
              </div>
              <span className="text-sm text-gray-500">3 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
