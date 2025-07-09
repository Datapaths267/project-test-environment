import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './employeeSalary.css';

// Leave policy constants
const MONTHLY_PAID_LEAVES = 6;
const MONTHLY_CASUAL_LEAVES = 4;
const YEARLY_SICK_LEAVES = 12;

const calculateLeaveDeductions = (row, allSalaryData) => {
  const basic = parseFloat(row.basic_salary) || 0;
  const totalDays = parseFloat(row.total_working_days_of_month) || 0;
  const leavesTaken = parseFloat(row.leaves_taken) || 0;
  const month = row.month;
  const year = row.year;
  const employeeId = row.employee_id;

  if (!totalDays || totalDays <= 0) return 0;

  const dailySalary = basic / totalDays;

  const yearlyLeavesUsed = allSalaryData
    .filter(item =>
      item.employee_id === employeeId &&
      item.year === year &&
      item.month !== month
    )
    .reduce((sum, item) => sum + (parseFloat(item.leaves_taken) || 0), 0);

  const availablePaidLeaves = Math.min(MONTHLY_PAID_LEAVES, leavesTaken);
  const remainingAfterPaid = leavesTaken - availablePaidLeaves;

  const availableCasualLeaves = Math.min(MONTHLY_CASUAL_LEAVES, remainingAfterPaid);
  const remainingAfterCasual = remainingAfterPaid - availableCasualLeaves;

  const availableSickLeaves = Math.max(0, Math.min(
    YEARLY_SICK_LEAVES - yearlyLeavesUsed,
    remainingAfterCasual
  ));

  const deductibleLeaves = Math.max(0,
    leavesTaken - availablePaidLeaves - availableCasualLeaves - availableSickLeaves
  );

  return deductibleLeaves * dailySalary;
};

const calculateSalary = (row, allSalaryData = []) => {
  const basic = parseFloat(row.basic_salary) || 0;
  const hra = parseFloat(row.hra) || 0;
  const conveyance = parseFloat(row.conveyance_allowances) || 0;
  const medical = parseFloat(row.medical_reimbursement) || 0;
  const internet = parseFloat(row.internet_allowance) || 0;
  const pf = parseFloat(row.pf) || 0;
  const tds = parseFloat(row.tds) || 0;
  const pt = parseFloat(row.pt) || 0;
  const advance = parseFloat(row.advance_payback) || 0;

  const gross = basic + hra + conveyance + medical + internet;
  const leaveDeductions = calculateLeaveDeductions(row, allSalaryData);
  const deductions = pf + tds + pt + advance + leaveDeductions;
  const net = gross - deductions;

  return {
    gross_salary: gross,
    total_deductions: deductions,
    net_payable_salary: net,
    leave_deductions: leaveDeductions
  };
};

