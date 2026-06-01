"use client";
import React from 'react';
import { BarChart3, TrendingUp, Users, Box, Home, Briefcase, Layers, CheckCircle, Info, Package, CreditCard, Calendar, User, DollarSign } from 'lucide-react';

const ReportsAnalyticsWorkflowGuide: React.FC = () => {
  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="w-full bg-gradient-to-r from-teal-600 to-blue-600 py-8 px-6 sm:px-8 lg:px-12 text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Reports & Analytics Guide</h1>
          <p className="text-teal-100 text-sm mt-2 opacity-90">Analyze clinic performance with comprehensive reports and data-driven insights across all operations.</p>
        </div>
      </div>

      {/* UI Preview Section - Reports Dashboard */}
      <div className="w-full border-b border-gray-200 px-6 sm:px-8 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-600" />
            Analytics Dashboard Interface
          </h2>

          <div className="w-full bg-teal-50 rounded-xl border border-teal-200 p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Reports & Analytics Screen
            </h3>
            <div className="bg-white rounded-lg border-2 border-teal-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm" style={{ minHeight: '500px', maxHeight: '600px' }}>
              <img 
                src="/reports.png" 
                alt="Reports and Analytics Screen" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.querySelector('.placeholder-reports')?.classList.remove('hidden');
                }}
              />
              <div className="placeholder-reports hidden text-center p-8">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-teal-600" />
                </div>
                <p className="text-gray-600 font-medium">Image not found: /reports-analytics-screen.png</p>
                <p className="text-gray-400 text-sm mt-2">Please ensure reports-analytics-screen.png is in the public folder.</p>
              </div>
            </div>
          </div>

          {/* Detailed Explanation Section */}
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Info className="w-6 h-6 text-teal-600" />
              Reports & Analytics Features Breakdown
            </h2>

            {/* Overview */}
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-6 border border-teal-200">
              <h4 className="font-bold text-teal-800 mb-3 flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5" />
                Comprehensive Analytics Overview
              </h4>
              <p className="text-gray-700 leading-relaxed">
                The Reports & Analytics module provides powerful data visualization and insights across all clinic operations. 
                Analyze performance through interactive graphs, charts, and detailed metrics spanning departments, packages, 
                memberships, appointments, patients, leads, staff, revenue, rooms, and inventory. Make data-driven decisions 
                with real-time analytics and customizable date ranges.
              </p>
            </div>

            {/* Report Categories */}
            <div className="space-y-6">
              
              {/* 1. Department Report */}
              <div className="bg-white rounded-xl p-6 border-l-4 border-teal-500 shadow-sm">
                <h4 className="font-bold text-teal-800 mb-4 flex items-center gap-2 text-lg">
                  <Home className="w-5 h-5" />
                  1. Department Report
                </h4>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Comprehensive department-level analytics with interactive visualizations and advanced filtering capabilities.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-teal-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Department Performance:</strong> Visualize total revenue, booking counts, and average prices by department (Dermatology, Dental, Orthopedics, etc.) through bar charts and summary cards.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-teal-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Top Appointments by Department:</strong> View appointment volume distribution across departments with comparative bar graphs showing which departments handle the most patient visits.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-teal-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Top Performing Departments:</strong> Identify highest revenue-generating departments with ranked listings and percentage contribution to total clinic revenue.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-teal-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Top 5 Services by Revenue:</strong> Drill down into each department to see the top 5 services ranked by revenue generation, with clickable department selection for detailed service breakdowns.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-teal-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Service Performance:</strong> Analyze individual service metrics including total bookings, average price per service, and revenue trends with sortable tables (by revenue or bookings).
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Interactive Graphs & Filtering:</strong> All metrics are visualized through responsive bar charts and pie charts. Apply filters by date range (custom from/to dates), select specific departments to view their service performance, and export data as PDF, Excel, or CSV for offline analysis.
                    </div>
                  </li>
                </ul>
              </div>

              {/* 2. Package Report */}
              <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm">
                <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5" />
                  2. Package Report
                </h4>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Detailed package performance analytics with sales tracking, utilization metrics, and graphical insights.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Top Packages (Revenue):</strong> View the top 10 highest revenue-generating packages with bar chart visualization showing revenue, total bookings, and appointment counts side-by-side for easy comparison.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Appointments by Package:</strong> Track appointment volumes associated with each package to understand patient engagement and package utilization patterns through graphical representations.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Package Performance:</strong> Comprehensive metrics including total revenue per package, number of bookings, appointment completion rates, and session utilization percentages displayed in interactive charts.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Package Reports - Track Packages Sold:</strong> Detailed transaction log showing all packages sold with pagination (20 records per page), patient information, purchase dates, and package details. Click on any patient to view their complete package usage history and remaining sessions.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Graphical Format & Advanced Filtering:</strong> All package metrics are presented in responsive bar charts with hover tooltips showing exact values. Filter by custom date ranges to analyze package performance during specific periods (monthly, quarterly, yearly). Export reports as PDF, Excel, or CSV. Drill down into individual patient package usage to track session consumption and expiry dates.
                    </div>
                  </li>
                </ul>
              </div>

              {/* 3. Membership Report */}
              <div className="bg-white rounded-xl p-6 border-l-4 border-purple-500 shadow-sm">
                <h4 className="font-bold text-purple-800 mb-4 flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5" />
                  3. Membership Report
                </h4>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Comprehensive membership analytics tracking revenue, appointments, and member engagement metrics.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Appointments by Membership:</strong> Visualize appointment distribution across different membership tiers (Silver, Gold, Platinum) through bar charts showing booking volumes per membership type.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Top Memberships by Revenue:</strong> Identify highest revenue-generating membership plans with ranked listings and comparative bar graphs displaying total income contribution from each tier.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-purple-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Membership Reports:</strong> Detailed breakdown of active vs. expired memberships, renewal rates, discount utilization, and member retention statistics presented in interactive tables and charts.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Graphical Visualization & Filtering:</strong> All membership metrics displayed in responsive bar charts and pie charts with hover tooltips. Filter by date range to analyze membership performance during specific periods. Export data as PDF, Excel, or CSV for reporting purposes.
                    </div>
                  </li>
                </ul>
              </div>

              {/* 4. Appointment Report */}
              <div className="bg-white rounded-xl p-6 border-l-4 border-orange-500 shadow-sm">
                <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5" />
                  4. Appointment Report
                </h4>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Detailed appointment analytics covering doctor performance, booking status, and department-wise distribution.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-orange-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Top Doctors by Bookings:</strong> Ranked list of doctors with highest appointment volumes displayed in bar charts showing individual booking counts and comparative performance metrics.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-orange-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Bookings by Status:</strong> Visualize appointment status distribution (Confirmed, Completed, Cancelled, No-Show) through pie charts and percentage breakdowns for operational insights.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-orange-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Top Departments by Appointments:</strong> Department-wise appointment volume comparison with bar graphs highlighting busiest departments and capacity utilization rates.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-orange-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Appointment Summary:</strong> Comprehensive overview including total bookings, completion rates, cancellation percentages, and average daily/weekly appointment trends.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-orange-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Doctor Appointment Report:</strong> Individual doctor performance metrics including appointment counts, patient feedback scores, revenue generated, and availability analysis.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Interactive Charts & Filters:</strong> All appointment data visualized through responsive bar charts, pie charts, and line graphs. Apply filters by date range, doctor selection, department, or appointment status. Export reports for offline analysis.
                    </div>
                  </li>
                </ul>
              </div>

              {/* 5. Patient Report */}
              <div className="bg-white rounded-xl p-6 border-l-4 border-green-500 shadow-sm">
                <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2 text-lg">
                  <User className="w-5 h-5" />
                  5. Patient Report
                </h4>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Patient-centric analytics tracking visit frequency, revenue contribution, and membership purchases.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Most Visited Patients:</strong> Identify patients with highest clinic visit frequency through ranked lists and bar charts showing appointment counts per patient.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Top Membership Purchases:</strong> Track which patients have purchased the most memberships with details on membership types, purchase dates, and total spending.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Patient Summary:</strong> Comprehensive patient overview including demographics, total visits, lifetime value, outstanding balances, and treatment history in summary cards.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Highest Pending Amount:</strong> Identify patients with largest outstanding balances for follow-up and collection efforts with sortable tables by pending amount.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Top Patients by Revenue:</strong> Ranked list of highest revenue-generating patients with total spending, visit frequency, and average transaction value displayed in bar charts.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Visual Analytics & Filtering:</strong> All patient metrics shown in interactive bar charts and summary tables. Filter by date range, revenue thresholds, or visit frequency. Export patient lists as Excel or CSV for CRM integration.
                    </div>
                  </li>
                </ul>
              </div>

              {/* 6. Lead Report */}
              <div className="bg-white rounded-xl p-6 border-l-4 border-yellow-500 shadow-sm">
                <h4 className="font-bold text-yellow-800 mb-4 flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5" />
                  6. Lead Report
                </h4>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Lead conversion analytics tracking sources, owner performance, and treatment preferences.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Conversion by Owner:</strong> Track lead conversion rates per sales team member or agent with bar charts showing successful conversions vs. total leads assigned.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Gender Conversion Ratio:</strong> Analyze conversion rates by patient gender through comparative bar graphs showing male vs. female lead-to-patient conversion percentages.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Top Treatments Converting Leads:</strong> Identify which treatments or services have highest lead conversion rates with ranked listings and conversion percentage metrics.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Top Sources Converting Leads:</strong> Determine most effective lead generation channels (website, social media, referrals, campaigns) with pie charts showing source distribution and conversion success rates.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Lead Status Distribution:</strong> Visual breakdown of leads by status (New, Contacted, Qualified, Converted, Lost) with percentage distributions and trend analysis over time.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Graphical Insights & Filters:</strong> All lead metrics displayed in interactive bar charts, pie charts, and funnel visualizations. Filter by date range, lead owner, source, or status. Export conversion reports for sales team performance reviews.
                    </div>
                  </li>
                </ul>
              </div>

              {/* 7. Doctor & Staff Report */}
              <div className="bg-white rounded-xl p-6 border-l-4 border-indigo-500 shadow-sm">
                <h4 className="font-bold text-indigo-800 mb-4 flex items-center gap-2 text-lg">
                  <Briefcase className="w-5 h-5" />
                  7. Doctor & Staff Report
                </h4>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Comprehensive staff performance analytics covering bookings, revenue, commissions, and patient treatment metrics.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Doctor Staff by Bookings:</strong> Ranked list of doctors and staff by appointment volume with bar charts showing individual booking counts and comparative performance.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Top 5 Doctor Staff Revenue:</strong> Identify top 5 revenue-generating doctors with detailed breakdowns of total income, average per appointment, and revenue trends over time.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Highest Billing in Packages:</strong> Track which doctors generate the most revenue through package sales with ranked listings and total package billing amounts.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Highest Billing in Memberships:</strong> Identify doctors with highest membership plan sales and associated revenue contributions through comparative bar graphs.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Top Doctor Staff Details:</strong> Comprehensive profiles of top-performing staff including specialization, total patients treated, satisfaction ratings, and availability schedules.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Total Patients Treated (Top 5):</strong> Ranked list of doctors who have treated the most unique patients with patient count metrics and treatment diversity analysis.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Top 5 Doctor Staff Commission:</strong> Calculate and display commission earnings for top 5 doctors based on revenue targets and treatment performance with detailed commission breakdowns.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-indigo-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Top 5 Agents Commission:</strong> Track commission earnings for top 5 sales agents or referral partners with conversion-based commission calculations and payment status.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Performance Dashboards & Filters:</strong> All staff metrics visualized through responsive bar charts, ranking tables, and commission summaries. Filter by date range, department, or staff role. Export performance reports for HR reviews and commission processing.
                    </div>
                  </li>
                </ul>
              </div>

              {/* 8. Revenue Report */}
              <div className="bg-white rounded-xl p-6 border-l-4 border-red-500 shadow-sm">
                <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2 text-lg">
                  <DollarSign className="w-5 h-5" />
                  8. Revenue Report
                </h4>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Comprehensive financial analytics tracking revenue streams, payment methods, and outstanding balances.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Revenue Summary:</strong> High-level overview of total clinic revenue with breakdown by service categories, time periods, and growth trends displayed in summary cards and trend lines.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Top 5 Patients by Pending/Advance:</strong> Identify patients with highest outstanding balances or advance payments through ranked tables showing pending amounts and payment history.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Revenue by Doctor:</strong> Individual doctor revenue contribution with bar charts comparing earnings across medical staff and commission calculations.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Revenue by Service:</strong> Analyze which treatments and services generate the most income with ranked listings and percentage contribution to total revenue.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Revenue by Department:</strong> Department-wise revenue distribution with comparative bar graphs showing income contribution from each clinical department.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Revenue by Payment Method:</strong> Breakdown of revenue by payment type (Cash, Card, Insurance, Digital Wallet) with pie charts showing payment preference distributions.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Revenue Trend:</strong> Time-series analysis showing revenue patterns over days, weeks, months with line graphs highlighting growth trends and seasonal variations.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Pending Payment Report:</strong> Detailed list of outstanding invoices with patient details, due dates, aging analysis, and collection priority rankings.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Payment Reports:</strong> Complete transaction history showing all payments received, payment methods used, and reconciliation status with exportable records.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Financial Dashboards & Filtering:</strong> All revenue metrics displayed in interactive bar charts, line graphs, pie charts, and summary tables. Filter by date range, doctor, department, payment method, or service type. Export financial reports as PDF, Excel, or CSV for accounting and audit purposes.
                    </div>
                  </li>
                </ul>
              </div>

              {/* 9. Rooms & Resources Report */}
              <div className="bg-white rounded-xl p-6 border-l-4 border-cyan-500 shadow-sm">
                <h4 className="font-bold text-cyan-800 mb-4 flex items-center gap-2 text-lg">
                  <Home className="w-5 h-5" />
                  9. Rooms & Resources Report
                </h4>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Room utilization analytics tracking occupancy rates, revenue generation, and booking patterns.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-cyan-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Highest Revenue by Room:</strong> Identify which treatment rooms generate the most income with ranked bar charts showing revenue per room and utilization efficiency.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-cyan-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Room Bookings:</strong> Track appointment bookings assigned to each room with occupancy calendars, booking frequency, and peak usage time analysis through graphical timelines.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-cyan-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Utilization Charts & Filters:</strong> Room metrics visualized through bar charts, occupancy heatmaps, and booking timelines. Filter by date range, room type, or department. Export room utilization reports for capacity planning and resource optimization.
                    </div>
                  </li>
                </ul>
              </div>

              {/* 10. Stock & Inventory Report */}
              <div className="bg-white rounded-xl p-6 border-l-4 border-pink-500 shadow-sm">
                <h4 className="font-bold text-pink-800 mb-4 flex items-center gap-2 text-lg">
                  <Box className="w-5 h-5" />
                  10. Stock & Inventory Report
                </h4>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Comprehensive inventory management analytics tracking stock levels, purchases, and consumption patterns.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-pink-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Top 10 Items by Quantity (Line Graph):</strong> Visualize the most stocked or consumed items through interactive line graphs showing quantity trends over time with peak usage identification.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-pink-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Status Overview:</strong> Real-time inventory status dashboard showing total items, low stock alerts, out-of-stock items, and items approaching expiry through color-coded status indicators.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-pink-600 font-bold text-xl">•</span>
                    <div>
                      <strong>UOM Growth Timeline:</strong> Track unit of measurement (UOM) consumption patterns over time with timeline graphs showing usage trends and reorder point analysis.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-pink-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Detailed Inventory Report:</strong> Complete inventory listing with current stock levels, reorder quantities, supplier information, unit costs, and total inventory valuation in sortable tables.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-pink-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Stock Location Analysis:</strong> Multi-location inventory tracking showing stock distribution across different warehouses or storage areas with location-wise quantity breakdowns.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-pink-600 font-bold text-xl">•</span>
                    <div>
                      <strong>GRN Analysis (Goods Received Note):</strong> Track all incoming stock deliveries with GRN details including supplier names, received quantities, inspection status, and receiving dates in chronological logs.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-pink-600 font-bold text-xl">•</span>
                    <div>
                      <strong>Purchase Invoice Analysis:</strong> Analyze purchase invoices with cost breakdowns, payment status, supplier performance metrics, and spending trends through bar charts and summary reports.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Inventory Dashboards & Filters:</strong> All stock metrics displayed in interactive line graphs, bar charts, status dashboards, and detailed tables. Filter by date range, item category, stock location, supplier, or UOM type. Export inventory reports as PDF, Excel, or CSV for procurement planning and audit compliance.
                    </div>
                  </li>
                </ul>
              </div>

            </div>

            {/* Additional Features Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200 mt-8">
              <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2 text-lg">
                <Layers className="w-5 h-5" />
                Additional Analytics Features
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Interactive Graphs:</strong> Click on chart elements to drill down into specific data points</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Date Range Customization:</strong> Flexible from/to date selectors for any time period analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Export Capabilities:</strong> Download reports as PDF, Excel, or CSV for offline analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Real-time Updates:</strong> Live data refresh ensures you're always viewing current metrics</span>
                  </li>
                </ul>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Tabbed Navigation:</strong> Easy switching between report categories without page reload</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Visual Insights:</strong> Color-coded indicators highlight trends, anomalies, and KPIs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Comparative Views:</strong> Side-by-side period comparisons (month-over-month, year-over-year)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Customizable Dashboards:</strong> Pin favorite reports for quick access and personalized views</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalyticsWorkflowGuide;
