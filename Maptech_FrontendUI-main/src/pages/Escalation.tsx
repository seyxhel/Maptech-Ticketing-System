import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { GreenButton } from '../components/ui/GreenButton';
import { ArrowUpRight, Share2, Building2, History } from 'lucide-react';
import { toast } from 'sonner';

const MOCK_ESCALATIONS = [
  { id: 1, ticketId: 'TK-8818', type: 'Escalated', to: 'Senior Engineer', reason: 'Complex network configuration required', time: '2h ago' },
  { id: 2, ticketId: 'TK-8815', type: 'Cascaded', to: 'Cisco Support (Principal)', reason: 'Hardware failure confirmed, warranty claim', time: '5h ago' },
  { id: 3, ticketId: 'TK-8802', type: 'Cascaded', to: 'Local Distributor', reason: 'Part replacement needed', time: '1d ago' },
];

export function Escalation() {
  const [escalationType, setEscalationType] = useState<'Higher' | 'Distributor' | 'Principal'>('Higher');
  const [escalationReason, setEscalationReason] = useState('');

  const handleEscalate = () => {
    if (!escalationReason) {
      toast.error('Please provide a reason for escalation');
      return;
    }
    toast.success('Ticket escalated successfully');
    setEscalationReason('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Escalation</h1>
        <p className="text-gray-500 dark:text-gray-400">Escalate or cascade tickets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-t-4 border-t-orange-500">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Escalation Module</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Ticket</label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3BC25B] outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm">
                <option>TK-8821 - System outage...</option>
                <option>TK-8820 - Printer config...</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Escalation Type</label>
              <div className="flex flex-col gap-2">
                {[
                  { key: 'Higher' as const, label: 'Escalate to Higher Position', icon: ArrowUpRight, active: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300' },
                  { key: 'Distributor' as const, label: 'Cascade to Distributor', icon: Share2, active: 'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300' },
                  { key: 'Principal' as const, label: 'Cascade to Principal', icon: Building2, active: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-[#0E8F79] dark:text-green-400' },
                ].map(({ key, label, icon: Icon, active }) => (
                  <button
                    key={key}
                    onClick={() => setEscalationType(key)}
                    className={`flex items-center px-3 py-2 rounded-lg border text-sm font-medium transition-all ${escalationType === key ? active : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason <span className="text-red-500">*</span></label>
              <textarea
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#3BC25B] outline-none resize-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Explain why this ticket needs escalation..."
              />
            </div>
            <GreenButton onClick={handleEscalate} fullWidth>Submit Escalation</GreenButton>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">Escalation History</h3>
          </div>
          <div className="space-y-4">
            {MOCK_ESCALATIONS.map((item) => (
              <div key={item.id} className={`pl-3 border-l-4 ${item.type === 'Escalated' ? 'border-orange-400' : 'border-[#0E8F79]'}`}>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{item.ticketId}</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">{item.time}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${item.type === 'Escalated' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' : 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'}`}>
                    {item.type}
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">to {item.to}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">"{item.reason}"</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