const EmployeeSalary = () => {
  const [salaryData, setSalaryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [displayedData, setDisplayedData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editedRows, setEditedRows] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRelationshipType, setSelectedRelationshipType] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const fetchSalaryData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}api/employee-salary-details`);
        setSalaryData(response.data);
        setFilteredData(response.data);
        console.log('Fetched salary data:', response.data);
      } catch (error) {
        console.error('Error fetching salary details:', error);
        toast.error('Failed to fetch salary details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalaryData();
  }, []);

  useEffect(() => {
    let filtered = [...salaryData];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.employee_name?.toLowerCase().includes(term) ||
        item.employee_id?.toLowerCase().includes(term)
      );
    }

    if (selectedRelationshipType !== 'All') {
      filtered = filtered.filter((item) =>
        item.relationship_type?.toLowerCase() === selectedRelationshipType.toLowerCase()
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchTerm, salaryData, selectedRelationshipType]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedData(filteredData.slice(startIndex, endIndex));
  }, [filteredData, currentPage]);

  const handleEdit = (index, field, value) => {
    const updated = [...filteredData];
    const globalIndex = (currentPage - 1) * itemsPerPage + index;
    const row = { ...updated[globalIndex], [field]: value };

    const newSalaryValues = calculateSalary(row, salaryData);
    Object.assign(row, newSalaryValues);

    updated[globalIndex] = row;
    setFilteredData(updated);

    const newEdited = new Set(editedRows);
    newEdited.add(globalIndex);
    setEditedRows(newEdited);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      console.log('Saving edited rows:', Array.from(editedRows));
      console.log('Filtered data:', filteredData);
      await axios.put(`${process.env.REACT_APP_API_URL}api/update-employee-salary-details`, filteredData);

      toast.success('Salary details updated successfully!');
      setEditedRows(new Set());
    } catch (error) {
      console.error('Error updating salary details:', error);
      toast.error('Failed to update salary details.');
    } finally {
      setIsSaving(false);
    }
  };

  const validateNumber = (value) => {
    return /^-?\d*\.?\d*$/.test(value);
  };

  const getRelationshipTypeColor = (type) => {
    const typeLower = type?.toLowerCase();
    if (typeLower === 'employee') return '#2E7D32';
    if (typeLower === 'consultant') return '#5D4037';
    return '#575757';
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (isLoading) {
    return <div className="loading-container">Loading salary data...</div>;
  }

  return (
    <div className="salary-container">
      <h2>Employee Salary Component</h2>

      <div className="salary-filters">
        <div className="filter-group">
          <span>Search:</span>
          <input
            type="text"
            placeholder="By name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="salary-search"
          />
        </div>

        <div className="filter-group">
          <span>Type:</span>
          <select
            value={selectedRelationshipType}
            onChange={(e) => setSelectedRelationshipType(e.target.value)}
            className="salary-filter"
          >
            <option value="All">All</option>
            <option value="Employee">Employee</option>
            <option value="Consultant">Consultant</option>
          </select>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="no-data">No salary data found</div>
      ) : (
        <>
          <div className="salary-scroll-wrapper">
            <div className="salary-grid">
              <div className="salary-grid-header">
                <span>Employee ID</span>
                <span>Name</span>
                <span>DOJ</span>
                <span>Month</span>
                <span>Year</span>
                <span>Type</span>
                <span>Basic Salary</span>
                <span>HRA</span>
                <span>Conveyance</span>
                <span>Medical</span>
                <span>Internet</span>
                {/* <span>Total Days</span>
                <span>Worked Days</span>
                <span>Leaves Taken</span>
                <span>Paid Leaves</span>
                <span>Leave Deductions</span> */}
                <span>Gross Salary</span>
                <span>PF</span>
                <span>TDS</span>
                <span>PT</span>
                <span>Advance</span>
                <span>Total Deductions</span>
                <span>Net Salary</span>
                <span>Remarks</span>
                <span>Payment Done</span>
              </div>

              {displayedData.map((item, index) => (
                <div
                  className={`salary-grid-row ${editedRows.has((currentPage - 1) * itemsPerPage + index) ? 'edited-row' : ''}`}
                  key={index}
                >
                  <span>{item.employee_id}</span>
                  <span style={{ color: '#1E88E5' }}>{item.employee_name}</span>
                  <span>{item.doj?.slice(0, 10)}</span>
                  <select
                    value={item.month || ''}
                    onChange={(e) => handleEdit(index, 'month', e.target.value)}
                  >
                    {months.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  <span>{item.year}</span>
                  <span style={{ color: getRelationshipTypeColor(item.relationship_type) }}>
                    {item.relationship_type}
                  </span>
                  <input
                    value={item.basic_salary || ''}
                    onChange={(e) =>
                      validateNumber(e.target.value) &&
                      handleEdit(index, 'basic_salary', e.target.value)
                    }
                  />
                  <input
                    value={item.hra || ''}
                    onChange={(e) =>
                      validateNumber(e.target.value) &&
                      handleEdit(index, 'hra', e.target.value)
                    }
                  />
                  <input
                    value={item.conveyance_allowances || ''}
                    onChange={(e) =>
                      validateNumber(e.target.value) &&
                      handleEdit(index, 'conveyance_allowances', e.target.value)
                    }
                  />
                  <input
                    value={item.medical_reimbursement || ''}
                    onChange={(e) =>
                      validateNumber(e.target.value) &&
                      handleEdit(index, 'medical_reimbursement', e.target.value)
                    }
                  />
                  <input
                    value={item.internet_allowance || ''}
                    onChange={(e) =>
                      validateNumber(e.target.value) &&
                      handleEdit(index, 'internet_allowance', e.target.value)
                    }
                  />
                  {/* <input
                    value={item.total_working_days_of_month || ''}
                    onChange={(e) =>
                      validateNumber(e.target.value) &&
                      handleEdit(index, 'total_working_days_of_month', e.target.value)
                    }
                  />
                  <input
                    value={item.worked_days || ''}
                    onChange={(e) =>
                      validateNumber(e.target.value) &&
                      handleEdit(index, 'worked_days', e.target.value)
                    }
                  />
                  <input
                    value={item.leaves_taken || ''}
                    onChange={(e) =>
                      validateNumber(e.target.value) &&
                      handleEdit(index, 'leaves_taken', e.target.value)
                    }
                  />
                  <input
                    value={item.paid_leaves || ''}
                    onChange={(e) =>
                      validateNumber(e.target.value) &&
                      handleEdit(index, 'paid_leaves', e.target.value)
                    }
                  />
                  <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                    {Number(item.leave_deductions || 0).toFixed(2)}
                  </span> */}
                  <span>{Number(item.gross_salary || 0).toFixed(2)}</span>
                  <input
                    value={item.pf || ''}
                    onChange={(e) =>
                      validateNumber(e.target.value) && handleEdit(index, 'pf', e.target.value)
                    }
                  />
                  <input
                    value={item.tds || ''}
                    onChange={(e) =>
                      validateNumber(e.target.value) && handleEdit(index, 'tds', e.target.value)
                    }
                  />
                  <input
                    value={item.pt || ''}
                    onChange={(e) =>
                      validateNumber(e.target.value) && handleEdit(index, 'pt', e.target.value)
                    }
                  />
                  <input
                    value={item.advance_payback || ''}
                    onChange={(e) =>
                      validateNumber(e.target.value) &&
                      handleEdit(index, 'advance_payback', e.target.value)
                    }
                  />
                  <span>{Number(item.total_deductions || 0).toFixed(2)}</span>
                  <span>{Number(item.net_payable_salary || 0).toFixed(2)}</span>
                  <input
                    value={item.remarks || ''}
                    onChange={(e) => handleEdit(index, 'remarks', e.target.value)}
                  />
                  <select
                    value={item.payment_done ? 'Yes' : 'No'}
                    onChange={(e) =>
                      handleEdit(index, 'payment_done', e.target.value === 'Yes')
                    }
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="pagination-controls">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <span>Page {currentPage} of {totalPages}</span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </button>
          </div>

          <button
            className="salary-save-button"
            onClick={handleSave}
            disabled={isSaving || editedRows.size === 0}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default EmployeeSalary;