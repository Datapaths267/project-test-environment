import React, { useState, useEffect } from 'react';
import './workassign.css';
import '../../forms/WorkAssignForm.css';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import EmployeeForm from '../../forms/EmployeeForm'; // Import the form component
import { ToastContainer } from 'react-toastify';
import WorkAssignForm from '../../forms/WorkAssignForm';
import ChangeWorkAssignForm from '../../forms/ChangeWorkAssignForm';

export default function Workassign() {
  const [companylist, setCompanyList] = useState([]);
  const [workassign, setWorkassign] = useState([]);
  const [workassigncompanies, setWorkassignCompanies] = useState([]);
  const [worknotassign, setWorknotassign] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showForm, setShowForm] = useState(false);
  const [showWorkAssignForm, setShowWorkAssignForm] = useState({status: false, empid: ''});

  // useEffect(() => {
  //   getData_From_Work_Assign();
  //   getData_From_Work_Not_Assign();
//   // }, []);
// <WorkAssignForm />

  useEffect(() => {
  const fetchAllData = async () => {
    await Promise.all([
      getData_From_company(),
      getData_From_Work_Assign(),
      getData_From_Work_Not_Assign(),
      getData_From_Work_Assign_company_list() // Fetch company details
    ]);
  };
  fetchAllData();
}, []);

const getData_From_company = async () => {
  console.log("entered into work assign companies......")
    try {
        const response = await axios.get(process.env.REACT_APP_API_URL + 'companies');
        console.log("stored companies:", response.data);
        setCompanyList(response.data);
    } catch (error) {
        console.error("Error fetching assigned employees:", error);
    }
};


 const getData_From_Work_Assign = async () => {
  console.log("entered into work assign table......")
    try {
        const response = await axios.get(process.env.REACT_APP_API_URL + 'employeeList_With_Work_Assign');
        console.log("Assigned Employees:", response.data);
        setWorkassign(response.data);
    } catch (error) {
        console.error("Error fetching assigned employees:", error);
    }
};

const getData_From_Work_Assign_company_list = async () => {
  console.log("entered into work assign company......")
    try {
        const response = await axios.get(process.env.REACT_APP_API_URL + 'work_assign_company_list');
        console.log("Assigned Employees work assign company:", response.data);
        setWorkassignCompanies(response.data);
    } catch (error) {
        console.error("Error fetching assigned employees:", error);
    }
};

