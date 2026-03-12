import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployeeDashboard } from './EmployeeDashboard';

export default function EmployeeDashboardPage() {
  const navigate = useNavigate();
  const handleNavigate = (page: string) => {
    if (page === 'knowledge-hub') navigate('/employee/knowledge-hub');
  };
  return <EmployeeDashboard onNavigate={handleNavigate} />;
}
