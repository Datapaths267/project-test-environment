import React from "react";
import { useEffect, useState } from "react";
import './EmployeeForm.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function EmployeeForm({ onClose }) {
  const token = localStorage.getItem("authToken"); // Retrieve auth token
  const companyId = localStorage.getItem("companyId");
  const companyName = localStorage.getItem("companyName"); // Extract selected customer IDs
  console.log("Stored Company Name:", localStorage.getItem("companyName"));
  console.log("Stored Company ID:", localStorage.getItem("companyId"));
  const [loading, setLoading] = useState(true);


  const [newEmployee, setNewEmployee] = useState({
    employee_name: '',
    employee_email: '',
    employee_mobile_number: '',
    employee_gender: '',
    employee_country: '',
    employee_city: '',
    employee_working_company: companyName || '',
    employee_DOJ: '',
    employee_designation: '',
    employee_status: '',
    work_type: '',
    relationship_type: '',
    employee_ctc: '',
    employee_username: '',
    employee_password: '',
    company_id: companyId || '',
    payment_done: 'NO',
    month: '',
    month_date: '',
    year: '',
    basic_salary: '',
    hra: '',
    pf: '',
    tds: '',
    advance_payback: '',
    remarks: '',
    conveyance_allowances: '',
    medical_reimbursement: '',

  });

  const [countries, setCountries] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [city, setCity] = useState([]);

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
    gender: [],
    employee_status: [],
    employee_relationship: [],
  });

  useEffect(() => {
    if (companyId) {
      loadInitialData();
    }
  }, [companyId]);

  const loadInitialData = async () => {
    setLoading(true);
    await Promise.all([fetchConfigData(), fetchData()]);
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


  const fetchData = async () => {
    try {
      const [countriesRes, designationsRes, companiesRes, citiesRes] = await Promise.all([
        axios.get(process.env.REACT_APP_API_URL + 'api/countryAll'),
        axios.get(process.env.REACT_APP_API_URL + 'api/designation'),
        axios.get(process.env.REACT_APP_API_URL + 'api/companies'),
        axios.get(process.env.REACT_APP_API_URL + 'api/city'),
      ]);

      setCountries(countriesRes.data);
      setDesignations(designationsRes.data);
      setCompanies(companiesRes.data);
      setCity(citiesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  useEffect(() => {
    if (newEmployee?.employee_DOJ) {
      const date = new Date(newEmployee.employee_DOJ);
      const monthNames = [
        "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"
      ];
      setNewEmployee((prev) => ({
        ...prev,
        month: monthNames[date.getMonth()],
        month_date: newEmployee.employee_DOJ,
        year: date.getFullYear().toString(),
      }));
    }
  }, [newEmployee.employee_DOJ]);



  const handleInputChange = (e) => {
    const { name, type, checked, value } = e.target;
    setNewEmployee((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedData = Object.keys(newEmployee).reduce((acc, key) => {
      acc[key] = typeof newEmployee[key] === "string" ? newEmployee[key].trim() : newEmployee[key];
      return acc;
    }, {});

    console.log("submitted data : " + trimmedData);

    try {
      await axios.post(process.env.REACT_APP_API_URL + 'api/addEmployee', trimmedData);
      toast.success("Employee added successfully!");
      onClose();
    } catch (error) {
      toast.error("Error adding employee. Please check input fields.");
    }
  };


  return (
    <>
      <div className="container mt-4">
        <form onSubmit={handleSubmit} className='emp_form'>
          <div className="mb-3">
            <label htmlFor="employee_name" className="form-label">Employee Name <span style={{ color: "red" }}>*</span></label>
            <input
              type="text"
              className="form-control"
              id="employee_name"
              name="employee_name"
              value={newEmployee.employee_name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Gender</label>
            <select name="employee_gender" className="form-control" value={newEmployee.employee_gender} onChange={handleInputChange}>
              <option value="">Select Gender</option>

              {options.gender.map((s, index) => (
                <option key={index} value={s.value}>{s.value}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Country</label>
            <select name="employee_country" className="form-control"
              value={newEmployee.employee_country} onChange={handleInputChange}
              disabled={countries.length === 0}>
              <option value="">Select Country</option>
              {options.country.map((s, index) => (
                <option key={index} value={s.value}>{s.value}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">City</label>
            {/* <select name="employee_city" className="form-control" value={newEmployee.employee_city} onChange={handleInputChange}>
              {city.map((item) => (
                <option key={item.com_id} value={item.com_city}>{item.com_city}</option>
              ))}
            </select> */}
            <input
              type="text"
              className="form-control"
              name="employee_city"
              value={newEmployee.employee_city}
              onChange={handleInputChange}
              placeholder="Enter City"
            />


          </div>
          {/* 
          <div className="mb-3">
            <label className="form-label">Working Company</label>
            <select name="employee_working_company" className="form-control" value={newEmployee.employee_working_company} onChange={handleInputChange}>
              <option value="">Select Company</option>
              {companies.map((item) => (

                <option key={item.company_id} value={item.company_name}>{item.company_name}</option>
              ))}
            </select>
          </div> */}

          <div className="mb-3">
            <label htmlFor="employee_DOJ" className="form-label">Date of Joining <span style={{ color: "red" }}>*</span></label>
            <input
              type="date"
              className="form-control"
              id="employee_DOJ"
              name="employee_DOJ"
              value={newEmployee.employee_DOJ}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Designation</label>
            <select name="employee_designation" className="form-control" value={newEmployee.employee_designation} onChange={handleInputChange}>
              <option value="">Select Designation</option>
              {options.designation.map((s, index) => (
                <option key={index} value={s.value}>{s.value}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Status</label>
            <select name="employee_status" className="form-control" value={newEmployee.employee_status} onChange={handleInputChange}>
              <option value="">Select Status</option>
              {options.employee_status.map((s, index) => (
                <option key={index} value={s.value}>{s.value}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Work Type</label>
            <select name="work_type" className="form-control" value={newEmployee.work_type} onChange={handleInputChange}>
              <option value="">Select work type</option>
              {options.work_mode.map((s, index) => (
                <option key={index} value={s.value}>{s.value}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Relationship Type</label>

            <select name="relationship_type" className="form-control" value={newEmployee.relationship_type} onChange={handleInputChange}>
              <option value="">Select employee relationship</option>
              {options.employee_relationship.map((s, index) => (
                <option key={index} value={s.value}>{s.value}</option>
              ))}
            </select>

          </div>

          <div className="mb-3">
            <label className="form-label">CTC</label>
            <input
              type="number"
              className="form-control"
              name="employee_ctc"
              value={newEmployee.employee_ctc}
              onChange={handleInputChange}
            />

          </div>

          {/* <div className="mb-3">
            <label className="form-label"> Basic Salary </label>
            <input
              className="form-control"
              type="number" name="basic_salary" value={newEmployee.basic_salary} onChange={handleInputChange} />
          </div>

          <div className="mb-3">
            <label className="form-label"> HRA </label>
            <input
              className="form-control"
              type="number" name="hra" value={newEmployee.hra} onChange={handleInputChange} />
          </div> */}

          {/* <div className="mb-3">
            <label className="form-label"> Month:</label>
            <input
              className="form-control"
              type="text" name="month" value={newEmployee.month} readOnly />
          </div>

          <div className="mb-3">
            <label className="form-label"> Month Date:</label>
            <input
              className="form-control"
              type="date" name="month_date" value={newEmployee.month_date} readOnly />
          </div>

          <div className="mb-3">
            <label className="form-label">  Year:</label>
            <input
              className="form-control"
              type="number" name="year" value={newEmployee.year} readOnly />
          </div> */}

          {["employee_username", "employee_password", "employee_email", "employee_mobile_number"].map((key) => (
            <div key={key} className="mb-3">
              <label htmlFor={key} className="form-label">{key.replace('_', ' ')}<span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                className="form-control"
                id={key}
                name={key}
                value={newEmployee[key]}
                onChange={handleInputChange}
              />
            </div>
          ))}

          <button type="submit" className="btn btn-primary" id="employeeformsubit_btn">Submit</button>
        </form>
      </div>
    </>
  );
}  
