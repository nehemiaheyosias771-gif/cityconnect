import React from 'react';

export default function TransportPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Transport Information</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              🚌
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Public Transit</h3>
              <p className="text-sm text-gray-600">Real-time updates</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Bus Routes Active</span>
              <span className="font-medium">42</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Delay</span>
              <span className="font-medium text-green-600">3 min</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
              🚕
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Taxi Services</h3>
              <p className="text-sm text-gray-600">Available now</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Taxis</span>
              <span className="font-medium">156</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Wait Time</span>
              <span className="font-medium text-green-600">5 min</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
              🚴
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Bike Sharing</h3>
              <p className="text-sm text-gray-600">City bikes</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Bikes Available</span>
              <span className="font-medium">89</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Stations</span>
              <span className="font-medium">12</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Service Updates</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-800">Route 23 - Delayed</h3>
                <p className="text-sm text-gray-600">Traffic congestion on Bole Road</p>
              </div>
              <span className="text-sm text-gray-500">10 min ago</span>
            </div>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4 py-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-800">New Bike Station Open</h3>
                <p className="text-sm text-gray-600">Located at Meskel Square</p>
              </div>
              <span className="text-sm text-gray-500">1 hour ago</span>
            </div>
          </div>
          
          <div className="border-l-4 border-yellow-500 pl-4 py-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-800">Weekend Schedule Change</h3>
                <p className="text-sm text-gray-600">Reduced frequency on all routes</p>
              </div>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Transport Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">🕐 Peak Hours</h3>
            <p className="text-sm text-blue-700">Avoid 7-9 AM and 5-7 PM for faster travel</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">🎫 Smart Cards</h3>
            <p className="text-sm text-green-700">Get 20% discount with monthly passes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
