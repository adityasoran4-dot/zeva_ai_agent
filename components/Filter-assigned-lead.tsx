// // components/FilterAssignedLead.tsx
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// interface FilterProps {
//   onResults: (leads: any[]) => void;
// }

// const FilterAssignedLead: React.FC<FilterProps> = ({ onResults }) => {
//   const [name, setName] = useState('');
//   const [phone, setPhone] = useState('');
//   const [source, setSource] = useState('');
//   const [customSource, setCustomSource] = useState('');
//   const [token, setToken] = useState<string | null>(null);

//   // Get token from localStorage on mount
//   useEffect(() => {
//     const t = localStorage.getItem('agentToken');
//     if (t) setToken(t);
//     else console.error('No agent token found');
//   }, []);

//   const handleFilter = async () => {
//     if (!token) {
//       alert('Unauthorized: No token found');
//       return;
//     }

//     try {
//       const res = await axios.post(
//         '/api/agent/filter-assigned-leads',
//         { name, phone, source, customSource },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       if (res.data.success) {
//         onResults(res.data.leads);
//       }
//     } catch (err) {
//       console.error('Filter API error:', err);
//       alert('Server error while filtering leads');
//     }
//   };

//   // Optional: call handleFilter on key press for name
//   const handleNameChange = async (value: string) => {
//     setName(value);
//     await handleFilter(); // real-time filtering
//   };

//   return (
//     <div className="flex flex-wrap gap-2 mb-4 items-end">
//       <div className="flex flex-col">
//         <label>Name</label>
//         <input
//           type="text"
//           value={name}
//           onChange={(e) => handleNameChange(e.target.value)}
//           placeholder="Search by name"
//           className="border rounded px-2 py-1"
//         />
//       </div>

//       <div className="flex flex-col">
//         <label>Phone</label>
//         <input
//           type="text"
//           value={phone}
//           onChange={(e) => setPhone(e.target.value)}
//           placeholder="Search by phone"
//           className="border rounded px-2 py-1"
//         />
//       </div>

//       <div className="flex flex-col">
//         <label>Source</label>
//         <select
//           value={source}
//           onChange={(e) => setSource(e.target.value)}
//           className="border px-2 py-1"
//         >
//           <option value="">All</option>
//           <option value="Instagram">Instagram</option>
//           <option value="Facebook">Facebook</option>
//           <option value="Google">Google</option>
//           <option value="WhatsApp">WhatsApp</option>
//           <option value="Walk-in">Walk-in</option>
//           <option value="Other">Other</option>
//         </select>
//         {source === 'Other' && (
//           <input
//             type="text"
//             placeholder="Enter custom source"
//             value={customSource}
//             onChange={(e) => setCustomSource(e.target.value)}
//             className="border px-2 py-1 mt-1"
//           />
//         )}
//       </div>

//       <button
//         onClick={handleFilter}
//         className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
//       >
//         Filter
//       </button>
//     </div>
//   );
// };

// export default FilterAssignedLead;
