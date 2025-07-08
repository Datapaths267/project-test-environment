// File: Workassign.js

import React, { useState, useEffect } from 'react';
import './workassign.css';
import '../../forms/WorkAssignForm.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Workassign() {
  const [unassignedEmployees, setUnassignedEmployees] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [editedRows, setEditedRows] = useState(new Set());
  const [activeAssignRow, setActiveAssignRow] = useState(null);
  const [reportsToOptions, setReportsToOptions] = useState([]);
  const [clientAssignments, setClientAssignments] = useState([]);
  const [clients, setClients] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);

  const token = localStorage.getItem('authToken');
  const companyId = localStorage.getItem('companyId');
  const country = localStorage.getItem('country');

  const headers = { Authorization: `Bearer ${token}` };
  const params = { companyId, country };

  useEffect(() => {
    fetchUnassignedEmployees();
    fetchClientAssignments();
    fetchClients();
    fetchRecruiters();
  }, []);

  const fetchUnassignedEmployees = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}api/employeeList_With_Work_Not_Assign`,
        { headers, params }
      );
      setUnassignedEmployees(data);
    } catch (err) {
      toast.error('Failed to load unassigned employees');
    }
  };

  const fetchClientAssignments = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}api/assignment/client-assignments`,
        { headers, params }
      );
      setClientAssignments(data);
    } catch (err) {
      toast.error('Failed to load client assignments');
    }
  };

  const fetchRecruiters = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}api/assignment/recruiters`,
        { headers, params }
      );
      setRecruiters(data);
    } catch (err) {
      toast.error('Failed to load recruiters');
    }
  };

  const fetchClients = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}api/assignment/clients`,
        { headers, params }
      );
      setClients(data);
    } catch (err) {
      toast.error('Failed to load clients');
    }
  };

  const toggleRowSelection = (employeeId) => {
    setSelectedRows((prev) => {
      const updated = new Set(prev);
      updated.has(employeeId) ? updated.delete(employeeId) : updated.add(employeeId);
      return updated;
    });
  };

  const handleAssignClick = async (employeeId) => {
    setActiveAssignRow(employeeId);
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_API_URL}api/assignment/reports-to-options`,
        {
          headers,
          params: { employeeId },
        }
      );
      setReportsToOptions(data);
    } catch (err) {
      toast.error('Failed to load assignable employees');
    }
  };

  const handleEdit = (index, field, value) => {
    const updated = [...unassignedEmployees];
    updated[index] = { ...updated[index], [field]: value };
    setUnassignedEmployees(updated);
    setEditedRows((prev) => new Set(prev).add(index));
  };

  const saveEmployeeAssignments = async () => {
    try {
      const updatedRows = Array.from(editedRows).map((i) => unassignedEmployees[i]);
      for (const row of updatedRows) {
        if (!row.reports_to) continue;

        await axios.put(
          `${process.env.REACT_APP_API_URL}api/assignment/employees/updateReportsTo`,
          {
            employee_id: row.employee_id,
            reports_to: row.reports_to,
          },
          { headers }
        );
      }
      toast.success('Employee assignments updated!');
      setEditedRows(new Set());
      setActiveAssignRow(null);
      fetchUnassignedEmployees();
    } catch (err) {
      toast.error('Failed to save assignments');
    }
  };

  const saveClientAssignment = async () => {
    if (!selectedRecruiter || !selectedClient) {
      return toast.warn('Please select both recruiter and client.');
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}api/assignment/assign`,
        {
          recruiter_id: selectedRecruiter,
          customer_id: selectedClient,
          company_id: companyId,
          country,
        },
        { headers }
      );

      toast.success('Client assigned successfully!');
      fetchClientAssignments();
    } catch (err) {
      toast.error('Client assignment failed.');
    }
  };

  return (
    <div className="WorkAssign-container">
      <h2>Work Assigning</h2>

      <section>
        <h4>Unassigned Employees</h4>
        <button className="btn btn-primary mt-3" onClick={saveEmployeeAssignments}>
          Save Assignments
        </button>

        <div className="WorkAssigning-details1">
          <div className="WorkAssigning-grid-header1">
            <span></span>
            <span>Country</span>
            <span>Company</span>
            <span>Emp ID</span>
            <span>Emp Name</span>
            <span>Designation</span>
            <span>Status</span>
            <span>Assign</span>
          </div>

          {unassignedEmployees.map((emp, index) => (
            <div
              key={emp.employee_id}
              className={`WorkAssigning-grid-row1 ${selectedRows.has(emp.employee_id) ? 'selected-row' : ''}`}
            >
              <span>
                <input
                  type="checkbox"
                  onChange={() => toggleRowSelection(emp.employee_id)}
                  checked={selectedRows.has(emp.employee_id)}
                />
              </span>
              <span>{emp.employee_country}</span>
              <span>{emp.employee_working_company}</span>
              <span>{emp.employee_id}</span>
              <span className="working_emp_name">{emp.employee_name}</span>
              <span>{emp.employee_designation}</span>
              <span className={emp.employee_status === 'Active' ? 'active' : 'inactive'}>
                {emp.employee_status}
              </span>
              <span>
                <button className="assigncompany-btn" onClick={() => handleAssignClick(emp.employee_id)}>
                  Assign Employee
                </button>

                {activeAssignRow === emp.employee_id ? (
                  <select
                    className="form-select"
                    value={emp.reports_to || ''}
                    onChange={(e) => handleEdit(index, 'reports_to', e.target.value)}
                  >
                    <option value="">Select</option>
                    {reportsToOptions.map((opt) => (
                      <option key={opt.employee_id} value={opt.employee_id}>
                        {opt.employee_name} ({opt.employee_designation})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="reports-to-label">
                    {
                      reportsToOptions.find((o) => o.employee_id === emp.reports_to)?.employee_name ||
                      'Not Assigned'
                    }
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="Client-assigning">
        <h4>Assigned Clients to Recruiters</h4>
        <p>Here you can view and assign clients to recruiters.</p>

        <button className="btn btn-primary mt-3" onClick={() => setShowAssignForm(true)}>
          Assign Client to Recruiter
        </button>

        {showAssignForm && (
          <div className="WorkAssigning-details1">
            <label>Select Recruiter:</label>
            <select
              className="form-select"
              value={selectedRecruiter}
              onChange={(e) => setSelectedRecruiter(e.target.value)}
            >
              <option value="">-- Select Recruiter --</option>
              {recruiters.map((rec) => (
                <option key={rec.employee_id} value={rec.employee_id}>
                  {rec.employee_name} (ID: {rec.employee_id})
                </option>
              ))}
            </select>

            <label>Select Client:</label>
            <select
              className="form-select"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              <option value="">-- Select Client --</option>
              {clients.map((cli) => (
                <option key={cli.customer_id} value={cli.customer_id}>
                  {cli.customer_name} (ID: {cli.customer_id})
                </option>
              ))}
            </select>

            <button className="btn btn-primary mt-3" onClick={saveClientAssignment}>
              Save Assignments
            </button>
          </div>
        )}

        {/* ✅ Correct Table Format */}
        <div className="WorkAssigning-details2">
          <div className="WorkAssigning-grid-header2">
            <span>Client ID</span>
            <span>Client Name</span>
            <span>Recruiter Name</span>
          </div>

          {clientAssignments.map((assign) => (
            <div key={`${assign.customer_id}-${assign.recruiter_name}`} className="WorkAssigning-grid-row2">
              <span>{assign.customer_id}</span>
              <span>{assign.customer_name}</span>
              <span>{assign.recruiter_name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
