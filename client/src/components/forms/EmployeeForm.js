import { useEffect, useState } from "react";
import './EmployeeForm.css';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function EmployeeForm({ onClose, onSubmit }) {
  const [newEmployee, setNewEmployee] = useState({
    employee_country: '',
    employee_working_company: '',
    employee_name: '',
    employee_DOJ: '',
    employee_designation: '',
    employee_gender: '',
    employee_status: '',
    employee_portal_access: '',
    employee_username: '',
    employee_password: '',
    employee_email: '',
    employee_mobile_number: '',
    employee_city: ''
  });

  const [countries, setCountries] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [city, setCity] = useState([]);

  const getData = async () => {
    await axios.get(process.env.REACT_APP_API_URL + 'countryAll')
      .then(response => setCountries(response.data))
      .catch(error => console.error('Error fetching countries:', error));
  };

  const getData_from_designation = async () => {
    await axios.get(process.env.REACT_APP_API_URL + 'designation')
      .then(response => setDesignations(response.data))
      .catch(error => console.error('Error fetching designations:', error));
  };

  const getData_from_companies = async () => {
    await axios.get(process.env.REACT_APP_API_URL + 'companies')
      .then(response => setCompanies(response.data))
      .catch(error => console.error('Error fetching companies:', error));
  };

  const getData_from_city = async () => {
    await axios.get(process.env.REACT_APP_API_URL + 'city')
      .then(response => setCity(response.data))
      .catch(error => console.error('Error fetching cities:', error));
  };

  useEffect(() => {
    getData();
    getData_from_designation();
    getData_from_companies();
    getData_from_city();
  }, []);

  const fetchCompaniesByCountry = async (country) => {
    if (!country) return;
    try {
      const response = await axios.get(process.env.REACT_APP_API_URL + `companiesbycounty/${country}`);
      setCompanies(response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee({ ...newEmployee, [name]: value });

    if (name === "employee_country") {
      setNewEmployee({ ...newEmployee, employee_country: value, employee_working_company: '' });
      fetchCompaniesByCountry(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(process.env.REACT_APP_API_URL + 'addEmployee', newEmployee, {
        headers: { "Content-Type": "application/json" }
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("Employee added successfully!");
        onSubmit(response.data);
        onClose();
      } else {
        toast.error("Failed to add employee. Please try again.");
      }
    } catch (error) {
      console.error("Error adding employee:", error);
      toast.error(`Error adding employee: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <>
      <div className="modal fade show" id="addEmployeeModal" tabIndex="-1" style={{ display: 'flex' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add New Employee</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className='emp_form'>
                <div className="mb-3">
                  <label className="form-label">Country</label>
                  <select name="employee_country" className="form-control" value={newEmployee.employee_country} onChange={handleInputChange}>
                    <option value="">Select Country</option>
                    {countries.map((item) => (
                      <option key={item.id} value={item.name}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Working Company</label>
                  <select name="employee_working_company" className="form-control" value={newEmployee.employee_working_company} onChange={handleInputChange} disabled={!newEmployee.employee_country}>
                    <option value="">Select Company</option>
                    {companies.map((item) => (
                      <option key={item.com_id} value={item.com_name}>{item.com_name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label htmlFor="employee_name" className="form-label">Employee Name</label>
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
                  <label htmlFor="employee_DOJ" className="form-label">Date of Joining</label>
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
                    {designations.map((item) => (
                      <option key={item.role_id} value={item.role_name}>{item.role_name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Gender</label>
                  <select name="employee_gender" className="form-control" value={newEmployee.employee_gender} onChange={handleInputChange}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select name="employee_status" className="form-control" value={newEmployee.employee_status} onChange={handleInputChange}>
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Portal Access</label>
                  <select name="employee_portal_access" className="form-control" value={newEmployee.employee_portal_access} onChange={handleInputChange}>
                    <option value="">Select Portal Access</option>
                    <option value="Super_Admin">Super Admin</option>
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                  </select>
                </div>

                {["employee_username", "employee_password", "employee_email", "employee_mobile_number"].map((key) => (
                  <div key={key} className="mb-3">
                    <label htmlFor={key} className="form-label">{key.replace('_', ' ')}</label>
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

                <div className="mb-3">
                  <label className="form-label">City</label>
                  <select name="employee_city" className="form-control" value={newEmployee.employee_city} onChange={handleInputChange}>
                    {city.map((item) => (
                      <option key={item.com_id} value={item.com_city}>{item.com_city}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" id="employeeformsubit_btn">Submit</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
