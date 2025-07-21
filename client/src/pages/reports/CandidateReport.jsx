import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '../../components/button/Button';
import './CandidateReport.css';

const CandidateReport = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [clientNameFilter, setClientNameFilter] = useState('');

    const token = localStorage.getItem("authToken");
    const companyId = localStorage.getItem("companyId");
    const employeeId = localStorage.getItem("employeeId");
    const designation = localStorage.getItem("designation");
    const employeeName = localStorage.getItem("employeeName");

    useEffect(() => {
        if (companyId) loadInitialData();
    }, [companyId]);

    useEffect(() => {
        applyFilters();
    }, [clientNameFilter, data]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}AMFocusOn/AMFocuOnContent`, {
                headers: { "Authorization": `Bearer ${token}` },
                params: { companyId, employeeId, designation, employeeName }
            });
            setData(response.data);
            setFilteredData(response.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        const filtered = data.filter(item =>
            item.customer.toLowerCase().includes(clientNameFilter.toLowerCase())
        );
        setFilteredData(filtered);
    };

    const clearFilters = () => {
        setClientNameFilter('');
    };

    return (
        <div className="am-table-container">
            <h2>Candidate Report</h2>

            {/* 🔍 Filter Section */}
            <div className="filter-section">
                <input
                    type="text"
                    placeholder="Filter by Client Name"
                    value={clientNameFilter}
                    onChange={(e) => setClientNameFilter(e.target.value)}
                    className="filter-input"
                />
                <Button text="Clear Filters" onClick={clearFilters} > Clear Filters</Button>
            </div>
            <br />

            {/* 📊 Data Table */}
            <table className="am-focus-table">
                <thead>
                    <tr>
                        <th>SL No</th>
                        <th>Client Name</th>
                        <th>Profiles</th>
                        <th>Hold</th>
                        <th>No Shows</th>
                        <th>Screening</th>
                        <th>L1 Round</th>
                        <th>L2 Round</th>
                        <th>Managerial Round</th>
                        <th>Client Round</th>
                        <th>HR Round</th>
                        <th>Offer Discussion</th>
                        <th>Selects (Offer dropouts)</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="13">Loading...</td></tr>
                    ) : filteredData.length > 0 ? (
                        filteredData.map((item, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{item.customer}</td>
                                <td>{item.total_candidates}</td>
                                <td>{item.hold}</td>
                                <td>{item.no_show}</td>
                                <td>{item.l1_screening}</td>
                                <td>{item.l2_technical_round}</td>
                                <td>{item.l3_technical_round}</td>
                                <td>{item.managerial_round}</td>
                                <td>{item.client_round}</td>
                                <td>{item.hr_round}</td>
                                <td>{item.offer_discussion}</td>
                                <td>{item.offer_rolledout - item.offer_rolledout_accepted}</td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan="13">No data available.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default CandidateReport;
