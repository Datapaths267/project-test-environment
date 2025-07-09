import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './SalaryPaidForm.css';
import Button from '../../components/button/Button';

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

const SalaryPaidForm = () => {
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [salaryData, setSalaryData] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [displayedData, setDisplayedData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editedRows, setEditedRows] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRelationshipType, setSelectedRelationshipType] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const itemsPerPage = 10;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i);

  const toggleRowSelection = (employeeId) => {
    setSelectedRows(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(employeeId)) {
        newSelection.delete(employeeId);
      } else {
        newSelection.add(employeeId);
      }
      return newSelection;
    });
  };

  useEffect(() => {
    const fetchSalaryData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}api/employee-salary-details`);
        setSalaryData(response.data);
        setFilteredData(response.data);
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

    filtered = filtered.map(item => ({
      ...item,
      month: selectedMonth,
      year: selectedYear
    }));
    setFilteredData(filtered);

    setCurrentPage(1);
  }, [searchTerm, salaryData, selectedRelationshipType]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const updatedPageData = filteredData.slice(startIndex, endIndex).map(item => ({
      ...item,
      month: selectedMonth,
      year: selectedYear
    }));
    setDisplayedData(updatedPageData);
  }, [filteredData, currentPage, selectedMonth, selectedYear]);

  const handlePaidAll = async () => {
    try {
      setIsSaving(true);
      const dataToProcess = selectedRows.size > 0
        ? salaryData.filter(item => selectedRows.has(item.employee_id))
        : salaryData;

      const updatedData = dataToProcess.map(item => ({
        ...item,
        month: selectedMonth,
        year: selectedYear
      }));

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}api/push-to-salary-history`,
        updatedData
      );

      if (response.status === 200) {
        toast.success(selectedRows.size > 0
          ? 'Selected salaries marked as paid and moved to history!'
          : 'All salaries marked as paid and moved to history!');
        setSelectedRows(new Set());
      }
    } catch (error) {
      console.error('Error pushing salary data:', error);
      toast.error(error.response?.data?.message || 'Failed to mark salaries as paid.');
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
      const updatedData = filteredData.map(item => ({
        ...item,
        month: selectedMonth,
        year: selectedYear
      }));
      await axios.put(`${process.env.REACT_APP_API_URL}api/update-employee-salary-details`, updatedData);
      toast.success('Salary details updated successfully!');
      setEditedRows(new Set());
    } catch (error) {
      console.error('Error updating salary details:', error);
      toast.error('Failed to update salary details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="salary-container">
      <h2>Employee Salary Generation</h2>

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

          <div className="filter-group">
            <span>Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="salary-filter"
            >
              {months.map((month, idx) => (
                <option key={idx} value={month}>{month}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <span>Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="salary-filter"
            >
              {years.map((yr, idx) => (
                <option key={idx} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="salary-paid-all">
          <Button
            className="salary-paid-all-button"
            onClick={handlePaidAll}
            disabled={isSaving || filteredData.length === 0}
          >
            {isSaving ? 'Saving...' : 'Mark All as Paid'}
          </Button>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="no-data">No salary data found</div>
      ) : (
        <>
          <div className="salary-scroll-wrapper">
            <div className="salary-generation-grid">
              <div className="salary-grid-header">
                <span>Select</span>
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
                <span>Total Days</span>
                <span>Worked Days</span>
                {/* <span>Leaves Taken</span> */}
                <span>From Leave Dates</span>
                <span>To Leave Dates</span>
                <span>Paid Leaves</span>
                <span>Sick Leave</span>
                <span>Casual Leave</span>
                <span>Leave Deductions</span>
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
                  <span>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(item.employee_id)}
                      onChange={() => toggleRowSelection(item.employee_id)}
                      className="salary-row-checkbox"
                    />
                  </span>
                  <span>{item.employee_id}</span>
                  <span style={{ color: '#1E88E5' }}>{item.employee_name}</span>
                  <span>{item.doj?.slice(0, 10)}</span>
                  <span>{item.month}</span>
                  <span>{item.year}</span>
                  <span style={{ color: getRelationshipTypeColor(item.relationship_type) }}>
                    {item.relationship_type}
                  </span>

                  <EditableCell
                    value={item.basic_salary}
                    onChange={(value) => {
                      if (!validateNumber(value)) return;
                      const updatedData = [...salaryData];
                      updatedData[(currentPage - 1) * itemsPerPage + index].basic_salary = value;
                      setSalaryData(updatedData);
                      setEditedRows(new Set(editedRows).add((currentPage - 1) * itemsPerPage + index));
                    }}
                  />

                  <EditableCell
                    value={item.hra}
                    onChange={(value) => {
                      if (!validateNumber(value)) return;
                      const updatedData = [...salaryData];
                      updatedData[(currentPage - 1) * itemsPerPage + index].hra = value;
                      setSalaryData(updatedData);
                      setEditedRows(new Set(editedRows).add((currentPage - 1) * itemsPerPage + index));
                    }}
                  />

                  <EditableCell
                    value={item.conveyance_allowances}
                    onChange={(value) => {
                      if (!validateNumber(value)) return;
                      const updatedData = [...salaryData];
                      updatedData[(currentPage - 1) * itemsPerPage + index].conveyance_allowances = value;
                      setSalaryData(updatedData);
                      setEditedRows(new Set(editedRows).add((currentPage - 1) * itemsPerPage + index));
                    }}
                  />

                  <EditableCell
                    value={item.medical_reimbursement}
                    onChange={(value) => {
                      if (!validateNumber(value)) return;
                      const updatedData = [...salaryData];
                      updatedData[(currentPage - 1) * itemsPerPage + index].medical_reimbursement = value;
                      setSalaryData(updatedData);
                      setEditedRows(new Set(editedRows).add((currentPage - 1) * itemsPerPage + index));
                    }}
                  />

                  <EditableCell
                    value={item.internet_allowance}
                    onChange={(value) => {
                      if (!validateNumber(value)) return;
                      const updatedData = [...salaryData];
                      updatedData[(currentPage - 1) * itemsPerPage + index].internet_allowance = value;
                      setSalaryData(updatedData);
                      setEditedRows(new Set(editedRows).add((currentPage - 1) * itemsPerPage + index));
                    }}
                  />

                  <input
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
                    value={item.from_dates || ''}
                    onChange={(e) =>
                      validateNumber(e.target.value) &&
                      handleEdit(index, 'from_dates', e.target.value)
                    }
                  />
                  <input
                    value={item.to_dates || ''}
                    onChange={(e) =>
                      validateNumber(e.target.value) &&
                      handleEdit(index, 'to_dates', e.target.value)
                    }
                  />
                  <input
                    value={item.paid_leaves || ''}
                    onChange={(e) =>
                      validateNumber(e.target.value) &&
                      handleEdit(index, 'paid_leaves', e.target.value)
                    }
                  />
                  <input
                    value={item.sick_leave || ''}
                    onChange={(e) =>
                      validateNumber(e.target.value) &&
                      handleEdit(index, 'sick_leave', e.target.value)
                    }
                  />
                  <input
                    value={item.casual_leave || ''}
                    onChange={(e) =>
                      validateNumber(e.target.value) &&
                      handleEdit(index, 'casual_leave', e.target.value)
                    }
                  />
                  <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                    {Number(item.leave_deductions || 0).toFixed(2)}
                  </span>

                  <span>{calculateSalary(item, salaryData).gross_salary.toFixed(2)}</span>

                  <EditableCell
                    value={item.pf}
                    onChange={(value) => {
                      if (!validateNumber(value)) return;
                      const updatedData = [...salaryData];
                      updatedData[(currentPage - 1) * itemsPerPage + index].pf = value;
                      setSalaryData(updatedData);
                      setEditedRows(new Set(editedRows).add((currentPage - 1) * itemsPerPage + index));
                    }}
                  />

                  <EditableCell
                    value={item.tds}
                    onChange={(value) => {
                      if (!validateNumber(value)) return;
                      const updatedData = [...salaryData];
                      updatedData[(currentPage - 1) * itemsPerPage + index].tds = value;
                      setSalaryData(updatedData);
                      setEditedRows(new Set(editedRows).add((currentPage - 1) * itemsPerPage + index));
                    }}
                  />

                  <EditableCell
                    value={item.pt}
                    onChange={(value) => {
                      if (!validateNumber(value)) return;
                      const updatedData = [...salaryData];
                      updatedData[(currentPage - 1) * itemsPerPage + index].pt = value;
                      setSalaryData(updatedData);
                      setEditedRows(new Set(editedRows).add((currentPage - 1) * itemsPerPage + index));
                    }}
                  />

                  <EditableCell
                    value={item.advance_payback}
                    onChange={(value) => {
                      if (!validateNumber(value)) return;
                      const updatedData = [...salaryData];
                      updatedData[(currentPage - 1) * itemsPerPage + index].advance_payback = value;
                      setSalaryData(updatedData);
                      setEditedRows(new Set(editedRows).add((currentPage - 1) * itemsPerPage + index));
                    }}
                  />

                  <span>{calculateSalary(item, salaryData).total_deductions.toFixed(2)}</span>
                  <span>{calculateSalary(item, salaryData).net_payable_salary.toFixed(2)}</span>

                  <EditableCell
                    value={item.remarks}
                    onChange={(value) => {
                      const updatedData = [...salaryData];
                      updatedData[(currentPage - 1) * itemsPerPage + index].remarks = value;
                      setSalaryData(updatedData);
                      setEditedRows(new Set(editedRows).add((currentPage - 1) * itemsPerPage + index));
                    }}
                    isTextArea
                  />

                  <EditableCell
                    value={item.payment_done}
                    onChange={(value) => {
                      const updatedData = [...salaryData];
                      updatedData[(currentPage - 1) * itemsPerPage + index].payment_done = value;
                      setSalaryData(updatedData);
                      setEditedRows(new Set(editedRows).add((currentPage - 1) * itemsPerPage + index));
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pagination-controls">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <span>Page {currentPage} of {totalPages}</span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}

      <button
        className="salary-save-button"
        onClick={handleSave}
        disabled={isSaving || editedRows.size === 0}
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
};

const EditableCell = ({ value, onChange, isTextArea }) => {
  return isTextArea ? (
    <textarea
      className="salary-textarea"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      rows={1}
    />
  ) : (
    <input
      type="text"
      className="salary-input"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default SalaryPaidForm;