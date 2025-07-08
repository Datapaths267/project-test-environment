import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import './Requirement.css';
import Button from '../../components/button/Button';
import RequirementForm from '../../components/forms/RequirementForm';
import * as XLSX from "xlsx"; // Import SheetJS for Excel handling
import { FaDownload, FaEye, FaUpload, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from 'sweetalert2';

export default function RequirementTracker() {
    const [requirementTracker, setRequirementTracker] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [editedRows, setEditedRows] = useState(new Set());
    const [imageStore, setImageStore] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingData, setEditingData] = useState([]);
    const [filters, setFilters] = useState({
        client: '',
        startDate: '',
        endDate: '',
        status: ''
    });
    const [recruiter, setRecruiter] = useState([]);
    const [accountManager, setAccountManager] = useState([]);


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
        await Promise.all([fetchConfigData(), GetRequirementTracker(), getData()]);
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

    const getData = async () => {
        try {
            console.log("entered into employee details");
            const employeedata = await axios.get(`${process.env.REACT_APP_API_URL}api/getEmployeeDetails`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { companyId, Designation: 'Recruiter' }
            }

            );
            setRecruiter(employeedata.data)

            // toast.success("Contact added successfully!", { position: "top-center", autoClose: 3000 });
            console.log("recuireter:", employeedata.data);

            const accountManagerData = await axios.get(`${process.env.REACT_APP_API_URL}api/getEmployeeDetails`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { companyId, Designation: 'Account Manager' }
            }

            );
            setAccountManager(accountManagerData.data)

            // toast.success("Contact added successfully!", { position: "top-center", autoClose: 3000 });
            console.log("accountManagerData:", accountManagerData.data);

        } catch (error) {
            console.error("Error:", error);
            // toast.error("Error registering contact form", { position: "top-center", autoClose: 3000 });
        }
    };

    const GetRequirementTracker = async () => {
        try {
            console.log("Fetching requirement data...");
            console.log("employee ID:", employeeId);
            const response = await axios.get(`${process.env.REACT_APP_API_URL}requirementTracker/getRequirementTrackerContent`, {
                headers: { "Authorization": `Bearer ${token}` },
                params: { companyId, employeeId, designation }
            });
            console.log("Requirement Tracker Data:", response.data);
            setRequirementTracker(response.data);
            setEditingData(response.data);
        } catch (error) {
            console.error("Error fetching requirement data:", error);
        }
    };

    const handleViewImage = async (id, fileType, action) => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}requirementTracker/get-files/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { id },
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

    const renderFileIcons = (id, fileType) => (
        <>
            <FaEye
                className="icon preview-icon"
                onClick={() => handleViewImage(id, fileType, "preview")}
                title="Preview File"
            />
        </>
    );

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const updatedFilters = { ...filters, [name]: value };
        setFilters(updatedFilters);

        const filtered = requirementTracker.filter((contact) => {
            const clientMatch = contact.customer_name?.toLowerCase().includes(updatedFilters.client.toLowerCase());
            const statusMatch = updatedFilters.status === "" || contact.status === updatedFilters.status;
            const matchDate = handleDateFilter(contact, updatedFilters); // Pass here

            return clientMatch && matchDate && statusMatch;
        });

        setEditingData(filtered);
    };


    // Date filter function
    const handleDateFilter = (requirement, currentFilters) => {
        const { startDate, endDate } = currentFilters;

        if (!startDate && !endDate) {
            return true; // Skip filtering if both are empty
        }

        if (!startDate || !endDate) {

            return true;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const reqDate = new Date(requirement.req_date);

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        reqDate.setHours(0, 0, 0, 0);

        return reqDate >= start && reqDate <= end;
    };



    const handleUploadClick = () => {
        const confirmed = window.confirm("Do you want to download the Excel format before uploading?");
        if (confirmed) {
            window.open(`${process.env.REACT_APP_API_URL}requirementTracker/download-template`, "_blank");
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

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}requirementTracker/upload-excel`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Company-ID": companyId
                },
                params: { companyId }
            });

            if (response.data.success && response.data.insertedRows) {
                toast.success("Customers added successfully!");
            } else {
                toast.error("Failed to insert customers.");
            }
            GetRequirementTracker();
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error("Failed to upload file.");
        }
    };

    const handleDownloadExcel = () => {
        if (requirementTracker.length === 0) {
            toast.info("No requirements available to download.");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(requirementTracker);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "requirements");
        XLSX.writeFile(wb, "requirements.xlsx");
    };

    const handleCheckboxChange = (req_id) => {
        setSelectedRows((prevSelected) => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(req_id)) {
                newSelected.delete(req_id);
            } else {
                newSelected.add(req_id);
            }
            return newSelected;
        });
    };

    const handleDeleteSelected = async () => {
        if (selectedRows.size === 0) {
            toast.error("Please select at least one customer to delete.");
            return;
        }

        const customerIds = Array.from(selectedRows);

        try {
            await Promise.all(
                customerIds.map(async (req_id) => {
                    await axios.delete(
                        `${process.env.REACT_APP_API_URL}requirementTracker/${req_id}/deleteRequirement`,
                        {
                            headers: {
                                "Authorization": `Bearer ${token}`,
                                "Content-Type": "application/json"
                            }
                        }
                    );
                })
            );

            toast.success("Customers deleted successfully!");
            GetRequirementTracker();
            setSelectedRows(new Set());
        } catch (error) {
            console.error("Error deleting customers:", error);
            toast.error("Failed to delete customers. Please try again.");
        }
    };

    const handleEdit = (index, field, value) => {
        const updated = [...editingData];
        const row = { ...updated[index], [field]: value };
        console.log("Updated Row:", row); // Debugging
        updated[index] = row;
        setEditingData(updated);

        const newEdited = new Set(editedRows);
        newEdited.add(index);
        setEditedRows(newEdited);
        console.log("Edited Rows:", Array.from(newEdited)); // Debugging
    };

    const handleFileChange = (e, rowIndex, fieldName) => {
        const files = Array.from(e.target.files);
        const req_id = editingData[rowIndex]?.req_id;

        console.log("========== File Upload Triggered ==========");
        console.log(`Row Index: ${rowIndex}`);
        console.log(`Field Name: ${fieldName}`);
        console.log("Selected Files:", files);
        console.log("Candidate ID:", req_id);

        const updatedData = [...imageStore];

        if (!updatedData[rowIndex]) {
            updatedData[rowIndex] = {};
        }

        // 🔄 Update only the changed field
        updatedData[rowIndex][fieldName] = files;
        setImageStore(updatedData);

        // ✅ Only send the changed field and files
        uploadFiles(fieldName, files, req_id);
    };


    const uploadFiles = async (fieldName, files, req_id) => {
        if (!req_id) {
            console.error("❌ No candidate ID provided. Upload aborted.");
            return;
        }

        if (!Array.isArray(files)) {
            console.error("❌ files is not an array:", files);
            return;
        }

        const formData = new FormData();

        files.forEach((file) => {
            if (file instanceof File) {
                formData.append(fieldName, file);
            } else {
                console.warn(`⚠️ Skipped non-File value for ${fieldName}:`, file);
            }
        });

        // Debug print
        for (let pair of formData.entries()) {
            console.log(pair[0], pair[1]);
        }

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}requirementTracker/updateFiles/${req_id}`,
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
        } catch (error) {
            console.error("❌ Upload error:", error);
        }
    };


    const handleSave = async () => {
        const updatedRows = Array.from(editedRows).map((index) => editingData[index]);

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

                const response = await axios.post(
                    `${process.env.REACT_APP_API_URL}requirementTracker/updateRequirement`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data',
                        },
                    }
                );
                console.log("Save Response:", response.data);
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
            const response = await axios.post(`${process.env.REACT_APP_API_URL}requirementTracker/delete-file`, {
                req_id: reqId,
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
        <div className='Requirement-container'>
            <h1>Requirement Lists</h1>

            <Button className='add-requirement-btn' onClick={() => { setShowForm(true) }}> Add Requirements </Button>

            {/* Upload Excel Button */}
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
                <FaTrash /> Delete Requirement
            </Button>

            <Button
                className="salary-save-Button"
                onClick={handleSave}
                disabled={isSaving}
            >
                {isSaving ? "Saving..." : "Save Changes"}
            </Button>

            <div className="filters">
                <input
                    type="text"
                    name="client"
                    className="filter-input"
                    placeholder="Search by Client"
                    value={filters.client}
                    onChange={handleFilterChange}
                />

                <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="filter-select"
                >

                    <option value="">Select Status</option>
                    {options.req_status.map((s, index) => (
                        <option key={index} value={s.value}>{s.value}</option>
                    ))}
                </select>

                <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="filter-input"
                />
                <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="filter-input"
                />
                <Button className="clear-btn" onClick={() => {
                    setFilters({ client: '', startDate: '', endDate: '', status: '' });
                    setEditingData(requirementTracker);
                }}>
                    Clear Filters
                </Button>
            </div>

            {showForm && (
                <div className="modal show d-block">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Requirement Form</h5>
                                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
                            </div>
                            <div className="modal-body">
                                <RequirementForm onClose={() => { setShowForm(false); GetRequirementTracker(); }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className='requirement-table'>
                <div className='requirement-table-structure'>
                    <div className='requirement-table-header'>
                        {["Select", "Req ID", "Account Director", "Year", "Month", "Region", "Date", "Client", "Category", "POC", "Requirement",
                            "Status", "Technical Skill", "Hire Type", "Number of Positions", "Experience", "Location", "Work Mode",
                            "CTC Budget", "Recruiter", "Detailed Attachment", "Key Skills JD"]
                            .map((header, index) => (
                                <span key={index}> {header} </span>
                            ))}
                    </div>
                    {editingData.length > 0 ? (
                        editingData.map((requirement, index) => (
                            <div key={index} className='requirement-table-row'>
                                <span>
                                    <input
                                        type="checkbox"
                                        onChange={() => handleCheckboxChange(requirement.req_id)}
                                        checked={selectedRows.has(requirement.req_id)}
                                    />
                                </span>

                                <span>{requirement.req_id}
                                </span>

                                <span className='requirement-name'>
                                    <select
                                        style={{
                                            color: ' rgb(24, 172, 231) ',

                                        }}
                                        value={requirement.account_manager}
                                        onChange={(e) => handleEdit(index, "account_manager", e.target.value)}
                                        className="filter-select"
                                    >

                                        {requirement.account_manager && !options.req_status.find(s => s.id === requirement.account_manager) && (
                                            <option value={requirement.account_manager}>
                                                {requirement.account_manager}
                                            </option>
                                        )}

                                        <option value="">Select Below</option>
                                        {accountManager.map((item) => (
                                            <option key={item.employee_id} value={item.employee_name}>{item.employee_name}</option>
                                        ))}
                                    </select>
                                </span>

                                <span>
                                    <input value={requirement.year} onChange={(e) =>
                                        handleEdit(index, "year", e.target.value)} />
                                </span>

                                <span>
                                    <input value={requirement.month} onChange={(e) =>
                                        handleEdit(index, "month", e.target.value)} />
                                </span>

                                <span>
                                    <input value={requirement.region} onChange={(e) =>
                                        handleEdit(index, "region", e.target.value)} />
                                </span>

                                <span>
                                    <input value={new Date(requirement.req_date).toLocaleDateString('en-GB')} onChange={(e) =>
                                        handleEdit(index, "req_date", e.target.value)} />
                                </span>

                                <span className='requirement-name'>
                                    <input style={{
                                        color: ' rgb(24, 172, 231) ',
                                        borderColor: 'blue'
                                    }} value={requirement.customer_name} onChange={(e) =>
                                        handleEdit(index, "customer_name", e.target.value)} />
                                </span>


                                <span>
                                    <input value={requirement.category} onChange={(e) =>
                                        handleEdit(index, "category", e.target.value)} />
                                </span>

                                <span className='requirement-name'>
                                    <input style={{
                                        color: ' rgb(24, 172, 231) ',
                                        borderColor: 'blue'
                                    }} value={requirement.call_name} onChange={(e) =>
                                        handleEdit(index, "call_name", e.target.value)} />
                                </span>

                                <span>
                                    <input value={requirement.requirement} onChange={(e) =>
                                        handleEdit(index, "requirement", e.target.value)} />
                                </span>

                                <span>
                                    {/* <input value={requirement.status} onChange={(e) =>
                                        handleEdit(index, "status", e.target.value)} /> */}
                                    <select
                                        value={requirement.status}
                                        onChange={(e) => handleEdit(index, "status", e.target.value)}
                                        className="filter-select"
                                    >

                                        {requirement.status && !options.req_status.find(s => s.id === requirement.status) && (
                                            <option value={requirement.status}>
                                                {requirement.status}
                                            </option>
                                        )}
                                        <option value="">Select Status</option>
                                        {/* Render all available options */}
                                        {options.req_status.map((s, index) => (
                                            <option key={index} value={s.req_status}>
                                                {s.value}
                                            </option>
                                        ))}
                                    </select>
                                </span>

                                <span>
                                    <input value={requirement.tech_skill} onChange={(e) =>
                                        handleEdit(index, "tech_skill", e.target.value)} />
                                </span>

                                <span>
                                    <input value={requirement.hire_type} onChange={(e) =>
                                        handleEdit(index, "hire_type", e.target.value)} />
                                </span>

                                <span>
                                    <input value={requirement.number_of_positions} onChange={(e) =>
                                        handleEdit(index, "number_of_positions", e.target.value)} />
                                </span>

                                <span>
                                    <input value={requirement.experience} onChange={(e) =>
                                        handleEdit(index, "experience", e.target.value)} />
                                </span>

                                <span>
                                    <input value={requirement.location} onChange={(e) =>
                                        handleEdit(index, "location", e.target.value)} />
                                </span>

                                <span>
                                    <input value={requirement.mode} onChange={(e) =>
                                        handleEdit(index, "mode", e.target.value)} />
                                </span>

                                <span>
                                    <input value={requirement.ctc_budget} onChange={(e) =>
                                        handleEdit(index, "ctc_budget", e.target.value)} />
                                </span>

                                <span className='requirement-name'>

                                    <select
                                        style={{
                                            color: ' rgb(24, 172, 231) ',

                                        }}
                                        value={requirement.recruiter_id}
                                        onChange={(e) => handleEdit(index, "recruiter_id", e.target.value)}
                                        className="filter-select"
                                    >

                                        {requirement.recruiter && !options.req_status.find(s => s.id === requirement.recruiter) && (
                                            <option value={requirement.recruiter}>
                                                {requirement.recruiter}
                                            </option>
                                        )}

                                        <option value="">Select Below</option>
                                        {recruiter.map((item) => (
                                            <option key={item.employee_id} value={item.employee_id}>{item.employee_name}</option>
                                        ))}
                                    </select>

                                </span>


                                <span>
                                    {renderFileIcons(requirement.req_id, "detailed_attachment")}
                                    <label style={{ cursor: 'pointer', marginRight: '8px', marginLeft: '8px' }}>
                                        <FaEdit title="Edit" />
                                        <input
                                            type="file"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleFileChange(e, index, 'detailed_attachment')}
                                        />
                                    </label>

                                    <FaTrash
                                        title="Delete"
                                        style={{ cursor: 'pointer', color: 'red' }}
                                        onClick={() => handleDeleteFile(requirement.req_id, 'detailed_attachment')}
                                    />

                                </span>

                                <span>
                                    {renderFileIcons(requirement.req_id, "key_skills_jd")}
                                    <label style={{ cursor: 'pointer', marginRight: '8px', marginLeft: '8px' }}>
                                        <FaEdit title="Edit" />
                                        <input
                                            type="file"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleFileChange(e, index, 'key_skills_jd')}
                                        />
                                    </label>

                                    <FaTrash
                                        title="Delete"
                                        style={{ cursor: 'pointer', color: 'red' }}
                                        onClick={() => handleDeleteFile(requirement.req_id, 'key_skills_jd')}
                                    />
                                </span>
                            </div>
                        ))
                    ) : (<p>No Data Available</p>)}
                </div>
            </div>
        </div>
    );
}
