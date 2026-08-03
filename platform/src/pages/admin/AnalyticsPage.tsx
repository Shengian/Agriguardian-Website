import { DashboardLayout, adminLinks } from '../../layouts/DashboardLayout';
import { GlassCard } from '../../components/UI';
import { dashboardApi } from '../../api/client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const [data, setData] = useState<{ taskCompletion: { status: string; count: number }[]; deptDistribution: { department: string; count: number }[] } | null>(null);
  useEffect(() => { dashboardApi.admin().then(d => setData({ taskCompletion: d.taskCompletion, deptDistribution: d.deptDistribution })); }, []);

  return (
    <DashboardLayout title="Performance Analytics" links={adminLinks}>
      <div className="charts-grid">
        <GlassCard className="chart-card">
          <h3>Task Completion</h3>
          {data && <ResponsiveContainer width="100%" height={250}><BarChart data={data.taskCompletion}><XAxis dataKey="status" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#2E7D32" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer>}
        </GlassCard>
        <GlassCard className="chart-card">
          <h3>Department Distribution</h3>
          {data && <ResponsiveContainer width="100%" height={250}><BarChart data={data.deptDistribution}><XAxis dataKey="department" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#C9A227" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer>}
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
