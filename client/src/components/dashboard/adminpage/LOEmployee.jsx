import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './loEmployee.css';

export default function LOEmployee() {
  const [employees, setEmployees] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set()); // Track selected rows using Set

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    await axios.get(process.env.REACT_APP_API_URL + 'employeeList')
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

  return (
    <div className='ListofEmployee-container'>
      <h2>List of Employee</h2><br />
      <div className='employee-details'>
        <div className='employee-grid-header'>
          <span> </span>
          <span>Country</span>
          <span>Emp ID</span>
          <span>Emp Name</span>
          <span>Date Of Join</span>
          <span>Designation</span>
          <span>Gender</span>
          <span>Status</span>
          <span>Leaving Date</span>
          <span>Portal Access</span>
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
            <span>{new Date(employee.employee_doj).toLocaleDateString('en-GB')}</span>
            <span>{employee.employee_designation}</span>
            <span>{employee.employee_gender}</span>
            <span className={employee.employee_status === 'Active' ? 'active' : 'inactive'}>
              {employee.employee_status}
            </span>
            <span>{employee.employee_lwd ? new Date(employee.employee_lwd).toLocaleDateString('en-GB') : "Still Working"}</span>
            <span>{employee.employee_portal_access}</span>
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
