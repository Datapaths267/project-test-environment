import React, { useEffect, useRef, useState } from 'react';
import Button from '../../components/button/Button';
import './Contacts.css';
import axios from 'axios';
import ContactForm from '../../components/forms/ContactForm';
import * as XLSX from "xlsx"; // Import SheetJS for Excel handling
import { FaDownload, FaEye, FaUpload, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from 'sweetalert2';

export default function Contacts() {
    const [contacts, setContacts] = useState([]);
    const [editedRows, setEditedRows] = useState(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filteredData, setFilteredData] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [showImageModal, setShowImageModal] = useState(false);
    const [imageStore, setImageStore] = useState([]);
    const fileInputRef = useRef(null); // Reference for hidden file input
    const [filters, setFilters] = useState({
        name: '',
        contact_type: '',
        status: ''
    });

    const token = localStorage.getItem("authToken");
    const companyId = localStorage.getItem("companyId");

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
        await Promise.all([fetchConfigData(), fetchContacts()]);
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

    const fetchContacts = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}contacts/contactsDetails`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                params: { companyId }
            });
            setContacts(response.data);
            setFilteredData(response.data);
        } catch (error) {
            console.error("Error fetching contacts:", error);
        }
    };

    const handleViewImage = async (contactId, fileType, action) => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}contacts/contactImage/${contactId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'json', // Set responseType to json for JSON response
                }
            );

            console.log("Documents Data:", response.data);

            // Ensure the requested file type exists
            if (!response.data || !response.data.contact_image) {
                toast.error("No document found for this file type.");
                return;
            }

            const fileEntry = response.data.contact_image;
            console.log("Raw File Data:", fileEntry.data);

            if (!fileEntry || !fileEntry.data || !Array.isArray(fileEntry.data)) {
                toast.error("Document not available.");
                return;
            }

            const fileBuffer = fileEntry.data;
            const mimeType = fileEntry.mimetype || "image/jpeg"; // Default to JPEG if no mimetype is found

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
                link.download = `contact_image.jpg`; // Customize the file name
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (action === "edit") {
                toast.info("Edit functionality is not implemented yet.");
            }

            // Release the object URL when done
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("File handling error:", error);
            toast.error(`Failed to ${action} file.`);
        }
    };


    const renderFileIcons = (contactId, fileType) => (
        <>
            <FaEye
                className="icon preview-icon"
                onClick={() => handleViewImage(contactId, fileType, "preview")}
                title="Preview File"
            />
        </>
    );


    const handleFilterChange = (e) => {
        const { name, value } = e.target;

        // Update filter state
        const updatedFilters = { ...filters, [name]: value };
        setFilters(updatedFilters);

        // Apply filtering logic using the updated filters
        const filtered = contacts.filter((contact) => {
            const nameMatch = contact.name?.toLowerCase().includes(updatedFilters.name.toLowerCase());

            const typeMatch = updatedFilters.contact_type === "" || contact.contact_type === updatedFilters.contact_type;
            const statusMatch = updatedFilters.status === "" || contact.status === updatedFilters.status;

            return nameMatch && typeMatch && statusMatch;
        });

        setFilteredData(filtered);
    };

    // Trigger hidden file input when button is clicked
    const handleUploadClick = () => {
        const confirmed = window.confirm("Do you want to download the Excel format before uploading?");
        if (confirmed) {
            // Trigger download
            window.open(`${process.env.REACT_APP_API_URL}contacts/download-template`, "_blank");
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
            const response = await axios.post(`${process.env.REACT_APP_API_URL}contacts/upload-excel`, formData, {
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
            fetchContacts();
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error("Failed to upload file.");
        }
    };

    const handleDownloadExcel = () => {
        if (contacts.length === 0) {
            toast.info("No contacts available to download.");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(contacts);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "contacts");
        XLSX.writeFile(wb, "contacts_details.xlsx");
    };

    const handleCheckboxChange = (customerId) => {
        setSelectedRows((prevSelected) => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(customerId)) {
                newSelected.delete(customerId);
            } else {
                newSelected.add(customerId);
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
                customerIds.map(async (contact_id) => {
                    await axios.delete(
                        `${process.env.REACT_APP_API_URL}contacts/${contact_id}/deleteContacts`,
                        {
                            headers: {
                                "Authorization": `Bearer ${token}`,
                                "Content-Type": "application/json"
                            }
                        }
                    );
                })
            );

            console.log("Deleted Customers:", customerIds);
            toast.success("Customers deleted successfully!");

            // Refresh customer list after deletion
            fetchContacts();
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
        const contact_id = filteredData[rowIndex]?.contact_id;

        console.log("========== File Upload Triggered ==========");
        console.log(`Row Index: ${rowIndex}`);
        console.log(`Field Name: ${fieldName}`);
        console.log("Selected Files:", files);
        console.log("Candidate ID:", contact_id);

        const updatedData = [...imageStore];

        if (!updatedData[rowIndex]) {
            updatedData[rowIndex] = {};
        }

        updatedData[rowIndex][fieldName] = files;
        setImageStore(updatedData);

        // Now pass contact_id to uploadFiles
        uploadFiles(updatedData, contact_id);
    };


    const uploadFiles = async (updatedData, contact_id) => {
        if (!contact_id) {
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
                                console.warn(`⚠️ Skipped non-File value at ${fieldName}:`, file);
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
                `${process.env.REACT_APP_API_URL}contacts/updateFiles/${contact_id}`,
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
        const updatedRows = Array.from(editedRows).map((index) => filteredData[index]);

        try {
            for (const row of updatedRows) {
                const formData = new FormData();

                // Append contact fields
                for (const key in row) {
                    formData.append(key, row[key]);
                }

                // Append the files for the specific fields if they exist
                if (row.detailed_profile) {
                    formData.append("detailed_profile", row.detailed_profile);
                }
                if (row.masked_profile) {
                    formData.append("masked_profile", row.masked_profile);
                }
                if (row.skill_mapping_attachment) {
                    formData.append("skill_mapping_attachment", row.skill_mapping_attachment);
                }

                console.log("FormData for row:");
                for (let pair of formData.entries()) {
                    console.log(pair[0] + ':', pair[1]);
                }

                await axios.post(
                    `${process.env.REACT_APP_API_URL}contacts/updateContacts`,
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

    const handleDeleteImageModal = (e, index, contact_id) => {
        e.stopPropagation(); // Prevent triggering the row click event

        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to delete this image?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                handleDeleteImage(contact_id);
            }
        });
    };

    // Function to delete image
    const handleDeleteImage = async (contact_id) => {
        try {
            const response = await axios.delete(
                `${process.env.REACT_APP_API_URL}contacts/deleteContactImage/${contact_id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            console.log("Delete Image Response:", response.data);
            if (response.status === 200 || response.status === 204) {
                toast.success("Image deleted successfully!");
                fetchContacts(); // Refresh contacts after deletion
            } else {
                toast.error("Failed to delete image.");
            }
        } catch (error) {
            console.error("Error deleting image:", error);
            toast.error("Failed to delete image.");
        }
    };

    return (
        <div className='contact-container'>
            <h1>Contacts</h1>
            <Button className='add-contact-btn' onClick={() => setShowForm(true)}>Add Contact</Button>
            {/* Upload Excel Button */}
            <Button className="upload-contact-btn" onClick={handleUploadClick}>
                <FaUpload /> Upload Contacts
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
                <FaDownload /> Download Contact
            </Button>

            <Button
                className="delete-contact-btn"
                onClick={handleDeleteSelected}
                disabled={selectedRows.size === 0}
            >
                <FaTrash />  Delete Contact
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
                    name="name"
                    placeholder="Search by Name"
                    value={filters.name}
                    onChange={handleFilterChange}
                    className="filter-input"
                />

                <select
                    name="contact_type"
                    value={filters.contact_type}
                    onChange={handleFilterChange}
                    className="filter-select"
                >
                    <option value="">select Contact Types</option>
                    {options.contact_type.map((s, index) => (
                        <option key={index} value={s.value}>{s.value}</option>
                    ))}
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

                <Button onClick={() => {
                    setFilters({
                        name: '',
                        contact_type: '',
                        status: ''
                    });
                    setFilteredData(contacts);
                }}>
                    Clear Filters
                </Button>
            </div>

            {showForm && (
                <div className="modal show d-block">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Contact Form</h5>
                                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
                            </div>
                            <div className="modal-body">
                                <ContactForm onClose={() => { setShowForm(false); fetchContacts(); }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Modal */}
            {showImageModal && (
                <div className="modal show d-block image-popup-modal">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Profile Image</h5>
                                <button type="button" className="btn-close" onClick={() => setShowImageModal(false)}></button>
                            </div>
                            <div className="modal-body text-center">
                                <img src={selectedImage} alt="Profile" className="viewable-image" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className='contact-table-container'>
                <div className='contact-table-structure'>
                    <div className='Contact-table-headers'>
                        {["Select", "Profile-image", "Contact ID", "Name", "Call Name", "Contact Type", "Mobile Number", "Email ID", "Status", "Role", "Address", "Notes"]
                            .map((header, index) => (
                                <span key={index}>{header}</span>
                            ))
                        }
                    </div>


                    {filteredData.length > 0 ? (
                        filteredData.map((contact, index) => (
                            <div key={index} className="contact-row">
                                <span>
                                    <input
                                        type="checkbox"
                                        onChange={() => handleCheckboxChange(contact.contact_id)}
                                        checked={selectedRows.has(contact.contact_id)}
                                    />

                                </span>

                                <span className="action-icons">
                                    {renderFileIcons(contact.contact_id, "contact_image")}
                                    <label style={{ cursor: 'pointer', marginRight: '8px', marginLeft: '8px' }}>
                                        <FaEdit title="Edit" />
                                        <input
                                            type="file"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleFileChange(e, index, 'contact_image')}
                                        />
                                    </label>

                                    <FaTrash
                                        title="Delete"
                                        style={{ cursor: 'pointer', color: 'red' }}
                                        onClick={(e) => handleDeleteImageModal(e, index, contact.contact_id)}
                                    />
                                </span>

                                <span>
                                    {contact.contact_id}
                                </span>


                                <span className='contact_name'> <input style={{
                                    color: ' rgb(24, 172, 231) ',
                                    borderColor: 'blue'
                                }} value={contact.name} onChange={(e) =>
                                    handleEdit(index, "name", e.target.value)} />
                                </span>


                                <span className='contact_name'><input style={{
                                    color: ' rgb(24, 172, 231) ',
                                    borderColor: 'blue'
                                }} value={contact.call_name} onChange={(e) =>
                                    handleEdit(index, "call_name", e.target.value)} />
                                </span>

                                <span>

                                    <select
                                        value={contact.contact_type || ''}
                                        onChange={(e) => handleEdit(index, "contact_type", e.target.value)}
                                        className="filter-select"
                                    >
                                        {/* Always show the current value as the first option */}
                                        {contact.contact_type && !options.contact_type.find(s => s.id === contact.contact_type) && (
                                            <option value={contact.contact_type}>
                                                {contact.contact_type}
                                            </option>
                                        )}

                                        {/* Render all available options */}
                                        {options.contact_type.map((s, index) => (
                                            <option key={index} value={s.contact_type}>
                                                {s.value}
                                            </option>
                                        ))}
                                    </select>
                                </span>

                                <span>
                                    <input value={contact.mobile_number} onChange={(e) =>
                                        handleEdit(index, "mobile_number", e.target.value)} />
                                </span>

                                <span>
                                    <input value={contact.email} onChange={(e) =>
                                        handleEdit(index, "email", e.target.value)} />
                                </span>

                                <span >
                                    {/* <input value={contact.status} onChange={(e) =>
                                        handleEdit(index, "status", e.target.value)} /> */}
                                    <select
                                        value={contact.status || ''}
                                        onChange={(e) =>
                                            handleEdit(index, "status", e.target.value)}
                                        className="filter-select"
                                        id={contact.status === 'active' ? 'active' : 'not_active'}
                                    >
                                        {contact.status && !options.status.find(s => s.id === contact.status) && (
                                            <option value={contact.status}>
                                                {contact.status}
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

                                <span>
                                    <input value={contact.role} onChange={(e) =>
                                        handleEdit(index, "role", e.target.value)} />
                                </span>

                                <span>
                                    <input value={contact.address} onChange={(e) =>
                                        handleEdit(index, "address", e.target.value)} />
                                </span>

                                <span>
                                    <input value={contact.notes} onChange={(e) =>
                                        handleEdit(index, "notes", e.target.value)} />
                                </span>

                            </div>
                        ))
                    ) : (
                        <p>No contacts found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
