import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import './adminpage.css';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import CompanyForm from "../../forms/CompanyForm";
import Button from "../../button/Button";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaDownload, FaEye } from "react-icons/fa";

export default function Adminpage() {
  const [companies, setCompanies] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showForm, setShowForm] = useState(false);

  const getData = useCallback(async (attempt = 1) => {
    const token = localStorage.getItem("authToken");
    const companyId = localStorage.getItem("companyId");
    const country = localStorage.getItem("country");
    try {
      console.log("Fetching company data... Attempt", attempt);
      sessionStorage.removeItem("companyData");

      const response = await axios.get(`${process.env.REACT_APP_API_URL}api/company/content`, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
        params: { companyId, country }  // 🔹 Send companyId in request
      });
      setCompanies(response.data);
      sessionStorage.setItem("companyData", JSON.stringify(response.data));
    } catch (error) {
      if (attempt < 3) {
        setTimeout(() => getData(attempt + 1), 1000);
      } else {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch companies.");
      }
    }
  }, []);

  useEffect(() => {
    getData();
  }, [getData]);


  const country = localStorage.getItem("country");
  const token = localStorage.getItem("authToken");

  const handleFileAction = async (companyId, fileType, action) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}api/company/${companyId}/documents`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { companyId, country },
        }
      );

      console.log("Documents Data:", response.data);

      if (!Array.isArray(response.data) || response.data.length === 0) {
        toast.error("No documents found.");
        return;
      }

      const documentData = response.data[0]; // ✅ Ensure it's an array before accessing

      // ✅ Check if fileType exists and has a valid data buffer
      const fileEntry = documentData[fileType];
      if (!fileEntry || !fileEntry.data || !Array.isArray(fileEntry.data)) {
        toast.error("Document not available.");
        return;
      }

      const fileBuffer = fileEntry.data;
      const mimeType = fileEntry.mimetype || "application/pdf"; // ✅ Support other file types

      console.log("Documents Data Test 2:", fileBuffer);

      const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
      const url = URL.createObjectURL(blob);

      console.log("Generated Blob URL:", url);

      if (action === "preview") {
        window.open(url, "_blank");
        // ❌ Do not revoke URL immediately for preview
      } else if (action === "download") {
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileType}.${mimeType.split("/")[1] || "pdf"}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // ✅ Revoke URL only after download
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("File handling error:", error);
      toast.error(`Failed to ${action} file.`);
    }
  };

  const renderFileIcons = (companyId, fileType) => (
    <span className="file-icons">
      <FaEye
        className="icon preview-icon"
        onClick={() => handleFileAction(companyId, fileType, "preview")}
        title="Preview File"
      />
      <FaDownload
        className="icon download-icon"
        onClick={() => handleFileAction(companyId, fileType, "download")}
        title="Download File"
      />
    </span>
  );


  const handleCheckboxChange = (companyId) => {
    setSelectedRows((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(companyId)) {
        newSelection.delete(companyId);
      } else {
        newSelection.add(companyId);
      }
      return newSelection;
    });
  };

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(
        [...selectedRows].map((companyId) =>
          axios.delete(`${process.env.REACT_APP_API_URL}api/${companyId}/delete`)
        )
      );
      toast.success("Selected companies deleted successfully.");
      setSelectedRows(new Set());
      getData();
    } catch (error) {
      console.error("Error deleting companies:", error);
      toast.error("Failed to delete selected companies.");
    }
  };


  return (
    <div className="ListofCompany-container">
      <h2>About us</h2>
      <Button className="add-company-btn" onClick={() => setShowForm(true)}>Add Company</Button>
      <Button className="del-company-btn" onClick={handleDeleteSelected} disabled={selectedRows.size === 0}>Delete Company</Button>
      {showForm && (
        <div className="modal show d-block">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Company Form</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
              </div>
              <div className="modal-body">
                <CompanyForm onClose={() => { setShowForm(false); getData(); }} />
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="company-details-container">
        <div className="company-table-container">
          <div className="company-details-rows">
            <div className="grid-header">
              {[
                "Select", "Company ID", "Company Name", "Company Type", "Series", "Registration Type", "Locations", "Countries", "Status", "Services Offered", "Date of Registration", "Multi Location", "Documents", "Case Studies", "Profile Deck", "Attachments"
              ].map((header, index) => (
                <span key={index}>{String(header)}</span>
              ))}
            </div>
            {companies.map((company) => (
              <div key={company.company_id} className="grid-row">
                <span><input type="checkbox" onChange={() => handleCheckboxChange(company.company_id)} checked={selectedRows.has(company.company_id)} /></span>
                <span>{company.company_id}</span>
                <span className="company_name">{company.company_name}</span>
                <span>{company.company_type}</span>
                <span>{company.company_series}</span>
                <span>{company.registration_type}</span>
                <span>{company.locations_presence}</span>
                <span>{company.countries}</span>
                <span className={company.status === "Active" ? "active" : "inactive"}>{company.status}</span>
                <span>{company.services_offer}</span>
                <span>{new Date(company.date_of_registration).toISOString().split('T')[0]}</span>
                <span>{company.multi_location ? "Yes" : "No"}</span>
                <span className="files-row">{renderFileIcons(company.company_id, "documents")}</span>
                <span className="files-row">{renderFileIcons(company.company_id, "case_studies")}</span>
                <span className="files-row">{renderFileIcons(company.company_id, "profile_deck")}</span>
                <span className="files-row">{renderFileIcons(company.company_id, "attachments")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
