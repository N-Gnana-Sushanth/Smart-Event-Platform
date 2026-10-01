import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatusBadge } from '../../components/common/Badge';
import { Users2, Award } from 'lucide-react';

export function TeamsList() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/events')
      .then(data => {
        const list = (data.events || []).filter(e => e.isTeamEvent);
        setEvents(list);
        if (list.length > 0) setSelectedEventId(list[0].id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      setLoading(true);
      api.get(`/events/${selectedEventId}`)
        .then(data => setEventData(data.event))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedEventId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Teams Directory</h1>
        <p className="text-xs text-slate-500 mt-1">Manage team registrations and multi-member rosters.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm max-w-sm">
        <select
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white outline-none"
        >
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.title}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {eventData?.teams?.map(team => (
          <div key={team.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">{team.teamName}</h3>
              </div>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {team.teamCode}
              </span>
            </div>

            <div className="text-xs text-slate-500">
              Registered for: <span className="font-semibold text-slate-700">{eventData.title}</span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <StatusBadge status={team.status} />
              {team.awardPosition && (
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  {team.awardPosition === 1 ? '1st Place' : team.awardPosition === 2 ? '2nd Place' : '3rd Place'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
