import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { GreenButton } from '../components/ui/GreenButton';
import {
  Search,
  Plus,
  Edit2,
  Lock,
  Unlock,
  X,
  Eye,
  EyeOff,
  Users } from
'lucide-react';
import { toast } from 'sonner';
interface UserAccount {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Employee' | 'Client';
  status: 'Active' | 'Blocked';
}
const INITIAL_USERS: UserAccount[] = [
{
  id: 1,
  name: 'Alex Reyes',
  email: 'alex.reyes@maptech.com',
  role: 'Admin',
  status: 'Active'
},
{
  id: 2,
  name: 'Sarah Engineer',
  email: 'sarah.e@maptech.com',
  role: 'Employee',
  status: 'Active'
},
{
  id: 3,
  name: 'John Doe',
  email: 'john@clientcorp.com',
  role: 'Client',
  status: 'Active'
},
{
  id: 4,
  name: 'Mike Ross',
  email: 'mike.r@maptech.com',
  role: 'Employee',
  status: 'Blocked'
},
{
  id: 5,
  name: 'Jenny Lee',
  email: 'jenny.l@maptech.com',
  role: 'Employee',
  status: 'Active'
},
{
  id: 6,
  name: 'David Kim',
  email: 'david.k@maptech.com',
  role: 'Admin',
  status: 'Active'
},
{
  id: 7,
  name: 'Emily Chen',
  email: 'emily@betasystems.com',
  role: 'Client',
  status: 'Active'
},
{
  id: 8,
  name: 'Robert Wilson',
  email: 'robert.w@maptech.com',
  role: 'Employee',
  status: 'Active'
},
{
  id: 9,
  name: 'Maria Santos',
  email: 'maria.s@maptech.com',
  role: 'Admin',
  status: 'Active'
},
{
  id: 10,
  name: 'Carlos Tan',
  email: 'carlos@alphacorp.com',
  role: 'Client',
  status: 'Blocked'
}];

