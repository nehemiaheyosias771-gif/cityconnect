import React from 'react';

export default function AdminPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-gray-900">2,847</p>
          <p className="text-sm text-green-600 mt-2">+156 this week</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Issues</h3>
          <p className="text-3xl font-bold text-yellow-600">23</p>
          <p className="text-sm text-gray-500 mt-2">Requires attention</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">System Health</h3>
          <p className="text-3xl font-bold text-green-600">98%</p>
          <p className="text-sm text-green-600 mt-2">All systems operational</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">API Calls</h3>
          <p className="text-3xl font-bold text-blue-600">45.2K</p>
          <p className="text-sm text-gray-500 mt-2">Last 24 hours</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Issues</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium text-gray-800">Water pipe burst</p>
                <p className="text-sm text-gray-500">Bole District • High Priority</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                  Assign
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium text-gray-800">Street light outage</p>
                <p className="text-sm text-gray-500">Mekane Yesus • Medium Priority</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700">
                  In Progress
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-800">Garbage collection</p>
                <p className="text-sm text-gray-500">Meskel Square • Low Priority</p>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                  Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">System Logs</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b text-sm">
              <div>
                <p className="font-medium text-gray-800">User registration spike</p>
                <p className="text-gray-500">156 new users in last hour</p>
              </div>
              <span className="text-gray-500">2 min ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b text-sm">
              <div>
                <p className="font-medium text-gray-800">Database backup completed</p>
                <p className="text-gray-500">Automatic scheduled backup</p>
              </div>
              <span className="text-gray-500">1 hour ago</span>
            </div>
            <div className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium text-gray-800">API rate limit warning</p>
                <p className="text-gray-500">IP 192.168.1.100 exceeded limits</p>
              </div>
              <span className="text-gray-500">3 hours ago</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50">
            <div className="text-2xl mb-2">📊</div>
            <p className="font-medium text-gray-800">Generate Report</p>
            <p className="text-sm text-gray-500">Export analytics data</p>
          </button>
          
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50">
            <div className="text-2xl mb-2">👥</div>
            <p className="font-medium text-gray-800">Manage Users</p>
            <p className="text-sm text-gray-500">View and edit user accounts</p>
          </button>
          
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50">
            <div className="text-2xl mb-2">⚙️</div>
            <p className="font-medium text-gray-800">System Settings</p>
            <p className="text-sm text-gray-500">Configure platform settings</p>
          </button>
        </div>
      </div>
    </div>
  );
}
