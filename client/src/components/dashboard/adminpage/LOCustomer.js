import React, { useState, useEffect, useRef } from "react";
import Button from "../../button/Button";
import './loCustomer.css';
import axios from "axios";
import ClientForm from '../../forms/ClientForm';
import * as XLSX from "xlsx"; // Import SheetJS for Excel handling
import { FaDownload, FaEye, FaUpload } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './loCustomer.css';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [filteredData, setFilteredData] = useState([]);
  const [editedRows, setEditedRows] = useState(new Set());
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null); // Reference for hidden file input

  useEffect(() => {
    fetchCustomers();
  }, []);

  const token = localStorage.getItem("authToken");
  const companyId = localStorage.getItem("companyId");
  const country = localStorage.getItem("country");
  const fetchCustomers = async () => {

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}customer/details`, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
        params: { companyId, country }
      });

      console.log("API Response:", response.data); // Debugging

      // Ensure response is an array
      setCustomers(Array.isArray(response.data) ? response.data : []);
      setFilteredData(response.data); // Set filtered data to the full customer list

    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]); // Prevent `.map()` crash
    }
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
        customerIds.map(async (customerId) => {
          await axios.delete(
            `${process.env.REACT_APP_API_URL}customer/${customerId}/deleteCustomer`,
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

      // Refresh customer list after deletion
      fetchCustomers();
      setSelectedRows(new Set());

    } catch (error) {
      console.error("Error deleting customers:", error);
      toast.error("Failed to delete customers. Please try again.");
    }
  };

  const handleFileAction = async (customerId, action) => {
    try {
      console.log("Fetching documents for Customer ID:", customerId);

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}customer/${customerId}/documents`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "json", // ✅ Ensure response is JSON if needed
        }
      );

      console.log("Received Response:", response.data);

      // ✅ Extract the buffer data from the response
      const documentData = response.data?.[0]?.documents?.data;

      if (!documentData || !Array.isArray(documentData)) {
        throw new Error("Invalid document data received.");
      }

      console.log("Extracted Document Buffer:", documentData);

      // ✅ Convert extracted data to Uint8Array and then Blob
      const byteArray = new Uint8Array(documentData);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      console.log("Generated Blob:", blob);

      // ✅ Create URL and handle actions
      const url = URL.createObjectURL(blob);

      if (action === "preview") {
        window.open(url, "_blank");
      } else if (action === "download") {
        const link = document.createElement("a");
        link.href = url;
        link.download = `document_${customerId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // ✅ Cleanup Blob URL after use
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error("File handling error:", error);
      toast.error(`Failed to ${action} file.`);
    }
  };


  // Render File Icons for Preview & Download
  const renderFileIcons = (customerId) => (
    <span className="file-icons">
      <FaEye
        className="icon preview-icon"
        onClick={() => handleFileAction(customerId, "preview")}
        title="Preview File"
      />
      <FaDownload
        className="icon download-icon"
        onClick={() => handleFileAction(customerId, "download")}
        title="Download File"
      />
    </span>
  );

  // Trigger hidden file input when button is clicked
  const handleUploadClick = () => {
    fileInputRef.current.click();
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
      const response = await axios.post(`${process.env.REACT_APP_API_URL}customer/upload`, formData, {
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
      fetchCustomers();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file.");
    }
  };

  const handleDownloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(customers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    XLSX.writeFile(wb, "customer_details.xlsx");
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

    if (updatedRows.length === 0) {
      toast.info("No changes to save.", { position: "top-center", autoClose: 3000 });
      return;
    }

    try {
      let allSuccessful = true;

      for (const row of updatedRows) {
        const formData = new FormData();

        for (const key in row) {
          formData.append(key, row[key]);
        }

        console.log("FormData for row:");
        for (let pair of formData.entries()) {
          console.log(pair[0] + ":", pair[1]);
        }

        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}customer/updateCustomer`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        console.log("Save Response:", response.data);

        if (response.status !== 201) {
          allSuccessful = false;
        }
      }

      if (allSuccessful) {
        toast.success("Changes saved successfully!", { position: "top-center", autoClose: 3000 });
      } else {
        toast.error("Some changes failed to save.", { position: "top-center", autoClose: 3000 });
      }

      fetchCustomers();
      setSelectedRows(new Set());
      setEditedRows(new Set());
      setIsSaving(false);

    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save some or all changes.", { position: "top-center", autoClose: 3000 });
    }
  };




  return (
    <div className="customer-list-container">
      <h2>Customer Details</h2>
      <Button className="add-customer-btn" onClick={() => setShowForm(true)}>
        Add Customer
      </Button>

      {/* Upload Excel Button */}
      <Button className="upload-customer-btn" onClick={handleUploadClick}>
        <FaUpload /> Upload Excel
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }} // Hidden input field
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
      />

      {/* Download Excel Button */}
      <Button className="download-customer-btn" onClick={handleDownloadExcel}>
        <FaDownload /> Download Excel
      </Button>

      <Button
        className="delete-customer-btn"
        onClick={handleDeleteSelected}
        disabled={selectedRows.size === 0}
      >
        Delete Customer
      </Button>
      <Button
        className="salary-save-Button"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>

      {showForm && (
        <div className="modal show d-block">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Customer Form</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <div className="modal-body">
                {/* Implement CustomerForm component separately */}
                {/* <CustomerForm onClose={() => { setShowForm(false); fetchCustomers(); }} /> */}
                <ClientForm onClose={() => { setShowForm(false); fetchCustomers(); }} ></ClientForm>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="customer-table-container">
        <div className="customer-details">
          <div className="grid-header">
            {[
              "Select", "Customer ID", "Customer Name", "Customer Type", "POC", "Account Manager", "Address",
              "NDA", "MSA", "Country", "Billing Currency", "Documents", "Contacts", "Status",
              "Agreement Type", "FTE_P", "Invoice Period", "Customer Rating", "Rate Flag", "Req Rating"
            ].map((header, index) => (
              <span key={index}>{header}</span>
            ))}
          </div>
          {filteredData.map((customer, index) => (
            <div key={index} className="grid-row">
              <span>
                <input type="checkbox" onChange={() => handleCheckboxChange(customer.customer_id)}
                  checked={selectedRows.has(customer.customer_id)} />
              </span>
              <span>{customer.customer_id}</span>
              <span className="customer_name">
                <input
                  value={customer.customer_name} onChange={(e) =>
                    handleEdit(index, "customer_name", e.target.value)} />
              </span>
              <span>
                <select
                  value={customer.customer_type}
                  onChange={(e) =>
                    handleEdit(index, "customer_type", e.target.value)}
                  className="filter-select"
                >
                  <option value={customer.customer_type}>{customer.customer_type}</option>
                  <option value="Customer">Customer</option>
                  <option value="Lead">Lead</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Channel Partner">Channel Partner</option>
                  <option value="Individual">Individual</option>

                </select>
              </span>

              <span>
                <input
                  value={customer.customer_side_poc} onChange={(e) =>
                    handleEdit(index, "customer_side_poc", e.target.value)} />
              </span>

              <span>
                <input
                  value={customer.account_manager_poc} onChange={(e) =>
                    handleEdit(index, "account_manager_poc", e.target.value)} />
              </span>

              <span>
                <input
                  value={customer.address} onChange={(e) =>
                    handleEdit(index, "address", e.target.value)} />
              </span>

              <span>
                <select
                  value={customer.nda_done}
                  onChange={(e) =>
                    handleEdit(index, "nda_done", e.target.value)}
                  className="filter-select"
                // id={customer.nda_done === 'true' ? 'active' : 'not_active'}
                >
                  <option value={customer.nda_done}>  {customer.nda_done ? "Yes" : "No"}</option>
                  <option value="ture">Yes</option>
                  <option value="false">No</option>
                </select>
              </span>

              <span>
                <select
                  value={customer.msa_done}
                  onChange={(e) =>
                    handleEdit(index, "msa_done", e.target.value)}
                  className="filter-select"
                >
                  <option value={customer.msa_done}>  {customer.msa_done ? "Yes" : "No"}</option>
                  <option value="ture">Yes</option>
                  <option value="false">No</option>
                </select>
              </span>

              <span>{customer.country}</span>

              <span>
                <select
                  value={customer.billing_currency}
                  onChange={(e) =>
                    handleEdit(index, "billing_currency", e.target.value)}
                  className="filter-select"
                >
                  <option value={customer.billing_currency}>  {customer.billing_currency}</option>
                  <option value="INR">₹ INR</option>   {/* India */}
                  <option value="USD">$ USD</option>   {/* USA */}
                  <option value="ZAR">R ZAR</option>   {/* South Africa */}
                  <option value="GBP">£ GBP</option>   {/* UK */}
                </select>
              </span>

              <span className="files-row">{renderFileIcons(customer.customer_id, "documents")}</span>

              <span>
                <input
                  value={customer.contacts} onChange={(e) =>
                    handleEdit(index, "contacts", e.target.value)} />
              </span>

              <span>
                <select
                  value={customer.status}
                  onChange={(e) =>
                    handleEdit(index, "status", e.target.value)}
                  className="filter-select"
                  id={customer.status === 'active' ? 'active' : 'not_active'}
                >
                  <option value={customer.status} > {customer.status}</option>
                  <option value="active">Active</option>
                  <option value="not active">Not Active</option>
                </select>
              </span>

              <span>
                <select
                  value={customer.agreement_type}
                  onChange={(e) =>
                    handleEdit(index, "agreement_type", e.target.value)}
                  className="filter-select"
                >
                  <option value={customer.agreement_type} > {customer.agreement_type}</option>
                  <option value="FTE">FTE</option>
                  <option value="C2H">C2H</option>
                  <option value="C2C">C2C</option>
                  <option value="All">All</option>
                </select>
              </span>

              <span>
                <input
                  value={customer.fte_percentage} onChange={(e) =>
                    handleEdit(index, "fte_percentage", e.target.value)} />
              </span>

              <span>
                <input
                  value={customer.invoice_period} onChange={(e) =>
                    handleEdit(index, "invoice_period", e.target.value)} />
              </span>

              <span>
                <select
                  value={customer.customer_rating}
                  onChange={(e) =>
                    handleEdit(index, "customer_rating", e.target.value)}
                  className="filter-select"
                >
                  <option value={customer.customer_rating} > {customer.customer_rating}</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </span>

              <span>
                <select
                  value={customer.rate_flag}
                  onChange={(e) =>
                    handleEdit(index, "rate_flag", e.target.value)}
                  className="filter-select"
                >
                  <option value={customer.rate_flag} > {customer.rate_flag}</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </span>

              <span>
                <select
                  value={customer.req_rating}
                  onChange={(e) =>
                    handleEdit(index, "req_rating", e.target.value)}
                  className="filter-select"
                >
                  <option value={customer.req_rating} > {customer.req_rating}</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Tough">Tough</option>

                </select>

              </span>

            </div>
          ))}

        </div>
      </div>
    </div>
  );
};

export default CustomerList;
