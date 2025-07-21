import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Button from '../../components/button/Button';
import "./PerformanceReport.css";

const PerformanceReport = () => {
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [monthFilter, setMonthFilter] = useState("");
    const [managerFilter, setManagerFilter] = useState("");
    const [recruiterFilter, setRecruiterFilter] = useState("");
    const [customerFilter, setCustomerFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const token = localStorage.getItem("authToken");
    const companyId = localStorage.getItem("companyId");
    const employeeId = localStorage.getItem("employeeId");
    const designation = localStorage.getItem("designation");
    const employeeName = localStorage.getItem("employeeName");

    useEffect(() => {
        if (companyId) loadInitialData();
    }, [companyId]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}AMFocusOn/AMFocuOnContent`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { companyId, employeeId, designation, employeeName },
                }
            );
            setFilteredData(response.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString('en-GB').replaceAll('/', '-');
    };

    const clearFilters = () => {
        setMonthFilter("");
        setManagerFilter("");
        setRecruiterFilter("");
        setCustomerFilter("");
        setStartDate("");
        setEndDate("");
    };

    const filteredTableData = useMemo(() => {
        return filteredData.filter((item) => {
            const reqDate = item.req_date ? new Date(item.req_date) : null;
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            const itemMonth = reqDate
                ? reqDate.toLocaleString("default", { month: "long" }).toLowerCase()
                : "";

            const inDateRange = (!reqDate || (!start && !end)) || (
                (!start || reqDate >= start) && (!end || reqDate <= end)
            );

            return (
                (monthFilter === "" || itemMonth.includes(monthFilter.toLowerCase())) &&
                (managerFilter === "" || item.account_manager?.toLowerCase().includes(managerFilter.toLowerCase())) &&
                (recruiterFilter === "" || item.recruiter?.toLowerCase().includes(recruiterFilter.toLowerCase())) &&
                (customerFilter === "" || item.customer?.toLowerCase().includes(customerFilter.toLowerCase())) &&
                inDateRange
            );
        });
    }, [filteredData, monthFilter, managerFilter, recruiterFilter, customerFilter, startDate, endDate]);


    return (
        <div className="tracker-table-wrapper">
            <h2 className="heading">Performance Report</h2>

            <div className="filter-container">
                <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="filter-select">
                    <option value="">All Months</option>
                    {["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"]
                        .map(month => (
                            <option key={month} value={month}>{month}</option>
                        ))}
                </select>

                <input
                    type="text"
                    placeholder="Filter by Account Manager"
                    value={managerFilter}
                    onChange={(e) => setManagerFilter(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Filter by Recruiter"
                    value={recruiterFilter}
                    onChange={(e) => setRecruiterFilter(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Filter by Customer"
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                />
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
                <Button text="Clear Filters" onClick={clearFilters} > Clear Filters</Button>
            </div>

            <table className="tracker-table">
                <thead>
                    <tr>
                        <th colSpan="6" className="section-header">Requirement Tracker</th>
                        <th colSpan="2" className="section-header section-candidate">Candidate Tracker</th>
                        <th colSpan="9" className="section-header section-interview">Interview Tracker</th>
                    </tr>
                    <tr>
                        <th className="col-year">Year</th>
                        <th className="col-month">Month</th>
                        <th className="col-date-initiated">Director</th>
                        <th className="col-account-manager">Account Manager</th>
                        <th className="col-recruiter">Recruiter</th>
                        <th className="col-customer">Customer</th>
                        <th className="col-date">Date</th>
                        <th className="col-total-profiles">Total Profiles Submitted</th>
                        <th className="col-screen-select">Screen Select</th>
                        <th className="col-screen-reject">Screen Reject</th>
                        <th className="col-interview-reject">Interview Rejected</th>
                        <th className="col-interview-select">Interview Selected</th>
                        <th className="col-shortlisted">Shortlisted</th>
                        <th className="col-onboard-failure">Onboard Failure</th>
                        <th className="col-onboarded-success">Onboarded Successfully</th>
                        <th className="col-offer-rolledout">Offer RolledOut</th>
                        <th className="col-offer-rolledout-accepted">Offer Accepted</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="18">Loading...</td></tr>
                    ) : filteredTableData.length === 0 ? (
                        <tr><td colSpan="18">No data available</td></tr>
                    ) : (
                        filteredTableData.map((item, index) => (
                            <tr key={index}>
                                <td>{item.year}</td>
                                <td>{item.month}</td>
                                <td> </td> {/* Director placeholder */}
                                <td>{item.account_manager}</td>
                                <td>{item.recruiter}</td>
                                <td>{item.customer}</td>
                                <td>{formatDate(item.req_date)}</td>
                                <td>{item.total_candidates}</td>
                                <td>{item.screen_selected}</td>
                                <td>{item.screen_rejected}</td>
                                <td>{item.interview_reject}</td>
                                <td>{item.interview_selected}</td>
                                <td>{item.shortlisted}</td>
                                <td>{item.onboarded_failure}</td>
                                <td>{item.onboarded}</td>
                                <td>{item.offer_rolledout}</td>
                                <td>{item.offer_rolledout_accepted}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PerformanceReport;
