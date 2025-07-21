import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '../../components/button/Button';
import './AmFocusOn.css';

export default function AmFocusOn() {
    const [originalData, setOriginalData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedManager, setSelectedManager] = useState('');

    const token = localStorage.getItem("authToken");
    const companyId = localStorage.getItem("companyId");
    const employeeId = localStorage.getItem("employeeId");
    const designation = localStorage.getItem("designation");
    const employeeName = localStorage.getItem("employeeName");

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    useEffect(() => {
        if (companyId) loadInitialData();
    }, [companyId]);

    useEffect(() => {
        applyFilters();
    }, [selectedMonth, selectedYear, selectedManager, originalData]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}AMFocusOn/AMFocuOnContent`, {
                headers: { "Authorization": `Bearer ${token}` },
                params: { companyId, employeeId, designation, employeeName }
            });
            setOriginalData(response.data);
            setFilteredData(response.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let temp = [...originalData];

        if (selectedMonth) {
            temp = temp.filter(item => {
                const month = new Date(item.req_date).toLocaleString('default', { month: 'long' });
                return month === selectedMonth;
            });
        }

        if (selectedYear) {
            temp = temp.filter(item => {
                const year = new Date(item.req_date).getFullYear().toString();
                return year.includes(selectedYear);
            });
        }

        if (selectedManager) {
            temp = temp.filter(item => item.account_manager?.toLowerCase().includes(selectedManager.toLowerCase()));
        }

        setFilteredData(temp);
    };

    const clearFilters = () => {
        setSelectedMonth('');
        setSelectedYear('');
        setSelectedManager('');
        setFilteredData(originalData);
    };

    const uniqueManagers = [...new Set(originalData.map(item => item.account_manager).filter(Boolean))];

    return (
        <div className="AMFocusOn-container">
            <h1>AM Focus On</h1>

            <div className="filters">
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                    <option value="">Filter by Month</option>
                    {months.map(month => (
                        <option key={month} value={month}>{month}</option>
                    ))}
                </select>

                <input
                    type="text"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    placeholder="Filter by Year (e.g., 2024)"
                />

                <select value={selectedManager} onChange={(e) => setSelectedManager(e.target.value)}>
                    <option value="">Filter by Account Manager</option>
                    {uniqueManagers.map((manager, index) => (
                        <option key={index} value={manager}>{manager}</option>
                    ))}
                </select>

                <Button text="Clear Filters" onClick={clearFilters} > Clear Filters</Button>
            </div>

            <div className="AMFocusOn-table-container">
                <table className="AMFocusOn-table">
                    <thead>
                        <tr>
                            <th rowSpan="2">Sr No</th>
                            <th rowSpan="2">Year</th>
                            <th rowSpan="2">Month</th>
                            <th rowSpan="2">Week</th>
                            <th rowSpan="2">Account Manager</th>
                            <th rowSpan="2">Client</th>
                            <th colSpan="4" style={{ backgroundColor: 'yellow' }}>FTE</th>
                            <th colSpan="4" style={{ backgroundColor: 'rgb(7, 10, 44)', color: 'whitesmoke' }}>Contract</th>
                        </tr>
                        <tr>
                            <th>Positions</th>
                            <th>Submitted</th>
                            <th>Shortlisting</th>
                            <th>Onboarding</th>
                            <th>Positions</th>
                            <th>Submitted</th>
                            <th>Shortlisting</th>
                            <th>Onboarding</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="14">Loading...</td>
                            </tr>
                        ) : filteredData.length > 0 ? (
                            filteredData.map((item, index) => {
                                const dateObj = new Date(item.req_date);
                                const year = dateObj.getFullYear();
                                const month = dateObj.toLocaleString('default', { month: 'long' });
                                const week = `W${Math.ceil(dateObj.getDate() / 7)}`;
                                const isFTE = item.hire_type === 'FTE';

                                return (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{year}</td>
                                        <td>{month}</td>
                                        <td>{week}</td>
                                        <td>{item.account_manager || '-'}</td>
                                        <td>{item.client_id || '-'}</td>
                                        <td>{isFTE ? item.number_of_positions || 0 : 0}</td>
                                        <td>{isFTE ? item.total_candidates || 0 : 0}</td>
                                        <td>{isFTE ? item.shortlisted || 0 : 0}</td>
                                        <td>{isFTE ? item.onboarded || 0 : 0}</td>
                                        <td>{!isFTE ? item.number_of_positions || 0 : 0}</td>
                                        <td>{!isFTE ? item.total_candidates || 0 : 0}</td>
                                        <td>{!isFTE ? item.shortlisted || 0 : 0}</td>
                                        <td>{!isFTE ? item.onboarded || 0 : 0}</td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="14">No data found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
