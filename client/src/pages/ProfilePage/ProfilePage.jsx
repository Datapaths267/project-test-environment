import React, { useEffect, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
    FaUserCircle, FaUsers, FaUserTie, FaCalendarAlt, FaUserCheck
} from 'react-icons/fa';
import CountUp from 'react-countup';
import axios from 'axios';

export default function ProfilePage() {
    const [data, setData] = useState(null);
    const [imageUrl, setImageUrl] = useState('');

    const token = localStorage.getItem("authToken");
    const userId = localStorage.getItem("employeeId");

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await axios.get(
                    `${process.env.REACT_APP_API_URL}profile/profile/${userId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setData(res.data);
            } catch (err) {
                console.error("Error fetching profile data", err);
            }
        }
        fetchData();
    }, [userId, token]);

    useEffect(() => {
        console.log("Full fetched data:", data);
    }, [data]);


    if (!data) return <p className="text-center mt-10">Loading...</p>;

    const pieData = [
        { name: 'Scheduled', value: Number(data.candidates.scheduled) || 0 },
        { name: 'Onboarded', value: Number(data.candidates.onboarded) || 0 },
    ];

    const pieColors = ['#00C49F', '#FF8042'];
    console.log("Pie values:", data.candidates.scheduled, typeof data.candidates.scheduled);

    const renderContentByRole = (role) => {
        switch (role) {
            case 'Recruiter':
                return (
                    <>
                        {/* Summary Cards */}
                        <div className="row g-4 mb-5">
                            {[
                                { icon: <FaUsers />, label: 'Customers', color: 'primary', count: data.customers.length },
                                { icon: <FaUserTie />, label: 'Candidates', color: 'success', count: data.candidates.total },
                                { icon: <FaCalendarAlt />, label: 'Interviews', color: 'warning', count: data.candidates.scheduled },
                                { icon: <FaUserCheck />, label: 'Onboarded', color: 'info', count: data.candidates.onboarded },
                            ].map(({ icon, label, color, count }, idx) => (
                                <div key={idx} className="col-md-3 col-sm-6">
                                    <div className={`card text-center shadow-sm border-0 p-3`}>
                                        <div className={`text-${color} mb-2`} style={{ fontSize: 40 }}>{icon}</div>
                                        <h5 className={`text-${color}`}>{label}</h5>
                                        <p className="fs-3 fw-bold"><CountUp end={count} duration={1.5} /></p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Graphs */}
                        <h3 className="fw-semibold mb-4">Dashboard Overview</h3>
                        <div className="row mb-5">
                            <div className="col-md-6">
                                <div className="bg-white p-4 rounded-4 shadow mb-4">
                                    <h5 className="fw-semibold mb-3">Monthly Revenue</h5>
                                    <LineChart width={500} height={300} data={data.monthlyRevenue}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                                    </LineChart>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="bg-white p-4 rounded-4 shadow mb-4">
                                    <h5 className="fw-semibold mb-3">Candidate Stage</h5>
                                    <PieChart width={400} height={300}>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                            ))}
                                        </Pie>
                                        <Legend />
                                        <Tooltip />
                                    </PieChart>
                                </div>
                            </div>
                        </div>

                        {/* Recent Candidates Table */}
                        <div className="bg-white p-4 rounded-4 shadow mb-5">
                            <h5 className="fw-semibold mb-3">Recent Candidates</h5>
                            {data.recentCandidates.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-bordered table-striped">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Date</th>
                                                <th>Candidate</th>
                                                <th>Customer</th>
                                                <th>Stage</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data?.recentCandidates?.map((item, index) => (
                                                console.log("Recent Candidate Item:", item),
                                                <tr key={index}>
                                                    <td>{new Date(item.date).toLocaleDateString("en-IN")}</td>
                                                    <td>{item.candidate}</td>
                                                    <td>{item.customer}</td>
                                                    <td>{item.stage || "-"}</td>
                                                    <td>{item.status || "-"}</td>
                                                </tr>
                                            ))}

                                        </tbody>


                                    </table>
                                </div>
                            ) : (
                                <p>No recent candidates available.</p>
                            )}
                        </div>
                    </>
                );

            case 'Finance Admin':
                return (
                    <div className="text-center bg-light p-4 rounded shadow-sm">
                        <h4>Finance Dashboard</h4>
                        <p><strong>Total Revenue:</strong> ₹{data.revenue?.toLocaleString() || 0}</p>
                        <p><strong>Employee Salary:</strong> ₹{data.employeeSalary?.toLocaleString() || 0}</p>
                    </div>
                );

            case 'Director':
                return (
                    <div className="text-center bg-light p-4 rounded shadow-sm">
                        <h4>Director View</h4>
                        <p><strong>Total Customers:</strong> {data.customers.length}</p>
                        <p><strong>Total Revenue:</strong> ₹{data.revenue?.toLocaleString() || 0}</p>
                    </div>
                );

            default:
                return <p>No dashboard available for role: {role}</p>;
        }
    };

    return (
        <div className="p-4 container">
            <h1 className="text-2xl fw-bold mb-5">Profile Page - {data.role}</h1>

            {/* Profile Info */}
            <div className="d-flex justify-content-center align-items-center mb-5">
                <div className="bg-white p-4 rounded-4 shadow text-center">
                    <h2 className="fs-4 fw-semibold mb-4">Profile Information</h2>
                    <div style={{
                        width: 200, height: 200, borderRadius: '50%',
                        overflow: 'hidden', backgroundColor: '#f0f0f0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto', marginBottom: '1rem'
                    }}>
                        {imageUrl ? (
                            <img src={imageUrl} alt="Profile" style={{
                                width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'
                            }} />
                        ) : (
                            <FaUserCircle size={200} color="#aaa" />
                        )}
                    </div>
                    <p><strong>Name:</strong> {data.name}</p>
                    <p><strong>Email:</strong> {data.email}</p>
                    <p><strong>Salary:</strong> ₹{data.salary?.toLocaleString() || 0}</p>
                </div>
            </div>

            {/* Dynamic Role View */}
            {renderContentByRole(data.role)}
        </div>
    );
}
