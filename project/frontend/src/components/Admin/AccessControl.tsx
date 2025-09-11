import React from 'react';
import { User, Shield, Plus, Trash2 } from 'lucide-react';

const mockUsers = [
  { id: 1, name: 'Admin User', role: 'Admin', email: 'admin@hospital.com' },
  { id: 2, name: 'Dr. Smith', role: 'Doctor', email: 'smith@hospital.com' },
  { id: 3, name: 'Reception', role: 'Staff', email: 'reception@hospital.com' },
];

export function AccessControl() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Access Control</h2>
        <p className="text-gray-600">Manage user roles, permissions, and access levels</p>
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-red-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Shield className="h-5 w-5 text-red-600" />
            <span>User Roles & Permissions</span>
          </h3>
          <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-red-50 transition-colors">
                <td className="py-3 px-4 flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{user.name}</span>
                </td>
                <td className="py-3 px-4">{user.role}</td>
                <td className="py-3 px-4">{user.email}</td>
                <td className="py-3 px-4">
                  <button className="text-red-600 hover:text-red-800">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}