const EMPTY_FORM = {
  name: '',
  email: '',
  role: 'Employee' as 'Admin' | 'Employee',
  password: '',
  status: 'Active' as 'Active' | 'Blocked'
};
export function UserManagement() {
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [roleFilter, setRoleFilter] = useState<
    'All' | 'Admin' | 'Employee' | 'Client'>(
    'All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesSearch =
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });
  const openAddModal = () => {
    setEditingUser(null);
    setFormData(EMPTY_FORM);
    setShowPassword(false);
    setIsModalOpen(true);
  };
  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role === 'Client' ? 'Employee' : user.role,
      password: '',
      status: user.status
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      setUsers((prev) =>
      prev.map((u) =>
      u.id === editingUser.id ?
      {
        ...u,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status
      } :
      u
      )
      );
      toast.success(`Account for ${formData.name} updated successfully.`);
    } else {
      setUsers((prev) => [
      {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status
      },
      ...prev]
      );
      toast.success(
        `New ${formData.role} account created for ${formData.name}.`
      );
    }
    setIsModalOpen(false);
  };
  const toggleStatus = (id: number) => {
    setUsers((prev) =>
    prev.map((u) => {
      if (u.id === id) {
        const next = u.status === 'Active' ? 'Blocked' : 'Active';
        toast.info(
          `${u.name} has been ${next === 'Blocked' ? 'blocked' : 'activated'}.`
        );
        return {
          ...u,
          status: next
        };
      }
      return u;
    })
    );
  };
  const roleBadge = (role: string) => {
    if (role === 'Admin')
    return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700';
    if (role === 'Employee')
    return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
    return 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600';
  };
  const roleCounts = {
    All: users.length,
    Admin: users.filter((u) => u.role === 'Admin').length,
    Employee: users.filter((u) => u.role === 'Employee').length,
    Client: users.filter((u) => u.role === 'Client').length
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Add, edit, and manage all system accounts
          </p>
        </div>
        <GreenButton
          onClick={openAddModal}
          className="flex items-center gap-2 self-start md:self-auto">

          <Plus className="w-4 h-4" />
          Add Account
        </GreenButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
        {
          label: 'Total Users',
          count: users.length,
          cls: 'bg-gray-900 dark:bg-gray-700 text-white'
        },
        {
          label: 'Admins',
          count: roleCounts.Admin,
          cls: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
        },
        {
          label: 'Employees',
          count: roleCounts.Employee,
          cls: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
        },
        {
          label: 'Clients',
          count: roleCounts.Client,
          cls: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
        }].
        map((item) =>
        <div key={item.label} className={`rounded-xl p-4 ${item.cls}`}>
            <p className="text-2xl font-bold">{item.count}</p>
            <p className="text-sm mt-1 opacity-80">{item.label}</p>
          </div>
        )}
      </div>

      <Card accent>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg gap-1">
            {(['All', 'Admin', 'Employee', 'Client'] as const).map((tab) =>
            <button
              key={tab}
              onClick={() => setRoleFilter(tab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${roleFilter === tab ? 'bg-white dark:bg-gray-600 text-[#0E8F79] dark:text-green-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>

                {tab}
                <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${roleFilter === tab ? 'bg-[#ecfdf5] dark:bg-green-900/40 text-[#0E8F79] dark:text-green-400' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'}`}>

                  {roleCounts[tab]}
                </span>
              </button>
            )}
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3BC25B]" />

          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold">Full Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredUsers.length === 0 ?
              <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                      <Users className="w-8 h-8" />
                      <p className="font-medium">No users found</p>
                    </div>
                  </td>
                </tr> :

              filteredUsers.map((user) =>
              <tr
                key={user.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#63D44A] to-[#0E8F79] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {user.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleBadge(user.role)}`}>

                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.status === 'Active' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'}`}>

                        <span
                      className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />

                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {user.role !== 'Client' &&
                    <button
                      onClick={() => openEditModal(user)}
                      title="Edit account"
                      className="p-2 text-gray-400 hover:text-[#0E8F79] dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors">

                            <Edit2 className="w-4 h-4" />
                          </button>
                    }
                        <button
                      onClick={() => toggleStatus(user.id)}
                      title={
                      user.status === 'Active' ?
                      'Block account' :
                      'Activate account'
                      }
                      className={`p-2 rounded-lg transition-colors ${user.status === 'Active' ? 'text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-red-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'}`}>

                          {user.status === 'Active' ?
                      <Lock className="w-4 h-4" /> :

                      <Unlock className="w-4 h-4" />
                      }
                        </button>
                      </div>
                    </td>
                  </tr>
              )
              }
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredUsers.length} of {users.length} accounts
          </span>
        </div>
      </Card>

      {isModalOpen &&
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingUser ? 'Edit Account' : 'Add New Account'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {editingUser ?
                `Editing: ${editingUser.name}` :
                'Create a new Admin or Employee account'}
                </p>
              </div>
              <button
              onClick={() => setIsModalOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">

                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {[
            {
              label: 'Full Name',
              type: 'text',
              key: 'name',
              placeholder: 'e.g. Maria Santos',
              required: true
            },
            {
              label: 'Email Address',
              type: 'email',
              key: 'email',
              placeholder: 'user@maptech.com',
              required: true
            }].
            map((field) =>
            <div key={field.key}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {field.label}
                  </label>
                  <input
                type={field.type}
                required={field.required}
                value={(formData as any)[field.key]}
                onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  [field.key]: e.target.value
                }))
                }
                placeholder={field.placeholder}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#3BC25B] focus:border-transparent outline-none" />

                </div>
            )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Role
                  </label>
                  <select
                  value={formData.role}
                  onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    role: e.target.value as 'Admin' | 'Employee'
                  }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#3BC25B] outline-none">

                    <option value="Admin">Admin</option>
                    <option value="Employee">Employee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Status
                  </label>
                  <div className="flex items-center gap-3 h-[42px]">
                    <button
                    type="button"
                    onClick={() =>
                    setFormData((p) => ({
                      ...p,
                      status: p.status === 'Active' ? 'Blocked' : 'Active'
                    }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3BC25B] ${formData.status === 'Active' ? 'bg-[#3BC25B]' : 'bg-gray-300 dark:bg-gray-600'}`}>

                      <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${formData.status === 'Active' ? 'translate-x-6' : 'translate-x-1'}`} />

                    </button>
                    <span
                    className={`text-sm font-medium ${formData.status === 'Active' ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>

                      {formData.status}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {editingUser ?
                'New Password (leave blank to keep)' :
                'Temporary Password'}
                </label>
                <div className="relative">
                  <input
                  type={showPassword ? 'text' : 'password'}
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    password: e.target.value
                  }))
                  }
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-11 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#3BC25B] outline-none" />

                  <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">

                    {showPassword ?
                  <EyeOff className="w-4 h-4" /> :

                  <Eye className="w-4 h-4" />
                  }
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">

                  Cancel
                </button>
                <GreenButton type="submit" className="flex-1">
                  {editingUser ? 'Save Changes' : 'Create Account'}
                </GreenButton>
              </div>
            </form>
          </div>
        </div>
      }
    </div>);

}