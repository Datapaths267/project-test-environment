import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Button from "../button/Button";

export default function CandidateTrackerForm({ onClose }) {
  const token = localStorage.getItem("authToken");
  const companyId = localStorage.getItem("companyId");

  const [formData, setFormData] = useState({
    company_id: companyId,
    req_id: "",
    client_id: "",
    poc_id: "",
    date_of_submission: "",
    candidate_name: "",
    contact_number: "",
    mail_id: "",
    current_company: "",
    skill: "",
    total_exp: "",
    re_exp: "",
    ctc: "",
    ectc: "",
    notice_period: "",
    status: "",
    detailed_profile: null,
    masked_profile: null,
    work_mode: "",
    notes: "",
    skill_mapping_attachment: null,
    skill_mapping_notes: "",
    skill_mapping_rating: "",
  });

  const [customerCompany, setCustomerCompany] = useState([]);
  const [contactPOC, setContactPOC] = useState([]);
  const [requirementreqID, setRequirementreqID] = useState([]);

  useEffect(() => {
    if (companyId) {
      fetchCustomerCompany();
      fetchCustomerPOC();
      fetchReqID()
    }
  }, [companyId]);

  const fetchCustomerCompany = async (e) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}customer/customerCompany`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { companyId }
        }
      );
      setCustomerCompany(response.data)

      // toast.success("Contact added successfully!", { position: "top-center", autoClose: 3000 });
      console.log("Success:", response.data);
    } catch (error) {
      console.error("Error:", error);
      // toast.error("Error registering contact form", { position: "top-center", autoClose: 3000 });
    }
  }

  const fetchCustomerPOC = async (e) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}contacts/contactsPOC`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { companyId }
        }
      );
      setContactPOC(response.data)

      // toast.success("Contact added successfully!", { position: "top-center", autoClose: 3000 });
      console.log("Success:", response.data);
    } catch (error) {
      console.error("Error:", error);
      // toast.error("Error registering contact form", { position: "top-center", autoClose: 3000 });
    }
  }


  const fetchReqID = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}requirementTracker/getRequirements`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { companyId },
        }
      );
      console.log("Requirements Fetched:", response.data);
      setRequirementreqID(response.data);
    } catch (error) {
      console.error("Error fetching requirements:", error.response?.data || error.message);
      toast.error("Failed to load requirements", { position: "top-center", autoClose: 3000 });
    }
  };


  // Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "skill_mapping_rating" ? parseFloat(value) || "" : value,
    });
  };

  // Handle file input changes
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData({ ...formData, [name]: files[0] }); // Store the first selected file
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("formData : " + formData)
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) data.append(key, value);
    });
    for (let pair of data.entries()) {
      console.log(pair[0] + ": " + pair[1]);
    }

    try {
      const submit_response = await axios.post(
        `${process.env.REACT_APP_API_URL}candidateTracker/addCandidate`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Candidate added successfully!", {
        position: "top-center",
        autoClose: 3000,
        onClose: () => onClose && onClose(),
      });

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error submitting Candidate form", { position: "top-center", autoClose: 3000 });
    }
  };


  return (
    <div className="container mt-4">
      <form onSubmit={handleSubmit} encType="multipart/form-data" className="g-3">
        {/* Client ID */}
        <div className="mb-3">
          <label className="form-label">Company Name</label>
          <select
            className="form-select"
            name="client_id"  // Ensure it matches the state key
            value={formData.client_id} // Correct state key
            onChange={handleChange}
            required
          >
            <option value="">Select</option>
            {customerCompany.map((customer) => (
              <option key={customer.customer_id} value={customer.customer_id}>
                {customer.customer_name}
              </option>
            ))}
          </select>
        </div>

        {/* POC ID */}
        <div className="mb-3">
          <label className="form-label">POC Name</label>
          <select
            className="form-select"
            name="poc_id"  // Ensure it matches the state key
            value={formData.poc_id} // Correct state key
            onChange={handleChange}
            required
          >
            <option value="">Select</option>
            {contactPOC.map((poc) => (
              <option key={poc.contact_id} value={poc.contact_id}>
                {poc.call_name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Requirement </label>
          <select
            className="form-select"
            name="req_id"  // Ensure it matches the state key
            value={formData.req_id} // Correct state key
            onChange={handleChange}
            required
          >
            <option value="">Select</option>
            {requirementreqID.map((requirement) => (
              <option key={requirement.req_id} value={requirement.req_id}>
                {requirement.requirement}
              </option>
            ))}
          </select>
        </div>

        {/* Account Manager */}
        <div className="mb-3">
          <label className="form-label">Date of submission</label>
          <input type="date" className="form-control" name="date_of_submission" value={formData.date_of_submission} onChange={handleChange} required />
        </div>

        {/* Year */}
        <div className="mb-3">
          <label className="form-label">Candidate Name</label>
          <input type="text" className="form-control" name="candidate_name" value={formData.candidate_name} onChange={handleChange} />
        </div>

        {/* Month */}
        <div className="mb-3">
          <label className="form-label">Contact Number</label>
          <input type="text" className="form-control" name="contact_number" value={formData.contact_number} onChange={handleChange} />
        </div>

        {/* Region */}
        <div className="mb-3">
          <label className="form-label">Mail ID</label>
          <input type="text" className="form-control" name="mail_id" value={formData.mail_id} onChange={handleChange} />
        </div>

        {/* Requirement Date */}
        <div className="mb-3">
          <label className="form-label">Current Company</label>
          <input type="text" className="form-control" name="current_company" value={formData.current_company} onChange={handleChange} />
        </div>

        {/* Requirement */}
        <div className="mb-3">
          <label className="form-label">Candidate Skill</label>
          <input className="form-control" name="skill" value={formData.skill} onChange={handleChange} />
        </div>

        {/* Tech Skills */}
        <div className="mb-3">
          <label className="form-label">Candidate Experience</label>
          <input type="number" className="form-control" name="total_exp" value={formData.total_exp} onChange={handleChange} />
        </div>

        {/* Hiring Type */}
        <div className="mb-3">
          <label className="form-label">Require Experience</label>
          <input type="number" className="form-control" name="re_exp" value={formData.re_exp} onChange={handleChange} />
        </div>

        {/* Number of Positions */}
        <div className="mb-3">
          <label className="form-label">Current CTC</label>
          <input type="number" className="form-control" name="ctc" value={formData.ctc} onChange={handleChange} />
        </div>

        {/* Experience */}
        <div className="mb-3">
          <label className="form-label">Expecting CTC</label>
          <input type="number" className="form-control" name="ectc" value={formData.ectc} onChange={handleChange} />
        </div>

        {/* location */}

        <div className="mb-3">
          <label className="form-label">Notice Period</label>
          <select className="form-select" name="notice_period" value={formData.notice_period} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="Imediate Join">Imediate Join</option>
            <option value="15 Days">15 Days</option>
            <option value="30 Days">30 Days</option>
            <option value="30 Days">60 Days</option>
            <option value="30 Days">90 Days</option>
          </select>
        </div>

        {/* Mode */}
        <div className="mb-3">
          <label className="form-label">Current Working Mode</label>
          <select className="form-select" name="work_mode" value={formData.work_mode} onChange={handleChange} required>
            <option value="">Select</option>
            <option value="Onsite">Onsite</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        {/* Recruiter */}


        <div className="mb-3">
          <label className="form-label">About candidate shortly</label>
          <input type="text" className="form-control" name="notes" value={formData.notes} onChange={handleChange} />
        </div>

        {/* Detailed Attachment (File Upload) */}
        <div className="mb-3">
          <label className="form-label">Detailed Profile</label>
          <input type="file" className="form-control" name="detailed_profile" accept=".pdf,.doc,.docx" onChange={handleFileChange} required />
        </div>

        {/* Key Skills JD (File Upload) */}
        <div className="mb-3">
          <label className="form-label">Masked Profile</label>
          <input type="file" className="form-control" name="masked_profile" accept=".pdf,.doc,.docx" onChange={handleFileChange} required />
        </div>

        <div className="mb-3">
          <label className="form-label">Skill Mapping</label>
          <input type="file" className="form-control" name="skill_mapping_attachment" accept=".pdf,.doc,.docx" onChange={handleFileChange} required />
        </div>

        <div className="mb-3">
          <label className="form-label">Skill Mapping Notes</label>
          <input type="text" className="form-control" name="skill_mapping_notes" value={formData.skill_mapping_notes} onChange={handleChange} />
        </div>


        <div className="mb-3">
          <label className="form-label">Skill Mapping Rating</label>
          <input
            type="number"
            className="form-control"
            name="skill_mapping_rating"
            value={formData.skill_mapping_rating}
            onChange={handleChange}
            step="0.1"
          />

        </div>

        <div className="mb-3">
          <label className="form-label">Status</label>
          <input type="text" className="form-control" name="status" value={formData.status} onChange={handleChange} />
        </div>

        <div className="text-center">
          <Button type="submit" className="candidate_submit_btn">Submit</Button>
        </div>

      </form>
      <ToastContainer />
    </div>
  );
}
