import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import './InterviewTracker.css';
import Button from '../../components/button/Button';
import * as XLSX from "xlsx"; // Import SheetJS for Excel handling
import { FaDownload, FaEye, FaUpload, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function InterviewTracker() {
    const [interviewTracker, setInterviewTracker] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInterviews, setSelectedInterviews] = useState(new Set());
    const [showForm, setShowForm] = useState(false);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [filteredData, setFilteredData] = useState([]);
    const [editedRows, setEditedRows] = useState(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [editingDateIndex, setEditingDateIndex] = useState(null);
    const [filters, setFilters] = useState({
        candidate_name: '',
        client_name: '',
        recruiter: '',
        level_of_interview: '',
        interview_status: '',
    });

    const [options, setOptions] = useState({
        status: [],
        contact_type: [],
        req_status: [],
        interview_status: [],
        work_mode: [],
        interview_levels: [],
        currency: [],
        agreement_type: [],
        rating: [],
        country: [],
        designation: []
    });

    const fileInputRef = useRef(null); // Reference for hidden file input
    const token = localStorage.getItem("authToken");
    const companyId = localStorage.getItem("companyId");
    const employeeId = localStorage.getItem("employeeId");
    const designation = localStorage.getItem("designation");

    useEffect(() => {
        if (companyId) {
            loadInitialData();
        }
    }, [companyId]);

    const loadInitialData = async () => {
        setLoading(true);
        await Promise.all([fetchConfigData(), GetInterviewTracker()]);
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

    const GetInterviewTracker = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}interviewTracker/InterviewTrackerContent`, {
                headers: { "Authorization": `Bearer ${token}` },
                params: { companyId, employeeId, designation }
            });

            console.log("Interview Tracker Data:", response.data);
            setInterviewTracker(response.data);
            setFilteredData(response.data);
        } catch (error) {
            console.error("Error fetching interview data:", error);
        } finally {
            setLoading(false);
        }
    };


    const handleFilterChange = (e) => {
        const { name, value } = e.target;

        // Update filter state
        const updatedFilters = { ...filters, [name]: value };
        setFilters(updatedFilters);

        const filtered = interviewTracker.filter((candidate) => {
            const candidateNameFilter = updatedFilters.candidate_name?.toLowerCase() || "";
            const customerNameFilter = updatedFilters.customer_name?.toLowerCase() || "";

            const candidatenameMatch = candidate.candidate_name?.toLowerCase().includes(candidateNameFilter);
            const customernameMatch = candidate.customer_name?.toLowerCase().includes(customerNameFilter);
            const recruiterMatch = updatedFilters.recruiter === "" || candidate.recruiter === updatedFilters.recruiter;
            const levelOfInterviewMatch = updatedFilters.level_of_interview === "" || candidate.level_of_interview === updatedFilters.level_of_interview;
            const interviewstatusMatch = updatedFilters.interview_status === "" || candidate.interview_status === updatedFilters.interview_status;

            return candidatenameMatch && customernameMatch && recruiterMatch && interviewstatusMatch && levelOfInterviewMatch;
        });

        setFilteredData(filtered);
    };



    const toggleSelection = (id) => {
        setSelectedInterviews((prevSelected) => {
            const newSelection = new Set(prevSelected);
            if (newSelection.has(id)) {
                newSelection.delete(id);
            } else {
                newSelection.add(id);
            }
            return newSelection;
        });
    };

    // Trigger hidden file input when button is clicked
    const handleUploadClick = () => {
        const confirmed = window.confirm("Do you want to download the Excel format before uploading?");
        if (confirmed) {
            // Trigger download
            window.open(`${process.env.REACT_APP_API_URL}interviewTracker/download-template`, "_blank");
        } else {
            fileInputRef.current.click();
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("companyId", companyId);

        console.log("Uploading file:", file.name);
        console.log("FormData Content:");
        for (let pair of formData.entries()) {
            console.log(pair[0], pair[1]);
        }

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}candidateTracker/upload-excel`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Company-ID": companyId // Pass it in headers if backend expects it
                },
                params: { companyId } // Also passing in params
            });

            console.log("Upload Response:", response.data);
            if (response.data.success && response.data.insertedRows) {
                toast.success("Customers added successfully!");
            } else {
                toast.error("Failed to insert customers.");
            }
            GetInterviewTracker();

        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error("Failed to upload file.");
        }
    };

    const handleDownloadExcel = () => {
        if (interviewTracker.length === 0) {
            toast.info("No requirements available to download.");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(interviewTracker);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "requirements");
        XLSX.writeFile(wb, "requirements.xlsx");
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
                customerIds.map(async (schedule_id) => {
                    await axios.delete(
                        `${process.env.REACT_APP_API_URL}interviewTracker/${schedule_id}/deleteinterviews`,
                        {
                            headers: {
                                "Authorization": `Bearer ${token}`,
                                "Content-Type": "application/json"
                            }
                        }
                    );
                })
            );

            console.log("Deleted interviewTracker:", interviewTracker.req_id);
            toast.success("interviewTracker deleted successfully!");

            // Refresh customer list after deletion
            GetInterviewTracker();

            setSelectedRows(new Set());

        } catch (error) {
            console.error("Error deleting customers:", error);
            toast.error("Failed to delete customers. Please try again.");
        }
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
                    `${process.env.REACT_APP_API_URL}interviewTracker/updateInterviewData`,
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


    return (
        <div className='Interview-container'>
            <h1>Interview Tracker</h1>
            {/* <Button className='add-Interview-btn'> Add Data </Button> */}
            {(designation === "Recruiter" || designation === "Account Manager"
                || designation === "Senior Director" || designation === "Director"
            ) && (
                    <>
                        {/* Download Excel Button */}
                        <Button className="download-contact-btn" onClick={handleDownloadExcel}>
                            <FaDownload /> Download Interviews
                        </Button>

                        <Button
                            className="delete-contact-btn"
                            onClick={handleDeleteSelected}
                            disabled={selectedRows.size === 0}
                        >
                            <FaTrash />  Delete Interviews
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

                            <select
                                name="level_of_interview"
                                value={filters.level_of_interview}
                                onChange={handleFilterChange}
                                className="filter-select"
                            >

                                <option value="">Select Level</option>
                                {options.interview_levels.map((s, index) => (
                                    <option key={index} value={s.id}>{s.value}</option>
                                ))}

                            </select>

                            <select
                                name="interview_status"
                                value={filters.interview_status}
                                onChange={handleFilterChange}
                                className="filter-select"
                            >
                                <option value="">Select Interview Status</option>
                                {options.interview_status.map((s, index) => (
                                    <option key={index} value={s.value}>{s.value}</option>
                                ))}

                                {/* <option value="">Select status</option>
                                <option value="Screeen Select">Screeen Select</option>
                                <option value="Screen Reject">Screen Reject</option>
                                <option value="Interview Select">Interview Select</option>
                                <option value="Interview Reject">Interview Reject</option>
                                <option value="Shortlisted">Shortlisted</option>
                                <option value="Offer Rolledout">Offer Rolledout</option>
                                <option value="Offer Rolledout Accepted">Offer Rolledout Accepted</option>
                                <option value="Onboarded">Onboarded</option>
                                <option value="Onboarding Failure">Onboarding Failure</option> */}
                            </select>

                            <Button onClick={() => {
                                setFilters({
                                    candidate_name: '',
                                    client_name: '',
                                    recruiter: '',
                                    level_of_interview: '',
                                    interview_status: ''
                                });
                                setFilteredData(interviewTracker);
                            }}>
                                Clear Filters
                            </Button>
                        </div>


                        {showForm && (
                            <div className="modal show d-block">
                                <div className="modal-dialog">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Candidate Form</h5>
                                            <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
                                        </div>
                                        <div className="modal-body">
                                            {/* <CandidateTrackerForm onClose={() => { setShowForm(false);             GetInterviewTracker(); }} /> */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}


            {loading ? (<p>Loading...</p>) : (
                <div className='Interview-table'>
                    <div className='Interview-table-structure'>
                        <div className='Interview-table-header'>
                            {["Select", "Interview ID", "Interview Date", "Interview Time", "Recruiter", "Req ID", "Client ID", "Client Name", "POC ID", "POC Name", "Role",
                                "Level of Interview", "Candidate Name", "Candidate Number", "Mail ID", "Interview Status"]
                                .map((header, index) => (
                                    <span key={index}> {header} </span>
                                ))}
                        </div>
                        {filteredData.length > 0 ? (
                            filteredData.map((interview, index) => (
                                <div
                                    key={interview.id}
                                    className={`Interview-table-row ${selectedInterviews.has(interview.id) ? 'selected-row' : ''}`}
                                    style={{ backgroundColor: selectedInterviews.has(interview.id) ? '#d3d3d3' : 'transparent' }}
                                >
                                    {/* Checkbox */}
                                    <span>
                                        <input
                                            type="checkbox"
                                            onChange={() => handleCheckboxChange(interview.schedule_id)}
                                            checked={selectedRows.has(interview.schedule_id)}
                                        />
                                    </span>

                                    <span> {interview.schedule_id || ''}</span>

                                    {/* Editable Fields */}
                                    <span onClick={() => setEditingDateIndex(index)}>
                                        {editingDateIndex === index ? (
                                            <input
                                                type="date"
                                                value={interview.interview_date ? new Date(interview.interview_date).toISOString().split("T")[0] : ''}
                                                onChange={(e) => handleEdit(index, "interview_date", e.target.value)}
                                                onBlur={() => setEditingDateIndex(null)}
                                                autoFocus
                                            />
                                        ) : (
                                            interview.interview_date ? new Date(interview.interview_date).toLocaleDateString('en-GB') : 'N/A'
                                        )}
                                    </span>


                                    <span>
                                        <input
                                            type="time"
                                            value={interview.interview_time || ''}
                                            onChange={(e) => handleEdit(index, "interview_time", e.target.value)}
                                        />
                                    </span>

                                    <span>
                                        {interview.recruiter || ''}
                                        {/* <input
                                            type="text"
                                            value={interview.recruiter || ''}
                                            onChange={(e) => handleEdit(index, "recruiter", e.target.value)}
                                        /> */}
                                    </span>

                                    <span>
                                        <input
                                            type="text"
                                            value={interview.req_id || ''}
                                            onChange={(e) => handleEdit(index, "req_id", e.target.value)}
                                        />
                                    </span>

                                    <span className='Interview-name'>
                                        <input
                                            type="text"
                                            value={interview.client_id || ''}
                                            onChange={(e) => handleEdit(index, "customer_name", e.target.value)}
                                        />
                                    </span>

                                    <span className='Interview-name'>
                                        {interview.customer_name || ''}
                                        {/* <input
                                            type="text"
                                            value={interview.customer_name || ''}
                                            onChange={(e) => handleEdit(index, "customer_name", e.target.value)}
                                        /> */}
                                    </span>

                                    <span className='Interview-name'>
                                        <input
                                            type="text"
                                            value={interview.contact_id || ''}
                                            onChange={(e) => handleEdit(index, "call_name", e.target.value)}
                                        />
                                    </span>

                                    <span className='Interview-name'>
                                        {interview.call_name || ''}
                                        {/* <input
                                            type="text"
                                            value={interview.call_name || ''}
                                            onChange={(e) => handleEdit(index, "call_name", e.target.value)}
                                        /> */}
                                    </span>

                                    <span>
                                        <input
                                            type="text"
                                            value={interview.requirement || ''}
                                            onChange={(e) => handleEdit(index, "requirement", e.target.value)}
                                        />
                                    </span>

                                    <span>
                                        <select
                                            value={interview.level_of_interview || ''}
                                            onChange={(e) => handleEdit(index, "level_of_interview", e.target.value)}
                                            className="filter-select"
                                        >
                                            {interview.level_of_interview && !options.interview_levels.find(l => l.id === interview.level_of_interview) && (
                                                <option value={interview.level_of_interview}>
                                                    {interview.level_of_interview}
                                                </option>
                                            )}

                                            <option value="">Select Level</option>
                                            {options.interview_levels.map((l, index) => (
                                                <option key={index} value={l.interview_levels}>
                                                    {l.value}
                                                </option>
                                            ))}
                                        </select>

                                        {/* <select
                                            value={interview.level_of_interview || ''}
                                            onChange={(e) => handleEdit(index, "level_of_interview", e.target.value)}
                                            className="filter-select"
                                        >
                                            <option value="">Select Level</option>
                                            {options.interview_levels.map((s, index) => (
                                                <option key={index} value={s.id}>{s.value}</option>
                                            ))}

                                         <option value="">Select Level</option>
                                            <option value="L1">L1 - Screening</option>
                                            <option value="L2">L2 - Technical Round 1</option>
                                            <option value="L3">L3 - Technical Round 2</option>
                                            <option value="L4">L4 - Managerial Round</option>
                                            <option value="L5">L5 - Client Round</option>
                                            <option value="L6">L6 - HR Round</option>
                                            <option value="L7">L7 - Offer Discussion</option> 
                                        </select>*/}
                                    </span>

                                    <span className='Interview-name'>
                                        {interview.candidate_name || ''}
                                        {/* <input
                                            type="text"
                                            value={interview.candidate_name || ''}
                                            onChange={(e) => handleEdit(index, "candidate_name", e.target.value)}
                                        /> */}
                                    </span>

                                    <span>
                                        {interview.contact_number || ''}
                                        {/* <input
                                            type="text"
                                            value={interview.contact_number || ''}
                                            onChange={(e) => handleEdit(index, "contact_number", e.target.value)}
                                        /> */}
                                    </span>

                                    <span>
                                        {interview.mail_id || ''}
                                        {/* <input
                                            type="text"
                                            value={interview.mail_id || ''}
                                            onChange={(e) => handleEdit(index, "mail_id", e.target.value)}
                                        /> */}
                                    </span>

                                    <span>

                                        <select
                                            value={interview.interview_status || ''}
                                            onChange={(e) => handleEdit(index, "interview_status", e.target.value)}
                                            className="filter-select"
                                        >
                                            {/* Always show the current value as the first option */}
                                            {interview.interview_status && !options.interview_status.find(s => s.id === interview.interview_status) && (
                                                <option value={interview.interview_status}>
                                                    {interview.interview_status}
                                                </option>
                                            )}

                                            {/* Render all available options */}
                                            {options.interview_status.map((s, index) => (
                                                <option key={index} value={s.interview_status}>
                                                    {s.value}
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
    );
}
