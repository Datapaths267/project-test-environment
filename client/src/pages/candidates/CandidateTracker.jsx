import React, { useEffect, useRef, useState } from 'react';
import Button from '../../components/button/Button';
import axios from 'axios';
import './CandidateTracker.css';
import CandidateTrackerForm from '../../components/forms/CandidateTrackerForm';
import * as XLSX from "xlsx"; // Import SheetJS for Excel handling
import { FaDownload, FaEye, FaUpload, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from 'sweetalert2';

export default function CandidateTracker() {
    const [candidate, setCandidate] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [editedRows, setEditedRows] = useState(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [imageStore, setImageStore] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [filters, setFilters] = useState({
        candidate_name: '',
        client_name: '',
        status: '',
        notice_period: '',
        interview_status: '',
    });


    const fileInputRef = useRef(null); // Reference for hidden file input
    const token = localStorage.getItem("authToken");
    const companyId = localStorage.getItem("companyId");
    const employeeId = localStorage.getItem("employeeId");
    const designation = localStorage.getItem("designation");


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

    useEffect(() => {
        if (companyId) {
            loadInitialData();
        }
    }, [companyId]);

    const loadInitialData = async () => {
        setLoading(true);
        await Promise.all([fetchConfigData(), fetchCandidate()]);
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


    const fetchCandidate = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}candidateTracker/CandidateTrackerContent`, {
                headers: { "Authorization": `Bearer ${token}` },
                params: { companyId, employeeId, designation }
            });
            console.log("Stored candidate:", response.data);
            setCandidate(response.data);
            setFilteredData(response.data);
        } catch (error) {
            console.error("Error fetching candidate:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;

        // Update filter state
        const updatedFilters = { ...filters, [name]: value };
        setFilters(updatedFilters);

        // Apply filtering logic using the updated filters
        const filtered = candidate.filter((candidate) => {
            const candidatenameMatch = candidate.candidate_name?.toLowerCase().includes(updatedFilters.candidate_name.toLowerCase());
            const customernameMatch = candidate.customer_name?.toLowerCase().includes(updatedFilters.client_name.toLowerCase());
            const noticeperiodMatch = updatedFilters.notice_period === "" || candidate.notice_period === updatedFilters.notice_period;
            const statusMatch = updatedFilters.status === "" || candidate.status === updatedFilters.status;
            const interviewStatusMatch = updatedFilters.interview_status === "" || candidate.interview_status === updatedFilters.interview_status;

            return candidatenameMatch && customernameMatch && noticeperiodMatch && statusMatch && interviewStatusMatch;
        });

        setFilteredData(filtered);
    };

    const handleViewImage = async (candidate_id, fileType, action) => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}candidateTracker/get-files/${candidate_id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { candidate_id },
                }
            );

            console.log("Documents Data:", response.data);

            // Ensure the requested file type exists
            if (!response.data || !response.data[fileType]) {
                toast.error("No document found for this file type.");
                return;
            }

            const fileEntry = response.data[fileType];
            console.log("Raw File Data:", fileEntry.data);
            if (!fileEntry || !fileEntry.data || !Array.isArray(fileEntry.data)) {
                toast.error("Document not available.");
                return;
            }

            const fileBuffer = fileEntry.data;
            const mimeType = fileEntry.mimetype || "application/pdf"; // Default to PDF if no mimetype is found

            // Verify if the fileBuffer is valid
            console.log("File Buffer Length:", fileBuffer.length);
            console.log("First 10 bytes:", fileBuffer.slice(0, 10));

            const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
            const url = URL.createObjectURL(blob);

            console.log("Generated Blob URL:", url);

            if (action === "preview") {
                window.open(url, "_blank"); // Open the file in a new tab
            } else if (action === "download") {
                const link = document.createElement("a");
                link.href = url;
                link.download = `${fileType}.pdf`; // Customize the file name
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (action === "edit") {
                toast.info("Edit functionality is not implemented yet.");
            }
        } catch (error) {
            console.error("File handling error:", error);
            toast.error(`Failed to ${action} file.`);
        }
    };


    const renderFileIcons = (candidate_id, fileType) => (

        <FaEye
            className="icon preview-icon"
            onClick={() => handleViewImage(candidate_id, fileType, "preview")}
            title="Preview File"
        />
    );


    // Trigger hidden file input when button is clicked
    const handleUploadClick = () => {
        const confirmed = window.confirm("Do you want to download the Excel format before uploading?");
        if (confirmed) {
            // Trigger download
            window.open(`${process.env.REACT_APP_API_URL}candidateTracker/download-template`, "_blank");
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
            fetchCandidate();
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error("Failed to upload file.");
        }
    };

    const handleDownloadExcel = () => {
        if (candidate.length === 0) {
            toast.info("No requirements available to download.");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(candidate);
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
                customerIds.map(async (candidate_id) => {
                    await axios.delete(
                        `${process.env.REACT_APP_API_URL}candidateTracker/${candidate_id}/deleteCandidates`,
                        {
                            headers: {
                                "Authorization": `Bearer ${token}`,
                                "Content-Type": "application/json"
                            }
                        }
                    );
                })
            );

            console.log("Deleted Customers:", candidate.req_id);
            toast.success("Customers deleted successfully!");

            // Refresh customer list after deletion
            fetchCandidate();
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

    const handleFileChange = (e, rowIndex, fieldName) => {
        const files = Array.from(e.target.files);
        const candidate_id = filteredData[rowIndex]?.candidate_id;

        console.log("========== File Upload Triggered ==========");
        console.log(`Row Index: ${rowIndex}`);
        console.log(`Field Name: ${fieldName}`);
        console.log("Selected Files:", files);
        console.log("Candidate ID:", candidate_id);

        const updatedData = [...imageStore];

        if (!updatedData[rowIndex]) {
            updatedData[rowIndex] = {};
        }

        updatedData[rowIndex][fieldName] = files;
        setImageStore(updatedData);

        // Now pass candidate_id to uploadFiles
        uploadFiles(updatedData, candidate_id);
    };


    const uploadFiles = async (updatedData, candidate_id) => {
        if (!candidate_id) {
            console.error("❌ No candidate ID provided. Upload aborted.");
            return;
        }

        if (!Array.isArray(updatedData)) {
            console.error("❌ updatedData is not an array:", updatedData);
            return;
        }

        const formData = new FormData();

        updatedData.forEach((row, rowIndex) => {
            if (row && typeof row === 'object') {
                Object.keys(row).forEach((fieldName) => {
                    const value = row[fieldName];

                    if (Array.isArray(value)) {
                        value.forEach((file) => {
                            if (file instanceof File) {
                                formData.append(`${fieldName}`, file);
                            } else {
                                console.warn(`⚠️ Skipped non-File value at ${fieldName}_row${rowIndex}:`, file);
                            }
                        });
                    }
                });
            } else {
                console.warn(`⚠️ Skipped invalid row at index ${rowIndex}:`, row);
            }
        });

        // Debug: Print what you're sending
        for (let pair of formData.entries()) {
            console.log(pair[0], pair[1]);
        }

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}candidateTracker/updateFiles/${candidate_id}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            console.log("✅ Upload success:", response.data);
            setImageStore([]); // Clear the selected files from state

        } catch (error) {
            console.error("❌ Upload error:", error);
        }
    };


    const deleteFiles = async (updatedData, candidate_id) => {
        if (!candidate_id) {
            console.error("❌ No candidate ID provided. Upload aborted.");
            return;
        }

        if (!Array.isArray(updatedData)) {
            console.error("❌ updatedData is not an array:", updatedData);
            return;
        }

        const formData = new FormData();

        updatedData.forEach((row, rowIndex) => {
            if (row && typeof row === 'object') {
                Object.keys(row).forEach((fieldName) => {
                    const value = row[fieldName];

                    if (Array.isArray(value)) {
                        value.forEach((file) => {
                            if (file instanceof File) {
                                formData.append(`${fieldName}`, file);
                            } else {
                                console.warn(`⚠️ Skipped non-File value at ${fieldName}_row${rowIndex}:`, file);
                            }
                        });
                    }
                });
            } else {
                console.warn(`⚠️ Skipped invalid row at index ${rowIndex}:`, row);
            }
        });

        // Debug: Print what you're sending
        for (let pair of formData.entries()) {
            console.log(pair[0], pair[1]);
        }

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}candidateTracker/deleteFiles/${candidate_id}`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            console.log("✅ Upload success:", response.data);
            toast.success("Uploaded Successfully ", response.data);
            setImageStore([]); // Clear the selected files from state

        } catch (error) {
            console.error("❌ Upload error:", error);
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
                    `${process.env.REACT_APP_API_URL}candidateTracker/updateCandidate`,
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


    const handleDeleteFile = async (reqId, columnName) => {
        const confirmResult = await Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to delete the file from ${columnName}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        });

        if (!confirmResult.isConfirmed) return;

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}candidateTracker/delete-file`, {
                candidate_id: reqId,
                file_name: columnName
            });

            console.log("Delete File Response:", response.data);

            if (response.data.success) {
                Swal.fire('Deleted!', 'File has been deleted.', 'success');
                // Optionally update UI here
            } else {
                Swal.fire('Failed!', 'Could not delete file.', 'error');
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            Swal.fire('Error!', 'An error occurred while deleting the file.', 'error');
        }
    };


    return (
        <div className='Candidate-container'>
            <h1>Candidate</h1>

            {(designation === "Recruiter" || designation === "Account Manager"
                || designation === "Senior Director" || designation === "Director"
            ) && (
                    <>
                        <Button className='add-Candidate-btn' onClick={() => { setShowForm(true) }}> Add Candidate </Button>
                        <Button className="upload-contact-btn" onClick={handleUploadClick}>
                            <FaUpload /> Upload Requirement
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: "none" }} // Hidden input field
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload}
                        />

                        {/* Download Excel Button */}
                        <Button className="download-contact-btn" onClick={handleDownloadExcel}>
                            <FaDownload /> Download Requirement
                        </Button>

                        <Button
                            className="delete-contact-btn"
                            onClick={handleDeleteSelected}
                            disabled={selectedRows.size === 0}
                        >
                            <FaTrash />  Delete Requirement
                        </Button>

                        <Button
                            className="salary-save-Button"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>

                        <div className="contact-filters">
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
                                name="client_name"
                                placeholder="Search by customer Name"
                                value={filters.client_name}
                                onChange={handleFilterChange}
                                className="filter-input"
                            />

                            <select
                                name="notice_period"
                                value={filters.notice_period}
                                onChange={handleFilterChange}
                                className="filter-select"
                            >
                                <option value="">select</option>
                                <option value="Immediate">Immediate</option>
                                <option value="15 Days">15 Days</option>
                                <option value="30 Days">30 Days</option>
                                <option value="60 days">60 Days</option>
                                {/* Add more options as needed */}
                            </select>

                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="filter-select"
                            >
                                <option value="">Select Status</option>
                                {options.status.map((s, index) => (
                                    <option key={index} value={s.value}>{s.value}</option>
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
                            </select>

                            <Button onClick={() => {
                                setFilters({
                                    candidate_name: '',
                                    client_name: '',
                                    status: '',
                                    notice_period: ''
                                });
                                setFilteredData(candidate);
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
                                            <CandidateTrackerForm onClose={() => { setShowForm(false); fetchCandidate(); }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

            <div className='Candidate-table-container'>
                <div className='Candidate-table-structure'>

                    {/* ✅ Table Headers */}
                    <div className='Candidate-table-headers'>
                        {["Select", "Candidate ID", "Client", "Client POC", "Req ID", "Requirement Rate", "Date of Submission", "Candidate Name", "Contact Number", "Mail ID", "Locatoin",
                            "Current Company", "Skill", "Total EXP", "Required EXP", "CTC", "ECTC", "Notice Period", "Status",
                            "Work Mode", "Notes", "Skill Mapping Notes", "Skill Mapping Rating", "Interview Status", "Recruiter", "Detailed Profile", "Masked Profile", "skill_mapping_attachment"]
                            .map((header, index) => (
                                <span key={index}>{header}</span>
                            ))}
                    </div>

                    {/* ✅ Loading State */}
                    {loading ? (
                        <p>Loading candidate...</p>
                    ) : filteredData.length > 0 ? (
                        filteredData.map((Candidate, index) => (
                            <div key={index} className="Candidate-row">
                                <span>  <input
                                    type="checkbox"
                                    onChange={() => handleCheckboxChange(Candidate.candidate_id)}
                                    checked={selectedRows.has(Candidate.candidate_id)}
                                />
                                </span>
                                <span> {Candidate.candidate_id} </span>
                                <span className="Candidate-name"> <input style={{
                                    color: ' rgb(24, 172, 231) ',
                                    borderColor: 'blue'
                                }} value={Candidate.customer_name} onChange={(e) =>
                                    handleEdit(index, "customer_name", e.target.value)} /></span>

                                <span className="Candidate-name"> <input style={{
                                    color: ' rgb(24, 172, 231) ',
                                    borderColor: 'blue'
                                }} value={Candidate.call_name} onChange={(e) =>
                                    handleEdit(index, "call_name", e.target.value)} /></span>

                                <span> <input value={Candidate.req_id} onChange={(e) =>
                                    handleEdit(index, "req_id", e.target.value)} /></span>

                                <span> {Candidate.ctc_budget} </span>

                                <span> <input value={new Date(Candidate.date_of_submission).toLocaleDateString('en-GB')} onChange={(e) =>
                                    handleEdit(index, "date_of_submission", e.target.value)} /></span>

                                <span className="Candidate-name"> <input style={{
                                    color: ' rgb(24, 172, 231) ',
                                    borderColor: 'blue'
                                }} value={Candidate.candidate_name} onChange={(e) =>
                                    handleEdit(index, "candidate_name", e.target.value)} /></span>

                                <span> <input value={Candidate.contact_number} onChange={(e) =>
                                    handleEdit(index, "contact_number", e.target.value)} /></span>

                                <span> <input value={Candidate.mail_id} onChange={(e) =>
                                    handleEdit(index, "mail_id", e.target.value)} /></span>
                                <span> <input value={Candidate.mail_id} onChange={(e) =>
                                    handleEdit(index, "mail_id", e.target.value)} /></span>

                                <span> <input value={Candidate.current_company} onChange={(e) =>
                                    handleEdit(index, "current_company", e.target.value)} /></span>

                                <span> <input value={Candidate.skill} onChange={(e) =>
                                    handleEdit(index, "skill", e.target.value)} /></span>

                                <span> <input value={Candidate.total_exp} onChange={(e) =>
                                    handleEdit(index, "total_exp", e.target.value)} /></span>

                                <span> <input value={Candidate.re_exp} onChange={(e) =>
                                    handleEdit(index, "re_exp", e.target.value)} /></span>

                                <span> <input value={Candidate.ctc} onChange={(e) =>
                                    handleEdit(index, "ctc", e.target.value)} /></span>

                                <span> <input value={Candidate.ectc} onChange={(e) =>
                                    handleEdit(index, "ectc", e.target.value)} /></span>

                                <span> <input value={Candidate.notice_period} onChange={(e) =>
                                    handleEdit(index, "notice_period", e.target.value)} /></span>
                                <span id={Candidate.status.toLowerCase === 'active' ? 'active' : 'not_active'}>
                                    <select
                                        value={Candidate.status}
                                        onChange={(e) => handleEdit(index, "status", e.target.value)}
                                        className="filter-select"
                                    >
                                        {Candidate.status && !options.status.find(s => s.id === Candidate.status) && (
                                            <option value={Candidate.status}>
                                                {Candidate.status}
                                            </option>
                                        )}

                                        {/* Render all available options */}
                                        {options.status.map((s, index) => (
                                            <option key={index} value={s.status}>
                                                {s.value}
                                            </option>
                                        ))}
                                    </select>
                                </span>

                                <span> <input value={Candidate.work_mode} onChange={(e) =>
                                    handleEdit(index, "work_mode", e.target.value)} /></span>
                                <span> <input value={Candidate.notes} onChange={(e) =>
                                    handleEdit(index, "notes", e.target.value)} /></span>
                                <span> <input value={Candidate.skill_mapping_notes} onChange={(e) =>
                                    handleEdit(index, "skill_mapping_notes", e.target.value)} /></span>
                                <span> <input value={Candidate.skill_mapping_rating} onChange={(e) =>
                                    handleEdit(index, "skill_mapping_rating", e.target.value)} /></span>
                                <span>
                                    <select
                                        value={Candidate.interview_status || ""}
                                        onChange={(e) => handleEdit(index, "interview_status", e.target.value)}
                                        className="filter-select"
                                    >
                                        {/* Placeholder option shown only when no value is selected */}
                                        <option value="" disabled>
                                            Select Interview Status
                                        </option>

                                        {/* Handle unknown existing value */}
                                        {Candidate.interview_status &&
                                            !options.interview_status.find((s) => s.id === Candidate.interview_status) && (
                                                <option value={Candidate.interview_status}>
                                                    {Candidate.interview_status}
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


                                <span> {Candidate.recruiter_name}
                                </span>

                                <span className="files-row">
                                    {renderFileIcons(Candidate.candidate_id, "detailed_profile")}
                                    <label style={{ cursor: 'pointer', marginRight: '8px', marginLeft: '8px' }}>
                                        <FaEdit title="Edit" />
                                        <input
                                            type="file"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleFileChange(e, index, 'detailed_profile')}
                                        />
                                    </label>

                                    <FaTrash
                                        title="Delete"
                                        style={{ cursor: 'pointer', color: 'red' }}
                                        onClick={() => handleDeleteFile(Candidate.candidate_id, 'detailed_profile')}
                                    />
                                </span>

                                <span className="files-row">
                                    {renderFileIcons(Candidate.candidate_id, "masked_profile")}

                                    <label style={{ cursor: 'pointer', marginRight: '8px', marginLeft: '8px' }}>
                                        <FaEdit title="Edit" />
                                        <input
                                            type="file"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleFileChange(e, index, 'masked_profile')}
                                        />
                                    </label>

                                    <FaTrash
                                        title="Delete"
                                        style={{ cursor: 'pointer', color: 'red' }}
                                        onClick={() => handleDeleteFile(Candidate.candidate_id, 'masked_profile')}
                                    />
                                    {/* {renderFileIcons(Candidate.candidate_id, "masked_profile")}</span> */}
                                </span>

                                <span className="files-row">
                                    {renderFileIcons(Candidate.candidate_id, "skill_mapping_attachment")}


                                    <label style={{ cursor: 'pointer', marginRight: '8px', marginLeft: '8px' }}>
                                        <FaEdit title="Edit" />

                                        <input
                                            type="file"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleFileChange(e, index, 'skill_mapping_attachment')}
                                        />

                                    </label>

                                    <FaTrash
                                        title="Delete"
                                        style={{ cursor: 'pointer', color: 'red' }}
                                        onClick={() => handleDeleteFile(Candidate.candidate_id, 'skill_mapping_attachment')}
                                    />
                                    {/* {renderFileIcons(Candidate.candidate_id, "skill_mapping_attachment")} */}
                                </span>
                            </div>

                        ))
                    ) : (
                        <p>No candidate found.</p>
                    )}
                </div>
            </div>
        </div >
    );
}
