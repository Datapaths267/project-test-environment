import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './loEmployee.css';
import Button from "../../button/Button";
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import EmployeeForm from '../../forms/EmployeeForm';
import SalaryPaidForm from '../../forms/SalaryPaidForm';
import { FaDownload, FaEye, FaUpload, FaEdit, FaTrash } from "react-icons/fa";
import * as XLSX from "xlsx"; // Import SheetJS for Excel handling
import { useRef } from 'react';

export default function LOEmployee() {
  const [employees, setEmployees] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showForm, setShowForm] = useState(false);
  const [showSalaryPayForm, setShowSalaryPayForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentUploadEmployee, setCurrentUploadEmployee] = useState(null);
  const [uploadType, setUploadType] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentProfilePic, setCurrentProfilePic] = useState('');
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [currentDocuments, setCurrentDocuments] = useState([]);
  const [currentEmployeeId, setCurrentEmployeeId] = useState(null);
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null); // Reference for hidden file input

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
    designation: [],
    employee_relationship: [],
    employee_status: []
  });

  const token = localStorage.getItem("authToken");
  const companyId = localStorage.getItem("companyId");
  const navigate = useNavigate();

  useEffect(() => {
    if (companyId) {
      loadInitialData();
    }
  }, [companyId]);

  const loadInitialData = async () => {
    setLoading(true);
    await fetchConfigData();
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

  useEffect(() => {
    getData();
  }, [countryFilter, designationFilter, statusFilter]);

  const getData = async () => {
    const token = localStorage.getItem("authToken");
    const companyId = localStorage.getItem("companyId");
    const country = localStorage.getItem("country");
    try {
      const response = await axios.get(process.env.REACT_APP_API_URL + 'api/employeeList', {
        headers: {
          "Authorization": `Bearer ${token}`
        },
        params: { companyId, country, countryFilter, designationFilter, statusFilter }
      });

      const employeesWithFullUrls = response.data.map(employee => ({
        ...employee,
        profile_picture: employee.profile_picture
          ? `${process.env.REACT_APP_API_URL}${employee.profile_picture}?${Date.now()}`
          : null,
        documents: employee.documents ? employee.documents.map(doc => ({
          ...doc,
          url: doc.url ? `${process.env.REACT_APP_API_URL}${doc.url}` : null
        })) : []
      }));

      setEmployees(employeesWithFullUrls);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleDeleteProfilePic = async (employeeId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}api/delete-profile-pic`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        },
        params: { employee_id: employeeId }
      });
      toast.success("Profile picture deleted successfully");
      getData();
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      toast.error("Failed to delete profile picture");
    }
  };

  const handleDeleteDocument = async (employeeId, documentIndex) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}api/delete-document`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`
        },
        data: {
          employee_id: employeeId,
          document_index: documentIndex
        }
      });
      toast.success("Document deleted successfully");
      getData();
      setShowDocumentsModal(false);
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleCheckboxChange = (employeeId) => {
    setSelectedRows(prevSelectedRows => {
      const newSelectedRows = new Set(prevSelectedRows);
      if (newSelectedRows.has(employeeId)) {
        newSelectedRows.delete(employeeId);
      } else {
        newSelectedRows.add(employeeId);
      }
      return newSelectedRows;
    });
  };

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(
        [...selectedRows].map(async (employee_id) => {
          await axios.delete(`${process.env.REACT_APP_API_URL}api/deleteEmployee`, {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("authToken")}`
            },
            params: { employee_id }
          });
        })
      );
      toast.success("Selected employees deleted successfully.");
      setSelectedRows(new Set());
      getData();
    } catch (error) {
      console.error("Error deleting employees:", error);
      toast.error("Failed to delete selected employees.");
    }
  };

  const handleCellChange = (employeeId, field, value) => {
    const updatedEmployees = employees.map(employee => {
      if (employee.employee_id === employeeId) {
        return { ...employee, [field]: value };
      }
      return employee;
    });
    setEmployees(updatedEmployees);
  };

  const handleSaveChanges = async () => {
    try {
      const updatedEmployeesData = employees.map(employee => {
        const { employee_id, employee_name, employee_working_company, employee_designation,
          work_type, employee_ctc, employee_gender, employee_status, relationship_type,
          employee_username, employee_password, employee_email, employee_mobile_number,
          employee_leaving_date } = employee;
        return {
          employee_id,
          employee_name,
          employee_working_company,
          employee_designation,
          work_type,
          employee_ctc,
          employee_gender,
          employee_status,
          relationship_type,
          employee_username,
          employee_password,
          employee_email,
          employee_mobile_number,
          employee_leaving_date
        };
      });

      await Promise.all(
        updatedEmployeesData.map(async (employeeData) => {
          await axios.put(`${process.env.REACT_APP_API_URL}api/updateEmployee`, employeeData, {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("authToken")}`
            }
          });
        })
      );

      toast.success("Employee data saved successfully.");
      getData();
    } catch (error) {
      console.error("Error saving employee data:", error);
      toast.error("Failed to save employee data.");
    }
  };

  const handleViewProfilePic = (imageUrl) => {
    setCurrentProfilePic(`${imageUrl.split('?')[0]}?${Date.now()}`);
    setShowProfileModal(true);
  };

  const handleUploadProfilePic = (employeeId) => {
    setCurrentUploadEmployee(employeeId);
    setUploadType('profile');
    setShowUploadModal(true);
  };

  const handleViewDocuments = (employeeId) => {
    const employee = employees.find(e => e.employee_id === employeeId);
    setCurrentDocuments(employee.documents || []);
    setCurrentEmployeeId(employeeId);
    setShowDocumentsModal(true);
  };

  const handleUploadDocuments = (employeeId) => {
    setCurrentUploadEmployee(employeeId);
    setUploadType('documents');
    setShowUploadModal(true);
  };

  const handleFileChange = (e) => {
    setFilesToUpload(Array.from(e.target.files));
  };

  const handleFileUpload = async () => {
    if (!filesToUpload.length) return;

    try {
      const formData = new FormData();
      const endpoint = uploadType === 'profile'
        ? 'api/upload-profile-pic'
        : 'api/upload-documents';

      filesToUpload.forEach(file => {
        const fieldName = uploadType === 'profile' ? 'profile_picture' : 'documents';
        formData.append(fieldName, file);
      });
      formData.append('employee_id', currentUploadEmployee);

      await axios.post(
        `${process.env.REACT_APP_API_URL}${endpoint}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );

      toast.success(`${uploadType === 'profile' ? 'Profile picture' : 'Documents'} uploaded successfully!`);
      setShowUploadModal(false);
      setFilesToUpload([]);
      getData();
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error(`Failed to upload ${uploadType === 'profile' ? 'profile picture' : 'documents'}`);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const searchText = searchTerm.toLowerCase();
    const matchesSearchTerm = (
      employee.employee_name?.toLowerCase().includes(searchText) ||
      employee.employee_email?.toLowerCase().includes(searchText) ||
      employee.employee_id?.toString().includes(searchText) ||
      employee.employee_mobile_number?.includes(searchText)
    );
    const matchesFilters = (
      (countryFilter ? employee.employee_country === countryFilter : true) &&
      (designationFilter ? employee.employee_designation === designationFilter : true) &&
      (statusFilter ? employee.employee_status === statusFilter : true)
    );
    return matchesSearchTerm && matchesFilters;
  });

  // Trigger hidden file input when button is clicked
  const handleUploadClick = () => {
    const confirmed = window.confirm("Do you want to download the Excel format before uploading?");
    if (confirmed) {
      // Trigger download
      window.open(`${process.env.REACT_APP_API_URL}api/download-template-for-employee`, "_blank");
    } else {
      fileInputRef.current.click();
    }
  };

  const handlexslFileUpload = async (event) => {
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
      let allSuccessful = true;

      console.log("Sending request to upload employee Excel file...");
      console.log("form data:", formData);
      const response = await axios.post(`${process.env.REACT_APP_API_URL}api/upload-employee-excel`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Company-ID": companyId // Pass it in headers if backend expects it
        },
        params: { companyId } // Also passing in params
      });

      if (!response.data.success) {
        allSuccessful = false;
      }

      console.log("Upload Response:", response.data);
      if (allSuccessful) {
        toast.success("Employee added successfully!");
        getData();
      } else {
        toast.error("Failed to insert Employee.");
      }
      // fetchContacts();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file.");
    }
  };

  const handleDownloadExcel = () => {
    if (employees.length === 0) {
      toast.info("No employees available to download.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(employees);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "employees");
    XLSX.writeFile(wb, "employees_details.xlsx");
  };

  return (
    <div className='ListofEmployee-container'>
      <h2>List of Employee</h2>

      <div className="filters-container">
        <input
          type="text"
          placeholder="Search by name, email, ID..."
          className="filter-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select className="filter-select" onChange={(e) => setCountryFilter(e.target.value)} value={countryFilter}>
          <option value="">Select Country</option>
          <option value="USA">USA</option>
          <option value="India">India</option>
          <option value="UK">UK</option>
        </select>

        <select className="filter-select" onChange={(e) => setDesignationFilter(e.target.value)} value={designationFilter}>
          <option value="">Select Designation</option>
          {options.designation.map((d, index) => (
            <option key={index} value={d.designation}>{d.value}</option>
          ))}
        </select>

        <select className="filter-select" onChange={(e) => setStatusFilter(e.target.value)} value={statusFilter}>
          <option value="">Select Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Resigned">Resigned</option>
        </select>
      </div>

      <div className="buttons-container">
        <Button className="add-employee-btn" onClick={() => setShowForm(true)}>Add Employee</Button>
        <Button className="del-employee-btn" onClick={handleDeleteSelected} disabled={selectedRows.size === 0}>Delete Employee</Button>
        {/* Upload Excel Button */}
        <Button className="upload-contact-btn" onClick={handleUploadClick}>
          <FaUpload /> Upload Employee List
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }} // Hidden input field
          accept=".xlsx, .xls"
          onChange={handlexslFileUpload}
        />

        {/* Download Excel Button */}
        <Button className="download-contact-btn" onClick={handleDownloadExcel}>
          <FaDownload /> Download Employee List
        </Button>
        <Button className="save-btn" onClick={handleSaveChanges}>Save Changes</Button>
      </div>

      {showSalaryPayForm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Salary Payment Form</h5>
                <button type="button" className="btn-close" onClick={() => setShowSalaryPayForm(false)}></button>
              </div>
              <div className="modal-body">
                <SalaryPaidForm onClose={() => { setShowSalaryPayForm(false); getData(); }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Employee Form</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <div className="modal-body">
                <EmployeeForm onClose={() => { setShowForm(false); getData(); }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Profile Picture</h5>
                <button type="button" className="btn-close" onClick={() => setShowProfileModal(false)}></button>
              </div>
              <div className="modal-body text-center">
                <img
                  src={currentProfilePic}
                  alt="Profile"
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '';
                    e.target.alt = 'Image not available';
                  }}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowProfileModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDocumentsModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Employee Documents</h5>
                <button type="button" className="btn-close" onClick={() => setShowDocumentsModal(false)}></button>
              </div>
              <div className="modal-body">
                {currentDocuments.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Document Name</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentDocuments.map((doc, index) => (
                          <tr key={index}>
                            <td>{doc.name || `Document ${index + 1}`}</td>
                            <td>
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-primary me-2"
                              >
                                View
                              </a>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this document?')) {
                                    handleDeleteDocument(currentEmployeeId, index);
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No documents available for this employee</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDocumentsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Upload {uploadType === 'profile' ? 'Profile Picture' : 'Documents'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowUploadModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">
                    Select {uploadType === 'profile' ? 'an image' : 'files'} to upload
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    accept={uploadType === 'profile' ? 'image/*' : '*'}
                    multiple={uploadType === 'documents'}
                    onChange={handleFileChange}
                  />
                </div>
                {filesToUpload.length > 0 && (
                  <div className="mb-3">
                    <h6>Files to upload:</h6>
                    <ul className="list-group">
                      {filesToUpload.map((file, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                          {file.name}
                          <span className="badge bg-primary rounded-pill">
                            {(file.size / 1024).toFixed(2)} KB
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowUploadModal(false);
                    setFilesToUpload([]);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleFileUpload}
                  disabled={filesToUpload.length === 0}
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='employee-grid-container'>
        <div className='employee-details'>
          <div className='employee-grid-header'>
            <span> </span>
            <span>Country</span>
            <span>Emp ID</span>
            <span>Emp Name</span>
            <span>Company</span>
            <span>Date Of Join</span>
            <span>Designation</span>
            <span>Type</span>
            <span>CTC</span>
            <span>Gender</span>
            <span>Status</span>
            <span>Leaving Date</span>
            <span>Relationship</span>
            <span>Username</span>
            <span>Password</span>
            <span>Email</span>
            <span>Mobile Number</span>
            <span>Profile</span>
            <span>Documents</span>
          </div>

          {filteredEmployees.map(employee => (
            <div
              key={employee.employee_id}
              className={`employee-grid-row ${selectedRows.has(employee.employee_id) ? 'selected-row' : ''}`}
            >
              <span>
                <input
                  type='checkbox'
                  onChange={() => handleCheckboxChange(employee.employee_id)}
                  checked={selectedRows.has(employee.employee_id)}
                />
              </span>
              <span>{employee.employee_country}</span>
              <span>{employee.employee_id}</span>
              <span
                className='emp_name'
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleCellChange(employee.employee_id, 'employee_name', e.target.innerText)}
              >
                {employee.employee_name}
              </span>
              <span
                className='emp_company'
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleCellChange(employee.employee_id, 'employee_working_company', e.target.innerText)}
              >
                {employee.employee_working_company}
              </span>
              <span>{employee.employee_doj ? new Date(employee.employee_doj).toISOString().split('T')[0] : 'N/A'}</span>
              <span>
                <select
                  value={employee.employee_designation || ""}
                  onChange={(e) => handleCellChange(employee.employee_id, "employee_designation", e.target.value)}
                  style={{ border: "none", background: "transparent", width: "100%", cursor: "pointer" }}
                >
                  {employee.employee_designation && !options.designation.find(d => d.designation === employee.employee_designation) && (
                    <option value={employee.employee_designation}>
                      {employee.employee_designation}
                    </option>
                  )}
                  <option value="">Select Designation</option>
                  {options.designation.map((d, index) => (
                    <option key={index} value={d.designation}>
                      {d.value}
                    </option>
                  ))}
                </select>
              </span>
              <span
                className='emp_working_type'
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleCellChange(employee.employee_id, 'work_type', e.target.innerText)}
              >
                {employee.work_type}
              </span>
              <span
                className='emp_ctc'
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleCellChange(employee.employee_id, 'employee_ctc', e.target.innerText)}
              >
                {employee.employee_ctc}
              </span>
              <span>{employee.employee_gender}</span>
              <span className={`status-${employee.employee_status.toLowerCase()}`}>
                <select
                  value={employee.employee_status}
                  onChange={(e) => handleCellChange(employee.employee_id, 'employee_status', e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'inherit',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  {employee.employee_status && !options.employee_status.find(l => l.id === employee.employee_status) && (
                    <option value={employee.employee_status}>
                      {employee.employee_status}
                    </option>
                  )}
                  <option value="">Select Level</option>
                  {options.employee_status.map((l, index) => (
                    <option key={index} value={l.employee_status}>
                      {l.value}
                    </option>
                  ))}
                </select>
              </span>
              <span
                contentEditable={employee.employee_status !== 'Active'}
                suppressContentEditableWarning
                onBlur={(e) => {
                  const newValue = e.target.innerText.trim();
                  handleCellChange(
                    employee.employee_id,
                    'employee_leaving_date',
                    newValue === "" ? null : newValue
                  );
                }}
                style={{
                  cursor: employee.employee_status !== 'Active' ? 'text' : 'default',
                  backgroundColor: employee.employee_status !== 'Active' ? 'inherit' : '#f5f5f5'
                }}
              >
                {employee.employee_status === 'Active' ? '' :
                  (employee.employee_leaving_date ? employee.employee_leaving_date.split('T')[0] : "Still working")}
              </span>
              <span>
                <select
                  value={employee.relationship_type || ""}
                  onChange={(e) => handleCellChange(employee.employee_id, "relationship_type", e.target.value)}
                  style={{ border: "none", background: "transparent", width: "100%", cursor: "pointer" }}
                >
                  {employee.relationship_type && !options.employee_relationship.find(l => l.id === employee.relationship_type) && (
                    <option value={employee.relationship_type}>
                      {employee.relationship_type}
                    </option>
                  )}
                  <option value="">Select Level</option>
                  {options.employee_relationship.map((l, index) => (
                    <option key={index} value={l.employee_relationship}>
                      {l.value}
                    </option>
                  ))}
                </select>
              </span>
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleCellChange(employee.employee_id, 'employee_username', e.target.innerText)}
              >
                {employee.employee_username}
              </span>
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleCellChange(employee.employee_id, 'employee_password', e.target.innerText)}
              >
                {employee.employee_password}
              </span>
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleCellChange(employee.employee_id, 'employee_email', e.target.innerText)}
              >
                {employee.employee_email}
              </span>
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleCellChange(employee.employee_id, 'employee_mobile_number', e.target.innerText)}
              >
                {employee.employee_mobile_number}
              </span>
              <span className="profile-pic-cell">
                {employee.profile_picture ? (
                  <div className="profile-pic-actions">
                    <button
                      className="view-btn"
                      onClick={() => handleViewProfilePic(employee.profile_picture)}
                    >
                      View
                    </button>
                    <button
                      className="delete-pic-btn"
                      onClick={() => handleDeleteProfilePic(employee.employee_id)}
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <button
                    className="upload-btn"
                    onClick={() => handleUploadProfilePic(employee.employee_id)}
                  >
                    Upload
                  </button>
                )}
              </span>
              <span className="documents-cell">
                {employee.documents?.length > 0 ? (
                  <div className="documents-container">
                    <span className="badge bg-secondary">
                      {employee.documents.length} docs
                    </span>
                    <button
                      className="btn btn-sm btn-outline-primary ms-2"
                      onClick={() => handleViewDocuments(employee.employee_id)}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary ms-1"
                      onClick={() => handleUploadDocuments(employee.employee_id)}
                    >
                      Add More
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleUploadDocuments(employee.employee_id)}
                  >
                    Upload
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
{/*import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './loEmployee.css';
import Button from "../../button/Button";
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import EmployeeForm from '../../forms/EmployeeForm';
import SalaryPaidForm from '../../forms/SalaryPaidForm';

export default function LOEmployee() {
  const [employees, setEmployees] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showForm, setShowForm] = useState(false);
  const [showSalaryPayForm, setShowSalaryPayForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getData();
  }, [countryFilter, designationFilter, statusFilter]);

  const getData = async () => {
    const token = localStorage.getItem("authToken");
    const companyId = localStorage.getItem("companyId");
    const country = localStorage.getItem("country");
    await axios.get(process.env.REACT_APP_API_URL + 'api/employeeList', {
      headers: {
        "Authorization": `Bearer ${token}`
      },
      params: { companyId, country, countryFilter, designationFilter, statusFilter }
    })
      .then(response => setEmployees(response.data))
      .catch(error => console.error('Error fetching data:', error));
  };

  const handleCheckboxChange = (employeeId) => {
    setSelectedRows(prevSelectedRows => {
      const newSelectedRows = new Set(prevSelectedRows);
      if (newSelectedRows.has(employeeId)) {
        newSelectedRows.delete(employeeId);
      } else {
        newSelectedRows.add(employeeId);
      }
      return newSelectedRows;
    });
  };

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(
        [...selectedRows].map(async (employee_id) => {
          await axios.delete(`${process.env.REACT_APP_API_URL}api/deleteEmployee`, { params: { employee_id } });
        })
      );
      toast.success("Selected employees deleted successfully.");
      setSelectedRows(new Set());
      getData();
    } catch (error) {
      console.error("Error deleting employees:", error);
      toast.error("Failed to delete selected employees.");
    }
  };

  const handleCellChange = (employeeId, field, value) => {
    const updatedEmployees = employees.map(employee => {
      if (employee.employee_id === employeeId) {
        return { ...employee, [field]: value };
      }
      return employee;
    });
    setEmployees(updatedEmployees);
  };

  const handleSaveChanges = async () => {
    try {
      const updatedEmployeesData = employees.map(employee => {
        const { employee_id, employee_name, employee_working_company, employee_designation, work_type, employee_ctc, employee_gender, employee_status, relationship_type, employee_username, employee_password, employee_email, employee_mobile_number, employee_leaving_date } = employee;
        return {
          employee_id,
          employee_name,
          employee_working_company,
          employee_designation,
          work_type,
          employee_ctc,
          employee_gender,
          employee_status,
          relationship_type,
          employee_username,
          employee_password,
          employee_email,
          employee_mobile_number,
          employee_leaving_date
        };
      });

      await Promise.all(
        updatedEmployeesData.map(async (employeeData) => {
          await axios.put(`${process.env.REACT_APP_API_URL}api/updateEmployee`, employeeData);
        })
      );

      toast.success("Employee data saved successfully.");
      getData();

    } catch (error) {
      console.error("Error saving employee data:", error);
      toast.error("Failed to save employee data.");
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const searchText = searchTerm.toLowerCase();
    const matchesSearchTerm = (
      employee.employee_name.toLowerCase().includes(searchText) ||
      employee.employee_email.toLowerCase().includes(searchText) ||
      employee.employee_id.toString().includes(searchText) ||
      employee.employee_mobile_number.includes(searchText)
    );
    const matchesFilters = (
      (countryFilter ? employee.employee_country === countryFilter : true) &&
      (designationFilter ? employee.employee_designation === designationFilter : true) &&
      (statusFilter ? employee.employee_status === statusFilter : true)
    );
    return matchesSearchTerm && matchesFilters;
  });

  return (
    <div className='ListofEmployee-container'>
      <h2>List of Employee</h2>


      <div className="filters-container">
        <input
          type="text"
          placeholder="Search by name, email, ID..."
          className="filter-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select className="filter-select" onChange={(e) => setCountryFilter(e.target.value)} value={countryFilter}>
          <option value="">Select Country</option>
          <option value="USA">USA</option>
          <option value="India">India</option>
          <option value="UK">UK</option>
        </select>

        <select className="filter-select" onChange={(e) => setDesignationFilter(e.target.value)} value={designationFilter}>
          <option value="">Select Designation</option>
          <option value="Senior Director">Senior Director</option>
          <option value="Director">Director</option>
          <option value="Finance Admin">Finance Admin</option>
          <option value="HR Admin">HR Admin</option>
          <option value="Recruiter">Recruiter</option>
          <option value="Account manager">Account manager</option>
          <option value="Sales Director">Sales Director</option>
          <option value="Sales Manager">Sales Manager</option>
          <option value="Talent Acquisition">Talent Acquisition</option>
          <option value="Recruiters">Recruiters</option>
          <option value="Account Manager">Account Manager</option>
        </select>

        <select className="filter-select" onChange={(e) => setStatusFilter(e.target.value)} value={statusFilter}>
          <option value="">Select Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="buttons-container">

        <Button className="add-employee-btn" onClick={() => setShowForm(true)}>Add Employee</Button>
        <Button className="del-employee-btn" onClick={handleDeleteSelected} disabled={selectedRows.size === 0}>Delete Employee</Button>
        <Button className="sal-details-btn" onClick={() => navigate("/dashboard/salary-details")}>Employee Salary Details</Button>
        <Button className="add-employee-btn" onClick={() => setShowSalaryPayForm(true)}>Employee Salary Generation</Button>
        <Button className="upload-excel-btn" >Upload Employee Via Excel</Button>
        <Button className="save-btn" onClick={handleSaveChanges}>Save Changes</Button>

      </div>

      {showSalaryPayForm && (
        <div className="modal show d-block">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Company Form</h5>
                <button type="button" className="btn-close" onClick={() => setShowSalaryPayForm(false)}></button>
              </div>
              <div className="modal-body">
                <SalaryPaidForm onClose={() => { setShowSalaryPayForm(false); getData(); }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal show d-block">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Company Form</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <div className="modal-body">
                <EmployeeForm onClose={() => { setShowForm(false); getData(); }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='employee-details'>
        <div className='employee-grid-header'>
          <span> </span>
          <span>Country</span>
          <span>Emp ID</span>
          <span>Emp Name</span>
          <span>Company</span>
          <span>Date Of Join</span>
          <span>Designation</span>
          <span>Type</span>
          <span>CTC</span>
          <span>Gender</span>
          <span>Status</span>
          <span>Leaving Date</span>
          <span>Relationship</span>
          <span>Username</span>
          <span>Password</span>
          <span>Email</span>
          <span>Mobile Number</span>
        </div>

        {filteredEmployees.map(employee => (
          <div
            key={employee.employee_id}
            className={`employee-grid-row ${selectedRows.has(employee.employee_id) ? 'selected-row' : ''}`}
          >
            <span>
              <input
                type='checkbox'
                onChange={() => handleCheckboxChange(employee.employee_id)}
                checked={selectedRows.has(employee.employee_id)}
              />
            </span>
            <span>{employee.employee_country}</span>
            <span>{employee.employee_id}</span>
            <span
              className='emp_name'
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleCellChange(employee.employee_id, 'employee_name', e.target.innerText)}
            >
              {employee.employee_name}
            </span>
            <span
              className='emp_company'
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleCellChange(employee.employee_id, 'employee_working_company', e.target.innerText)}
            >
              {employee.employee_working_company}
            </span>
            <span>{employee.employee_doj ? new Date(employee.employee_doj).toISOString().split('T')[0] : 'N/A'}</span>
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleCellChange(employee.employee_id, 'employee_designation', e.target.innerText)}
            >
              {employee.employee_designation}
            </span>
            <span
              className='emp_working_type'
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleCellChange(employee.employee_id, 'work_type', e.target.innerText)}
            >
              {employee.work_type}
            </span>
            <span
              className='emp_ctc'
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleCellChange(employee.employee_id, 'employee_ctc', e.target.innerText)}
            >
              {employee.employee_ctc}
            </span>
            <span>{employee.employee_gender}</span>
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleCellChange(employee.employee_id, 'employee_status', e.target.innerText)}
            >
              {employee.employee_status}
            </span>
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const newValue = e.target.innerText.trim();
                handleCellChange(
                  employee.employee_id,
                  'employee_leaving_date',
                  newValue === "Still working" ? null : newValue
                );
              }}
            >
              {employee.employee_leaving_date ? employee.employee_leaving_date.split('T')[0] : "Still working"}
            </span>
            <span>{employee.relationship_type}</span>
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleCellChange(employee.employee_id, 'employee_username', e.target.innerText)}
            >
              {employee.employee_username}
            </span>
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleCellChange(employee.employee_id, 'employee_password', e.target.innerText)}
            >
              {employee.employee_password}
            </span>
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleCellChange(employee.employee_id, 'employee_email', e.target.innerText)}
            >
              {employee.employee_email}
            </span>
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleCellChange(employee.employee_id, 'employee_mobile_number', e.target.innerText)}
            >
              {employee.employee_mobile_number}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
*/}












{/*import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './loEmployee.css';
import Button from "../../button/Button";
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom'; // ✅ Added for routing
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import EmployeeForm from '../../forms/EmployeeForm';

export default function LOEmployee() {
  const [employees, setEmployees] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate(); // ✅ Added

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    const token = localStorage.getItem("authToken");
    const companyId = localStorage.getItem("companyId");
    const country = localStorage.getItem("country");
    await axios.get(process.env.REACT_APP_API_URL + 'api/employeeList', {
      headers: {
        "Authorization": `Bearer ${token}`
      },
      params: { companyId, country }
    })
      .then(response => setEmployees(response.data))
      .catch(error => console.error('Error fetching data:', error));
  };

  const handleCheckboxChange = (employeeId) => {
    setSelectedRows(prevSelectedRows => {
      const newSelectedRows = new Set(prevSelectedRows);
      if (newSelectedRows.has(employeeId)) {
        newSelectedRows.delete(employeeId);
      } else {
        newSelectedRows.add(employeeId);
      }
      return newSelectedRows;
    });
  };

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(
        [...selectedRows].map(async (employee_id) => {
          await axios.delete(`${process.env.REACT_APP_API_URL}api/deleteEmployee`, { params: { employee_id } });
        })
      );
      toast.success("Selected employees deleted successfully.");
      setSelectedRows(new Set());
      getData();
    } catch (error) {
      console.error("Error deleting employees:", error);
      toast.error("Failed to delete selected employees.");
    }
  };

  return (
    <div className='ListofEmployee-container'>
      <h2>List of Employee</h2>
      <Button className="add-employee-btn" onClick={() => setShowForm(true)}>Add Employee</Button>
      <Button className="del-employee-btn" onClick={handleDeleteSelected} disabled={selectedRows.size === 0}>Delete Employee</Button>
      <Button className="sal-details-btn" onClick={() => navigate("/dashboard/salary-details")}>Employee Salary Details</Button>

      {showForm && (
        <div className="modal show d-block">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Company Form</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <div className="modal-body">
                <EmployeeForm onClose={() => { setShowForm(false); getData(); }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='employee-details'>
        <div className='employee-grid-header'>
          <span> </span>
          <span>Country</span>
          <span>Emp ID</span>
          <span>Emp Name</span>
          <span>Company</span>
          <span>Date Of Join</span>
          <span>Designation</span>
          <span>Type</span>
          <span>CTC</span>
          <span>Gender</span>
          <span>Status</span>
          <span>Leaving Date</span>
          <span>Relationship</span>
          <span>Username</span>
          <span>Password</span>
          <span>Email</span>
          <span>Mobile Number</span>
        </div>

        {employees.map(employee => (
          <div
            key={employee.employee_id}
            className={`employee-grid-row ${selectedRows.has(employee.employee_id) ? 'selected-row' : ''}`}
          >
            <span>
              <input
                type='checkbox'
                onChange={() => handleCheckboxChange(employee.employee_id)}
                checked={selectedRows.has(employee.employee_id)}
              />
            </span>
            <span>{employee.employee_country}</span>
            <span>{employee.employee_id}</span>
            <span className='emp_name'>{employee.employee_name}</span>
            <span className='emp_company'>{employee.employee_working_company}</span>
            <span>{new Date(employee.employee_doj).toLocaleDateString('en-GB')}</span>
            <span>{employee.employee_designation}</span>
            <span className='emp_working_type'>{employee.work_type}</span>
            <span className='emp_ctc'>{employee.employee_ctc}</span>
            <span>{employee.employee_gender}</span>
            <span className={employee.employee_status === 'Active' ? 'active' : 'inactive'}>
              {employee.employee_status}
            </span>
            <span>{employee.employee_lwd ? new Date(employee.employee_lwd).toLocaleDateString('en-GB') : "Still Working"}</span>
            <span>{employee.relationship_type}</span>
            <span>{employee.employee_username}</span>
            <span>{employee.employee_password}</span>
            <span className='emp_email'>{employee.employee_email}</span>
            <span>{employee.employee_mobile_number}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 
*/}