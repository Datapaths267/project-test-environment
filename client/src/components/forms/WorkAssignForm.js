import React from "react";
import { useEffect, useState } from "react";
import './WorkAssignForm.css';
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function WorkAssignForm({ onClose, onSubmit, addemployeeid }) {
  const [countries, setCountries] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  useEffect(() => {
    axios
      .get(process.env.REACT_APP_API_URL + "api/countryAll")
      .then((response) => setCountries(response.data))
      .catch((error) => console.error("Error fetching countries:", error));
  }, []);

  const fetchCompaniesByCountry = async (country) => {
    if (!country) return;
    try {
      const response = await axios.get(
        process.env.REACT_APP_API_URL + `api/companiesbycounty/${country}`
      );
      setCompanies(response.data);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const handleCountryChange = (e) => {
    const selected = e.target.value;
    setSelectedCountry(selected);
    setSelectedCompanies([]);

    // Find the selected country's ID and store it
    const selectedCountryObj = countries.find(country => country.name === selected);
    if (selectedCountryObj) {
      setSelectedCountryId(selectedCountryObj.id);
    }

    fetchCompaniesByCountry(selected);
  };


  const handleCompanyChange = (e) => {
    const company = e.target.value;
    setSelectedCompanies((prev) =>
      prev.includes(company)
        ? prev.filter((item) => item !== company)
        : [...prev, company]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Selected Employee ID:", addemployeeid);  // Log the employee ID for backend
    console.log("Selected Employee country ID:", selectedCountryId);
    try {
      console.log("Selected Employee id :", addemployeeid);
      console.log("Selected Employee country :", selectedCountryId);
      console.log("Selected Employee companies :", selectedCompanies);
      const response = await axios.post(
        process.env.REACT_APP_API_URL + "api/assignCompanies", // Backend endpoint
        {
          employee_id: addemployeeid, // Send empid to server
          country: selectedCountryId,
          companies: selectedCompanies,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Selected Employee country and id is entered into try ");

      if (response.status === 200 || response.status === 201) {
        toast.success("Companies assigned successfully!");
        onSubmit(response.data); // Pass data to parent if needed
        onClose();
      } else {
        toast.error("Failed to assign companies. Try again.");
      }
    } catch (error) {
      console.error("Error assigning companies:", error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  return (
    <>
      <div className="modal fade show" id="assignCompanyModal" style={{ display: "flex" }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Assign Companies to Country</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Employee ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={addemployeeid}  // Employee ID field, hidden from user
                    readOnly // Ensure it's not editable by the user
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Select Country</label>
                  <select
                    className="form-control"
                    value={selectedCountry}
                    onChange={handleCountryChange}
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.name} onChange={() => { setSelectedCountryId(country.id) }}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCountry && (
                  <div className="mb-3">
                    <label className="form-label">Select Companies</label>
                    <div>
                      {companies.map((company) => (
                        <div key={company.com_id}>
                          <input
                            type="checkbox"
                            value={company.com_id}
                            checked={selectedCompanies.includes(company.com_id)}
                            onChange={handleCompanyChange}
                          />
                          {company.com_name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" id="workassignsubmit_btn">
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

