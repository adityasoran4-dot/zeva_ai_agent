import React from "react";

export default function LeadViewModal({ lead, onClose }) {
  if (!lead) return null;

  const treatmentsText = lead.treatments
    ?.map((t) => (t.subTreatment ? `${t.subTreatment} (${t.treatment?.name || "Unknown"})` : t.treatment?.name))
    .join(", ") || "—";

  const notesText = lead.notes?.map((n) => n.text).join(", ") || "—";
  const assignedText = lead.assignedTo?.map((a) => a.user?.name).join(", ") || "—";
  
  // Format follow-ups in a user-friendly way
  const formatFollowUp = (followUp) => {
    if (!followUp || !followUp.date) return null;
    const date = new Date(followUp.date);
    const now = new Date();
    const isPast = date < now;
    const isToday = date.toDateString() === now.toDateString();
    
    const dateStr = date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    return {
      dateStr,
      timeStr,
      fullDate: date,
      isPast,
      isToday,
      addedBy: followUp.addedBy?.name || followUp.addedBy || null
    };
  };
  
  const formattedFollowUps = lead.followUps?.map(formatFollowUp).filter(Boolean) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-[90vh]">
        {/* Compact Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gray-800 text-white flex items-center justify-center text-xs font-bold">
              {String(lead.name || "L").trim().slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">Lead Details</h3>
              <p className="text-[10px] sm:text-xs text-gray-500">Complete information for the selected lead</p>
            </div>
          </div>
          <button onClick={onClose} className="inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition-colors">Close</button>
        </div>

        {/* Compact Body (scrolls independently) */}
        <div className="p-3 sm:p-4 space-y-3 overflow-y-auto max-h-[65vh]">
          {/* Primary facts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-lg border border-gray-200 p-2.5 sm:p-3 bg-white">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Name</p>
              <p className="mt-1 font-medium text-gray-900 text-xs sm:text-sm">{lead.name || "—"}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-2.5 sm:p-3 bg-white">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Phone</p>
              <p className="mt-1 font-medium text-gray-900 text-xs sm:text-sm">{lead.phone || "—"}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-2.5 sm:p-3 bg-white">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Status</p>
              <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${lead.status === 'Booked' || lead.status === 'Visited' ? 'bg-green-100 text-green-700' : lead.status === 'Not Interested' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{lead.status || '—'}</span>
            </div>
          </div>

          {/* Secondary facts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-lg border border-gray-200 p-2.5 sm:p-3 bg-white">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Gender</p>
              <p className="mt-1 font-medium text-gray-900 text-xs sm:text-sm">{lead.gender || "—"}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-2.5 sm:p-3 bg-white">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Age</p>
              <p className="mt-1 font-medium text-gray-900 text-xs sm:text-sm">{lead.age || "—"}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-2.5 sm:p-3 bg-white">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Source</p>
              <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-[10px] font-medium">{lead.source || '—'}</span>
            </div>
          </div>

          {/* Treatments */}
          <div className="rounded-lg border border-gray-200 p-2.5 sm:p-3 bg-white">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Treatments</p>
            <p className="mt-1 font-medium text-gray-900 leading-relaxed text-xs sm:text-sm">{treatmentsText}</p>
          </div>

          {/* Offer and Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
            <div className="rounded-lg border border-gray-200 p-2.5 sm:p-3 bg-white">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Offer Tag</p>
              <p className="mt-1 font-medium text-gray-900 text-xs sm:text-sm">{lead.offerTag || "—"}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-2.5 sm:p-3 bg-white">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Assigned To</p>
              <p className="mt-1 font-medium text-gray-900 text-xs sm:text-sm">{assignedText}</p>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-lg border border-gray-200 p-2.5 sm:p-3 bg-white">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Notes</p>
            <p className="mt-1 font-medium text-gray-900 leading-relaxed text-xs sm:text-sm">{notesText}</p>
          </div>

          {/* Follow ups */}
          <div className="rounded-lg border border-gray-200 p-2.5 sm:p-3 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Follow-ups</p>
              {formattedFollowUps.length > 0 && (
                <span className="ml-auto text-[10px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                  {formattedFollowUps.length} {formattedFollowUps.length === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
            {formattedFollowUps.length > 0 ? (
              <div className="space-y-2.5 mt-3">
                {formattedFollowUps.map((followUp, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all ${
                      followUp.isPast && !followUp.isToday
                        ? 'bg-gray-50 border-gray-200'
                        : followUp.isToday
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className={`flex-shrink-0 mt-0.5 ${
                      followUp.isPast && !followUp.isToday
                        ? 'text-gray-400'
                        : followUp.isToday
                        ? 'text-blue-600'
                        : 'text-green-600'
                    }`}>
                      {followUp.isPast && !followUp.isToday ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-semibold text-xs sm:text-sm ${
                          followUp.isPast && !followUp.isToday
                            ? 'text-gray-600'
                            : followUp.isToday
                            ? 'text-blue-900'
                            : 'text-green-900'
                        }`}>
                          {followUp.dateStr}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          followUp.isPast && !followUp.isToday
                            ? 'bg-gray-200 text-gray-700'
                            : followUp.isToday
                            ? 'bg-blue-200 text-blue-800'
                            : 'bg-green-200 text-green-800'
                        }`}>
                          {followUp.isPast && !followUp.isToday
                            ? 'Past'
                            : followUp.isToday
                            ? 'Today'
                            : 'Upcoming'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-gray-600 font-medium">{followUp.timeStr}</p>
                        {followUp.addedBy && (
                          <>
                            <span className="text-gray-300">•</span>
                            <p className="text-[10px] text-gray-500">Added by {followUp.addedBy}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2 py-3 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs font-medium">No follow-ups scheduled</p>
              </div>
            )}
          </div>
        </div>

        {/* Compact Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-white flex justify-end">
          <button onClick={onClose} className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}


