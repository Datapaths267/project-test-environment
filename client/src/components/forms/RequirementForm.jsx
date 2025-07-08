import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RequirementForm({ onClose }) {
    const token = localStorage.getItem("authToken");
    const companyId = localStorage.getItem("companyId");
    const employeeId = localStorage.getItem("employeeId");
    const designation = localStorage.getItem("designation");

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        company_id: companyId,
        client_id: "",
        poc_id: "",
        account_manager: "",
        year: "",
        month: "",
        region: "",
        req_date: "",
        category: "",
        requirement: "",
        status: "",
        tech_skill: "",
        hire_type: "",
        number_of_positions: "",
        experience: "",
        location: "",
        mode: "",
        ctc_budget: "",
        recruiter_id: "",
        detailed_attachment: null,
        key_skills_jd: null,
    });

    const [customerCompany, setCustomerCompany] = useState([]);
    const [contactPOC, setContactPOC] = useState([]);
    const [recruiter, setRecruiter] = useState([]);
    const [accountManager, setAccountManager] = useState([]);

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
        await Promise.all([fetchConfigData(), fetchCustomerCompany(),
        fetchCustomerPOC(),
        getData(),])
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

    // Handle text input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
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
                `${process.env.REACT_APP_API_URL}requirementTracker/addRequirement`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            toast.success("Requirement added successfully!", {
                position: "top-center",
                autoClose: 3000,
                onClose: () => onClose && onClose(),
            });

        } catch (error) {
            console.error("Error:", error);
            toast.error("Error submitting requirement form", { position: "top-center", autoClose: 3000 });
        }
    };


    return (
        <div className="container mt-4">
            <form onSubmit={handleSubmit} className="g-3">
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
                {/* CATEGORY */}
                <div className="mb-3">
                    <label className="form-label">Category</label>
                    <input type="text" className="form-control" name="category" value={formData.category} onChange={handleChange} />
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

                {/* Account Manager */}
                <div className="mb-3">
                    <label className="form-label">Account Manager</label>

                    <select className="form-select" name="account_manager" value={formData.account_manager} onChange={handleChange} >
                        <option value="">Select</option>
                        {accountManager.map((item) => (
                            <option key={item.employee_id} value={item.employee_name}>{item.employee_name}</option>
                        ))}
                    </select>

                </div>

                {/* Year */}
                <div className="mb-3">
                    <label className="form-label">Year</label>
                    <input type="number" className="form-control" name="year" value={formData.year} onChange={handleChange} />
                </div>

                {/* Month */}
                <div className="mb-3">
                    <label className="form-label">Month</label>
                    <input type="text" className="form-control" name="month" value={formData.month} onChange={handleChange} />
                </div>

                {/* Region */}
                <div className="mb-3">
                    <label className="form-label">Region</label>
                    <input type="text" className="form-control" name="region" value={formData.region} onChange={handleChange} />
                </div>

                {/* Requirement Date */}
                <div className="mb-3">
                    <label className="form-label">Requirement Date</label>
                    <input type="date" className="form-control" name="req_date" value={formData.req_date} onChange={handleChange} />
                </div>

                {/* Requirement */}
                <div className="mb-3">
                    <label className="form-label">Requirement</label>
                    <textarea className="form-control" name="requirement" value={formData.requirement} onChange={handleChange} required></textarea>
                </div>

                {/* status */}
                <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select className="form-select" name="status" value={formData.status} onChange={handleChange} >
                        <option value="">Select Status</option>
                        {options.req_status.map((s, index) => (
                            <option key={index} value={s.value}>{s.value}</option>
                        ))}
                        {/* <option value="">Select</option>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                        <option value="In Progress">In Progress</option> */}
                    </select>
                </div>

                {/* Tech Skills */}
                <div className="mb-3">
                    <label className="form-label">Technical Skills</label>
                    <textarea className="form-control" name="tech_skill" value={formData.tech_skill} onChange={handleChange}></textarea>
                </div>

                {/* Hiring Type */}
                <div className="mb-3">
                    <label className="form-label">Hiring Type</label>
                    <select className="form-select" name="hire_type" value={formData.hire_type} onChange={handleChange} >
                        <option value="">Select</option>
                        <option value="FTE">FTE</option>
                        <option value="PTE">PTE</option>
                        <option value="CW">CW</option>
                        <option value="TW">TW</option>
                    </select>
                </div>

                {/* Number of Positions */}
                <div className="mb-3">
                    <label className="form-label">Number of Positions</label>
                    <input type="number" className="form-control" name="number_of_positions" value={formData.number_of_positions} onChange={handleChange} />
                </div>

                {/* Experience */}
                <div className="mb-3">
                    <label className="form-label">Experience</label>
                    <input type="number" className="form-control" name="experience" value={formData.experience} onChange={handleChange} />
                </div>

                {/* location */}
                <div className="mb-3">
                    <label className="form-label">Location</label>
                    <input type="text" className="form-control" name="location" value={formData.location} onChange={handleChange} />
                </div>

                {/* Mode */}
                <div className="mb-3">
                    <label className="form-label">Mode</label>
                    <select className="form-select" name="mode" value={formData.mode} onChange={handleChange} required>
                        <option value="">Select</option>
                        {options.work_mode.map((s, index) => (
                            <option key={index} value={s.value}>{s.value}</option>
                        ))}
                        {/* <option value="Onsite">Onsite</option>
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option> */}
                    </select>
                </div>

                {/* CTC Budget */}
                <div className="mb-3">
                    <label className="form-label">CTC Budget</label>
                    <input type="number" className="form-control" name="ctc_budget" value={formData.ctc_budget} onChange={handleChange} />
                </div>

                {/* Recruiter */}
                <div className="mb-3">
                    <label className="form-label">Recruiter</label>
                    <select className="form-select" name="recruiter_id" value={formData.recruiter_id} onChange={handleChange} >
                        <option value="">Select</option>
                        {recruiter.map((item) => (
                            <option key={item.employee_id} value={item.employee_id}>{item.employee_name}</option>
                        ))}
                    </select>
                </div>

                {/* Detailed Attachment (File Upload) */}
                <div className="mb-3">
                    <label className="form-label">Detailed Attachment</label>
                    <input type="file" className="form-control" name="detailed_attachment" accept=".pdf,.doc,.docx" onChange={handleFileChange} required />
                </div>

                {/* Key Skills JD (File Upload) */}
                <div className="mb-3">
                    <label className="form-label">Key Skills JD</label>
                    <input type="file" className="form-control" name="key_skills_jd" accept=".pdf,.doc,.docx" onChange={handleFileChange} required />
                </div>

                <div className="text-center">
                    <button type="submit" className="btn btn-primary">Submit</button>
                </div>
            </form>
            <ToastContainer />
        </div>
    );
}