const getData_From_Work_Not_Assign = async () => {
  console.log("entered into work assign table......")
    try {
        const response = await axios.get(process.env.REACT_APP_API_URL + 'employeeList_With_Work_Not_Assign');
        console.log("Not Assigned Employees:", response.data);
        setWorknotassign(response.data);
    } catch (error) {
        console.error("Error fetching not assigned employees:", error);
    }
};


  const handleCheckboxChange = (employeeId) => {
    setSelectedRows((prevSelected) => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(employeeId)) {
        newSelected.delete(employeeId);
      } else {
        newSelected.add(employeeId);
      }
      return newSelected;
    });
  };

  const handleAddEmployee_btn = async (newEmployee) => {
    console.log("entering try11 ..."+ newEmployee);
    try {
      await axios.post(process.env.REACT_APP_API_URL + 'addEmployee', newEmployee);
      console.log("entering try ..."+ newEmployee);
      alert('Employee added successfully!');
      
      setShowForm(false);
     
    } catch (error) {
      console.error("Error adding employee:", error);
    }

    getData_From_Work_Assign();
    getData_From_Work_Not_Assign();
  };

  const handleWorkAssignSubmit_btn = (data) => {
    console.log("Assigned Data:", data); // You can perform additional actions here
    // For example: Update the employee's assigned companies list or show a success message

    setShowWorkAssignForm({ status: false, empid: "" }); // Close the form after submission
    getData_From_Work_Assign();
    getData_From_Work_Not_Assign();
  };

  const handleChangeWorkAssignSubmit_btn = (data) => {
    console.log("Assigned Data:", data); // You can perform additional actions here
    // For example: Update the employee's assigned companies list or show a success message

    setShowWorkAssignForm({ status: false, empid: "" }); // Close the form after submission
    getData_From_Work_Assign();
    getData_From_Work_Not_Assign();
  };


  return (

    <div className='WorkAssign-container'>
     <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <button onClick={() => setShowForm(true)} className='add_user_btn' id='new-user-btn'>
        ➕ Add New User
      </button>

      {showForm && <EmployeeForm onClose={() => setShowForm(false)} onSubmit={handleAddEmployee_btn} />}

      <button className='mass_update_btn'>Mass update</button>

      <div className=''>
      <h4>Unassigned Employees</h4><br />
      <div className='WorkAssigning-details1'>
        <div className='WorkAssigning-grid-header1'>
          <span> </span>
          <span>Country</span>
          <span>Company</span>
          <span>Emp ID</span>
          <span>Emp Name</span>
          <span>Designation</span>
          <span>Status</span>
          <span>Assign Company</span>

          {/* <span> </span> */}
        </div>
        {worknotassign.map((employee) => (
          <div key={employee.employee_id} className={`WorkAssigning-grid-row1 ${selectedRows.has(employee.employee_id) ? 'selected-row' : ''}`}>
              <span>
                <input type="checkbox" onChange={() => handleCheckboxChange(employee.employee_id)} checked={selectedRows.has(employee.employee_id)} />
              </span>
              <span>{employee.employee_country}</span>
              <span className='working_comp'>{employee.employee_working_company}</span>
              <span>{employee.employee_id}</span>
              <span className='working_emp_name'>{employee.employee_name}</span>
              <span>{employee.employee_designation}</span>
              <span className={employee.employee_status === 'Active' ? 'active' : 'inactive'}>
                {employee.employee_status}
              </span>
              <span className='assign-work-span'>
                <button 
                  onClick={() => {
                    // Setting empid to the employee's id when the button is clicked
                    setShowWorkAssignForm({ status: true, empid: employee.employee_id });
                    
                    // Log the employee's ID to console
                    console.log("Assigning company for employee with ID:", employee.employee_id);
                  }}

                  className='assignedcompany-btn'
                >
                  Assign company
                </button>
              </span>
            </div>

        ))}
        {showWorkAssignForm.status && (
            <WorkAssignForm
              onClose={() => setShowWorkAssignForm({ status: false, empid: '' })}
              onSubmit={handleWorkAssignSubmit_btn}
              addemployeeid={showWorkAssignForm.empid} // Pass empid here
            />
          )}

      </div>

      </div>
      <br />

      <div>
      <h4>Assigned Employees</h4><br />
      <div className='WorkAssigned-details'>
        <div className='WorkAssigned-grid-header'>
          <span> </span>
          <span>Country</span>
          <span>Company</span>
          <span>Emp ID</span>
          <span>Emp Name</span>
          <span>Designation</span>
          <span>Status</span>
          {/* <span>Portal Access</span> */}
          <span>assigned Companies</span>
          <span> Update Access </span>
        </div>
        {workassign.map((employee) => (
          <div key={employee.employee_id} className={`WorkAssigned-grid-row ${selectedRows.has(employee.employee_id) ? 'selected-row' : ''}`}>
            <span>
              <input type="checkbox" onChange={() => handleCheckboxChange(employee.employee_id)} checked={selectedRows.has(employee.employee_id)} />
            </span>
            <span>{employee.employee_country}</span>
            <span className='working_comp' >{employee.employee_working_company}</span>
            <span>{employee.employee_id}</span>
            <span className='working_emp_name' >{employee.employee_name}</span>
            <span>{employee.employee_designation}</span>
            <span className={employee.employee_status === 'Active' ? 'active' : 'inactive'}>
              {employee.employee_status}
            </span>
            {/* <span className='working_portal_access' >{employee.employee_portal_access}</span> */}
            <span>
                  {workassigncompanies
                    .filter(company => company.user_id === employee.employee_id) // Match employee
                    .map(company => {
                      console.log("Employee Work Assigned:", company.work_assigned_comapnies);

                      // Ensure work_assigned_comapnies is an array or convert it
                      const companyCodes = Array.isArray(company.work_assigned_comapnies)
                        ? company.work_assigned_comapnies
                        : company.work_assigned_comapnies.replace(/[{}"]/g, "").split(",");

                      console.log("Extracted Company Codes:", companyCodes);

                      // Map codes to actual company names
                      const companyNames = companyCodes.map(code => {
                        const match = companylist.find(c => c.com_id === code.trim());
                        return match ? match.com_name : "Unknown";
                      });

                      return companyNames.join(", ");
                    })}
                </span>
            <span>
            <button 
                  onClick={() => {
                    // Setting empid to the employee's id when the button is clicked
                    setShowWorkAssignForm({ status: true, empid: employee.employee_id });
                    
                    // Log the employee's ID to console
                    console.log("Assigning company for employee with ID:", employee.employee_id);
                  }}

                  className='change_access_btn'
                >
                  Change Access
                </button>
            </span>
          </div>
        ))}
        {showWorkAssignForm.status && (
            <ChangeWorkAssignForm
              onClose={() => setShowWorkAssignForm({ status: false, empid: '' })}
              onSubmit={handleChangeWorkAssignSubmit_btn}
              addemployeeid={showWorkAssignForm.empid} // Pass empid here
            />
          )}
      </div>
      </div>
    </div>
  );
}
