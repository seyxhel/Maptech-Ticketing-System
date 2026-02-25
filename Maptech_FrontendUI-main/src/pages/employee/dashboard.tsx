import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployeeDashboard } from '../EmployeeDashboard';

export default function EmployeeDashboardPage() {
  const navigate = useNavigate();
  const handleNavigate = (page: string) => {
    if (page === 'ticket-view') navigate('/employee/ticket-details');
    if (page === 'knowledge-base') navigate('/employee/knowledge-base');
  };
  return <EmployeeDashboard onNavigate={handleNavigate} />;
}
