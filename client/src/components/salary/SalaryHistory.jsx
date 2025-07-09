import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './SalaryHistory.css'; // Assuming you have a CSS file for styling

const SalaryHistory = () => {
  const [salaryData, setSalaryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [displayedData, setDisplayedData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editedRows, setEditedRows] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [salaryAlreadyPushed, setSalaryAlreadyPushed] = useState(false);

  const [selectedRelationshipType, setSelectedRelationshipType] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const itemsPerPage = 10;
  const MONTHLY_PAID_LEAVES = 6;
  const MONTHLY_CASUAL_LEAVES = 4;
  const YEARLY_SICK_LEAVES = 12;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getRelationshipTypeColor = (type) => {
    const typeLower = type?.toLowerCase();
    if (typeLower === 'employee') return '#2E7D32';
    if (typeLower === 'consultant') return '#5D4037';
    return '#575757';
  };

  useEffect(() => {
    const fetchSalaryData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Fetching salary history data...');
        const response = await axios.get(`${process.env.REACT_APP_API_URL}api/employee-salary-history-details`);

        console.log('API Response:', response.data);

        if (!response.data || response.data.length === 0) {
          console.log('No data received from API');
          setError('No salary history data found');
          setSalaryData([]);
          setFilteredData([]);
          return;
        }

        // Transform data to match expected frontend structure
        const transformedData = response.data.map(item => ({
          ...item,
          name: item.employee_name || item.name,
          conveyance_allowances: item.conveyance_allowances || item.conveyance || 0,
          medical_reimbursement: item.medical_reimbursement || item.medical || 0,
          internet_allowance: item.internet_allowance || item.internet || 0,
          advance_payback: item.advance_payback || item.advance || 0,
          net_payable_salary: item.net_payable_salary || item.net_salary || 0,
          relationship_type: item.relationship_type || item.type || 'Unknown',
          total_working_days_of_month: item.total_working_days_of_month || item.total_days || 0,
          basic_salary: item.basic_salary || 0,
          hra: item.hra || 0,
          pf: item.pf || 0,
          tds: item.tds || 0,
          pt: item.pt || 0,
          worked_days: item.worked_days || 0,
          leaves_taken: item.leaves_taken || 0,
          paid_leaves: item.paid_leaves || 0,
          leave_deductions: item.leave_deductions || 0,
          gross_salary: item.gross_salary || 0,
          total_deductions: item.total_deductions || 0,
          remarks: item.remarks || '',
          payment_done: item.payment_done || false
        }));

        console.log('Transformed data:', transformedData);
        setSalaryData(transformedData);
        setFilteredData(transformedData);

        // ✅ Check if salary already exists for the current month
        try {
          const today = new Date();
          const currentMonth = today.toLocaleString('default', { month: 'long' });
          const currentYear = today.getFullYear();

          const res = await axios.get(`${process.env.REACT_APP_API_URL}api/salary-exists?month=${currentMonth}&year=${currentYear}`);
          if (res.data && res.data.exists) {
            setSalaryAlreadyPushed(true);
            console.warn('⚠️ Salary has already been pushed for this month.');
          }
        } catch (checkError) {
          console.error('Error checking salary existence:', checkError);
        }


      } catch (error) {
        console.error('Error fetching salary details:', error);
        setError(`Failed to fetch salary details: ${error.message}`);
        toast.error('Failed to fetch salary details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalaryData();
  }, []);

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

      if (filteredData.length === 0) {
        toast.warn('No data to save.');
        return;
      }

      const checkMonth = filteredData[0].month;
      const checkYear = filteredData[0].year;

      const checkResponse = await axios.get(`${process.env.REACT_APP_API_URL}api/salary-exists`, {
        params: { month: checkMonth, year: checkYear }
      });

      if (checkResponse.data.exists) {
        toast.warn(`Salary for ${checkMonth} ${checkYear} has already been generated.`);
        setIsSaving(false);
        return;
      }

      // ✅ Proceed if salary is not already generated
      await axios.put(`${process.env.REACT_APP_API_URL}api/push-employee-salary-details`, filteredData);
      toast.success('Salary history updated successfully!');
      setEditedRows(new Set());

    } catch (error) {
      console.error('Error updating salary details:', error);
      toast.error('Failed to update salary details.');
    } finally {
      setIsSaving(false);
    }
  };


  // const handleSave = async () => {
  //   try {
  //     setIsSaving(true);
  //     // Use the push endpoint to save to history table
  //     await axios.put('http://13.51.149.114:8000/api/push-employee-salary-details', filteredData);
  //     toast.success('Salary history updated successfully!');
  //     setEditedRows(new Set());
  //   } catch (error) {
  //     console.error('Error updating salary details:', error);
  //     toast.error('Failed to update salary details.');
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  const validateNumber = (value) => {
    return /^-?\d*\.?\d*$/.test(value);
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="salary-container">
        <div>Loading salary history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="salary-container">
        <div>Salary History</div>
        <div className="error-message" style={{ color: 'red', padding: '20px' }}>
          {error}
        </div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="salary-container">
      <div>Salary History ({filteredData.length} records)</div>
      <ToastContainer />


      {salaryAlreadyPushed && (
        <div style={{
          backgroundColor: '#f44336',
          color: 'white',
          padding: '10px',
          marginBottom: '15px',
          borderRadius: '5px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          ⚠️ Salary for the current month has already been pushed. Please review before saving again.
        </div>
      )}


      {filteredData.length === 0 ? (
        <div className="no-data">No salary history data found</div>
      ) : (
        <>
          <div className="salary-scroll-wrapper">
            <div className="salary-history-grid">
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
                <span>Total Days</span>
                <span>Worked Days</span>
                <span> from leave dates</span>
                <span>to leave dates</span>
                <span>Paid Leaves</span>
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
                  key={`${item.employee_id}-${item.month}-${item.year}-${index}`}
                >
                  <span>{item.employee_id || 'N/A'}</span>
                  <span style={{ color: '#1E88E5' }}>{item.name || item.employee_name || 'N/A'}</span>
                  <span>{item.doj ? new Date(item.doj).toLocaleDateString() : 'N/A'}</span>
                  <select
                    value={item.month || ''}
                    onChange={(e) => handleEdit(index, 'month', e.target.value)}
                  >
                    <option value="">Select Month</option>
                    {months.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  <span>{item.year || 'N/A'}</span>
                  <span style={{ color: getRelationshipTypeColor(item.relationship_type) }}>
                    {item.relationship_type || 'N/A'}
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
                  <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                    {Number(item.leave_deductions || 0).toFixed(2)}
                  </span>
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
    </div>
  );
};

export default SalaryHistory;