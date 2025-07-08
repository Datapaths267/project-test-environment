import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import Button from '../../components/button/Button';
import './OnboardCandidate.css';
import * as XLSX from "xlsx"; // Import SheetJS for Excel handling
import { FaDownload, FaEye, FaUpload, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function OnboardCandidates() {
    const [onboardedCandidates, setOnboardedCandidates] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOnboardedCandidates, setSelectedOnboardedCandidates] = useState(new Set());
    const [showForm, setShowForm] = useState(false);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [editedRows, setEditedRows] = useState(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [editingDateIndex, setEditingDateIndex] = useState(null);
    const [filters, setFilters] = useState({
        candidate_name: '',
        customer_name: '',
        recruiter: '',
        account_manager: '',
        invoice_status: '',
    });
    const [options, setOptions] = useState({
        agreement_type: [],
        invoice_status: [],

    });

    const [formData, setFormData] = useState({
        agreement_type: '',

    });

    const token = localStorage.getItem("authToken");
    const companyId = localStorage.getItem("companyId");
    const employeeId = localStorage.getItem("employeeId");
    const designation = localStorage.getItem("designation");

    useEffect(() => {
        if (companyId) {
            loadInitialData();
        }
    }, [companyId]);;

    const loadInitialData = async () => {
        setLoading(true);
        await Promise.all([fetchConfigData(), GetOnboardedCandidates()]);
        setLoading(false);
    };

    const fetchConfigData = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}config/getAllConfig`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setOptions(res.data);
        } catch (err) {
            console.error("Error fetching config data:", err);
            toast.error("Failed to fetch config data");
        }
    };

    useEffect(() => {
        console.log("✅ Updated options:", options);
    }, [options]);

    const GetOnboardedCandidates = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}onboardedCandidates/OnboardedCandidatesContent`, {
                headers: { "Authorization": `Bearer ${token}` },
                params: { companyId, employeeId, designation }
            });

            console.log("onboarded candidate Tracker Data:", response.data);
            setOnboardedCandidates(response.data);
            setFilteredData(response.data);
        } catch (error) {
            console.error("Error fetching interview data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (candidate_id) => {
        setSelectedRows((prevSelected) => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(candidate_id)) {
                newSelected.delete(candidate_id);
            } else {
                newSelected.add(candidate_id);
            }
            console.log("Selected Customer IDs:", Array.from(newSelected)); // Debugging
            return newSelected;
        });
    };

    const handleEdit = (index, field, value) => {
        const updated = [...filteredData];
        const row = { ...updated[index], [field]: value };
        console.log("Updated Row:", row); // Debugging
        updated[index] = row;
        setFilteredData(updated);

        const newEdited = new Set(editedRows);
        newEdited.add(index);
        setEditedRows(newEdited);
        console.log("Edited Rows:", Array.from(newEdited)); // Debugging
    };


    const handleDownloadExcel = () => {
        if (onboardedCandidates.length === 0) {
            toast.info("No requirements available to download.");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(onboardedCandidates);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "requirements");
        XLSX.writeFile(wb, "requirements.xlsx");
    };

    const handleDeleteSelected = async () => {
        if (selectedRows.size === 0) {
            toast.error("Please select at least one customer to delete.");
            return;
        }

        const token = localStorage.getItem("authToken"); // Retrieve auth token
        const customerIds = Array.from(selectedRows); // Extract selected customer IDs

        try {
            // Delete each customer separately (if the API requires separate requests)
            await Promise.all(
                customerIds.map(async (selected_id) => {
                    await axios.delete(
                        `${process.env.REACT_APP_API_URL}onboardedCandidates/${selected_id}/deleteOnboardedCandidate`,
                        {
                            headers: {
                                "Authorization": `Bearer ${token}`,
                                "Content-Type": "application/json"
                            }
                        }
                    );
                })
            );

            console.log("Deleted Customers:", onboardedCandidates.req_id);
            toast.success("Customers deleted successfully!");

            // Refresh customer list after deletion
            GetOnboardedCandidates();

            setSelectedRows(new Set());

        } catch (error) {
            console.error("Error deleting customers:", error);
            toast.error("Failed to delete customers. Please try again.");
        }
    };

    const handleSave = async () => {
        const updatedRows = Array.from(editedRows).map((index) => filteredData[index]);

        try {
            for (const row of updatedRows) {
                const formData = new FormData();

                // Append non-file fields only
                for (const key in row) {
                    if (row[key] && key !== "detailed_profile" && key !== "masked_profile" && key !== "skill_mapping_attachment") {
                        formData.append(key, row[key]);
                    }
                }

                // Debugging FormData to log non-file data
                console.log("FormData entries (non-file data only):");
                for (let [key, value] of formData.entries()) {
                    console.log(`${key}: ${value}`);
                }

                // Make API call with non-file data only
                await axios.post(
                    `${process.env.REACT_APP_API_URL}onboardedCandidates/updateOnboardedCandidate`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );
            }

            toast.success("All changes saved successfully!", { position: "top-center", autoClose: 3000 });
            setEditedRows(new Set()); // Clear edited state
        } catch (error) {
            console.error("Error saving changes:", error);
            toast.error("Failed to save some or all changes.", { position: "top-center", autoClose: 3000 });
        }
    };


    const handleFilterChange = (e) => {
        const { name, value } = e.target;

        // Update filter state
        const updatedFilters = { ...filters, [name]: value };
        setFilters(updatedFilters);

        const filtered = onboardedCandidates.filter((candidate) => {
            const candidateNameFilter = updatedFilters.candidate_name?.toLowerCase() || "";
            const customerNameFilter = updatedFilters.customer_name?.toLowerCase() || "";
            const recruiterNameFilter = updatedFilters.recruiter?.toLowerCase() || "";
            const accountManagerNameFilter = updatedFilters.account_manager?.toLowerCase() || "";
            const invoiceStatus = updatedFilters.invoice_status?.toLowerCase() || "";


            const candidatenameMatch = candidate.candidate_name?.toLowerCase().includes(candidateNameFilter);
            const customernameMatch = candidate.customer_name?.toLowerCase().includes(customerNameFilter);
            const recruiterMatch = candidate.recruiter?.toLowerCase().includes(recruiterNameFilter);
            const accountmanagerMatch = candidate.account_manager?.toLowerCase().includes(accountManagerNameFilter);
            const invoicestatusMatch =
                !updatedFilters.invoice_status ||
                candidate.invoice_status?.toString() === updatedFilters.invoice_status.toString();


            return candidatenameMatch && customernameMatch && recruiterMatch && accountmanagerMatch && invoicestatusMatch;
        });

        setFilteredData(filtered);
    };


    return (
        <div className='OnboardedCandidates-container'>
            <h1>OnboardCandidates</h1>

            {(designation === "Recruiter" || designation === "Account Manager"
                || designation === "Senior Director" || designation === "Director"
            ) && (
                    <>


                        <Button className="download-contact-btn" onClick={handleDownloadExcel}>
                            <FaDownload /> Download
                        </Button>

                        <Button
                            className="delete-contact-btn"
                            onClick={handleDeleteSelected}
                            disabled={selectedRows.size === 0}
                        >
                            <FaTrash />  Delete
                        </Button>

                        <Button
                            className="salary-save-Button"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>

                        <div className="interview-filters">
                            <input
                                type="text"
                                name="candidate_name"
                                placeholder="Search by candidate Name"
                                value={filters.candidate_name}
                                onChange={handleFilterChange}
                                className="filter-input"
                            />

                            <input
                                type="text"
                                name="customer_name"
                                placeholder="Search by customer Name"
                                value={filters.customer_name}
                                onChange={handleFilterChange}
                                className="filter-input"
                            />

                            <input
                                type="text"
                                name="recruiter"
                                placeholder="Search by recruiter Name"
                                value={filters.recruiter}
                                onChange={handleFilterChange}
                                className="filter-input"
                            />
                            <input
                                type="text"
                                name="account_manager"
                                placeholder="Search by account manager Name"
                                value={filters.account_manager}
                                onChange={handleFilterChange}
                                className="filter-input"
                            />

                            <select
                                name="invoice_status"
                                value={filters.invoice_status}
                                onChange={handleFilterChange}
                                className="filter-select"
                            >
                                <option value="">Select invoice status</option>
                                {options.invoice_status.map((s, index) => (
                                    <option key={index} value={s.value}>{s.value}</option>


                                ))}
                            </select>

                            <Button onClick={() => {
                                setFilters({
                                    candidate_name: '',
                                    customer_name: '',
                                    recruiter: '',
                                    account_manager: '',
                                    invoice_status: ''
                                });
                                setFilteredData(onboardedCandidates);
                            }}>
                                Clear Filters
                            </Button>
                        </div>

                    </>
                )}

            {loading ? (<p>Loading...</p>) : (
                <div className='OnboardedCandidates-table'>
                    <div className='OnboardedCandidates-table-structure'>
                        <div className='OnboardedCandidates-table-header'>
                            {["Select", "Sr.No", "Account Manager", "Recruiter", "Year", "Month", "Customer Name", "Req ID", "Requirement", "Agreement Type", "Candidate ID", "Candidate Name", "Mobile No.", "Email ID",
                                "Location", "CTC", "FTE", "Rate", "DOJ", "Invoice status"]
                                .map((header, index) => (
                                    <span key={index}> {header} </span>
                                ))}
                        </div>

                        {filteredData.length > 0 ? (
                            filteredData.map((onboardCandidate, index) => (
                                <div
                                    key={onboardCandidate.id}
                                    className={`OnboardedCandidates-table-row ${selectedOnboardedCandidates.has(onboardCandidate.id) ? 'selected-row' : ''}`}
                                    style={{ backgroundColor: selectedOnboardedCandidates.has(onboardCandidate.id) ? '#d3d3d3' : 'transparent' }}
                                >
                                    {/* Checkbox */}
                                    <span>
                                        <input
                                            type="checkbox"
                                            onChange={() => handleCheckboxChange(onboardCandidate.selected_id)}
                                            checked={selectedRows.has(onboardCandidate.selected_id)}
                                        />
                                    </span>

                                    <span> 1 </span>
                                    <span className='OnboardedCandidates-name'> {onboardCandidate.account_manager || ''}</span>

                                    <span className='OnboardedCandidates-name'> {onboardCandidate.recruiter || ''}</span>

                                    {/* Editable Fields */}
                                    {/* <span onClick={() => setEditingDateIndex(index)}>
                                        {editingDateIndex === index ? (
                                            <input
                                                type="date"
                                                value={
                                                    onboardCandidate.interview_date
                                                        ? new Date(onboardCandidate.interview_date).toISOString().split("T")[0]
                                                        : ''
                                                }
                                                onChange={(e) => handleEdit(index, "interview_date", e.target.value)}
                                                onBlur={() => setEditingDateIndex(null)}
                                                autoFocus
                                            />
                                        ) : (
                                            onboardCandidate.interview_date
                                                ? new Date(onboardCandidate.interview_date).getFullYear()
                                                : 'N/A'
                                        )}
                                    </span> */}

                                    <span> {onboardCandidate.interview_date
                                        ? new Date(onboardCandidate.interview_date).getFullYear()
                                        : 'N/A'} </span>


                                    <span> {
                                        onboardCandidate.interview_date
                                            ? new Date(onboardCandidate.interview_date).toLocaleString('default', { month: 'long' })
                                            : 'N/A'
                                    }</span>

                                    {/* <span onClick={() => setEditingDateIndex(index)}>
                                        {editingDateIndex === index ? (
                                            <input
                                                type="date"
                                                value={
                                                    onboardCandidate.interview_date
                                                        ? new Date(onboardCandidate.interview_date).toISOString().split("T")[0]
                                                        : ''
                                                }
                                                onChange={(e) => handleEdit(index, "interview_date", e.target.value)}
                                                onBlur={() => setEditingDateIndex(null)}
                                                autoFocus
                                            />
                                        ) : (
                                            onboardCandidate.interview_date
                                                ? new Date(onboardCandidate.interview_date).toLocaleString('default', { month: 'long' })
                                                : 'N/A'
                                        )}
                                    </span> */}

                                    <span className='OnboardedCandidates-name'>
                                        {onboardCandidate.customer_name || ''}

                                    </span>

                                    <span>
                                        <input
                                            type="text"
                                            value={onboardCandidate.req_id || ''}
                                            onChange={(e) => handleEdit(index, "req_id", e.target.value)}
                                        />
                                    </span>

                                    <span >
                                        {onboardCandidate.requirement || ''}
                                    </span>

                                    <span >
                                        {onboardCandidate.agreement_type || ''}

                                    </span>

                                    <span >
                                        <input
                                            type="text"
                                            value={onboardCandidate.candidate_id || ''}
                                            onChange={(e) => handleEdit(index, "candidate_id", e.target.value)}
                                        />
                                    </span>

                                    <span className='OnboardedCandidates-name'>
                                        {onboardCandidate.candidate_name || ''}
                                    </span>

                                    <span >
                                        {/* {onboardCandidate.contact_number || ''} */}
                                        {onboardCandidate.contact_number || ''}
                                    </span>

                                    <span>
                                        {onboardCandidate.mail_id || ''}
                                    </span>

                                    <span>
                                        {onboardCandidate.location || ''}
                                    </span>

                                    <span className='OnboardedCandidates-name'>
                                        {onboardCandidate.ectc || ''}
                                    </span>

                                    {onboardCandidate.agreement_type === 'FTE' ? (
                                        <>

                                            <span>
                                                {onboardCandidate.fte_percentage || ''}
                                            </span>
                                            <span className='OnboardedCandidates-name'>
                                                {/* You can optionally add a label or placeholder here */}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span>
                                                {/* Optionally leave this empty or for spacing */}
                                            </span>

                                            <span className='OnboardedCandidates-name'>
                                                {onboardCandidate.ctc_budget || ''}
                                            </span>

                                        </>
                                    )}


                                    <span>
                                        {/* {onboardCandidate.onboarded_date || ''} */}
                                        <input
                                            type="date"
                                            value={onboardCandidate.onboarded_date ? new Date(onboardCandidate.onboarded_date).toISOString().split("T")[0] : ''}
                                            onChange={(e) => handleEdit(index, "onboarded_date", e.target.value)}
                                        />
                                    </span>

                                    <span>
                                        <select
                                            value={onboardCandidate.invoice_status || ''}
                                            onChange={(e) => handleEdit(index, "invoice_status", e.target.value)}
                                            className="filter-select"
                                        >
                                            {onboardCandidate.invoice_status && !options.invoice_status.find(l => l.id === onboardCandidate.invoice_status) && (
                                                <option value={onboardCandidate.invoice_status}>
                                                    {onboardCandidate.invoice_status}
                                                </option>
                                            )}

                                            <option value="">Select Level</option>
                                            {options.invoice_status.map((l, index) => (
                                                <option key={index} value={l.invoice_status}>
                                                    {l.value}
                                                </option>
                                            ))}
                                        </select>
                                    </span>
                                </div>
                            ))
                        ) : (<p>No Data Available</p>)}
                    </div>
                </div>
            )}
        </div>

    )
}
