import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './SalaryLeave.css';
import Button from '../../components/button/Button';

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);

const EmployeeSalaryLeave = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const topScrollRef = useRef(null);
  const bottomScrollRef = useRef(null);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}api/employee-salary-leave`)
      .then((res) => {
        const updated = res.data.map((row) => ({
          ...row,
          isEditing: false,
          from_dates: row.from_dates ? row.from_dates.split(",") : [],
          to_dates: row.to_dates ? row.to_dates.split(",") : [],
          approved_dates: row.approved_dates || "",
        }));
        setData(updated);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
      });
  }, []);

  const handleEdit = (rowKey) => {
    setData(data.map((row) =>
      row.employee_id === rowKey.employee_id && row.year === rowKey.year && row.month === rowKey.month
        ? { ...row, isEditing: true }
        : row
    ));
  };

  const handleInputChange = (index, field, value, subIndex = null) => {
    const updated = [...data];
    if ((field === "from_dates" || field === "to_dates") && subIndex !== null) {
      const arr = [...updated[index][field]];
      arr[subIndex] = value;
      updated[index][field] = arr;
    } else if (field === "total_leave_taken") {
      const count = parseInt(value) || 0;
      updated[index][field] = value;
      updated[index]["from_dates"] = Array(count).fill("");
      updated[index]["to_dates"] = Array(count).fill("");
    } else {
      updated[index][field] = value;
    }
    setData(updated);
  };

  const handleSave = (rowKey) => {
    const index = data.findIndex(
      (r) => r.employee_id === rowKey.employee_id && r.year === rowKey.year && r.month === rowKey.month
    );

    if (index === -1) return;

    const row = data[index];
    const { isEditing, id, employee_name, ...updateData } = row;

    updateData.from_dates = row.from_dates.join(",");
    updateData.to_dates = row.to_dates.join(",");
    updateData.approved_dates = row.approved_dates;

    axios
      .put(`${process.env.REACT_APP_API_URL}api/employee-salary-leave/${row.employee_id}`, updateData)
      .then(() => {
        const updated = [...data];
        updated[index].isEditing = false;
        setData(updated);
        toast.success('Leave data saved successfully!');
      })
      .catch((error) => {
        console.error("Error saving data:", error);
        toast.error('Failed to save leave data.');
      });
  };

  const handleTopScroll = (e) => {
    if (bottomScrollRef.current) bottomScrollRef.current.scrollLeft = e.target.scrollLeft;
  };

  const handleBottomScroll = (e) => {
    if (topScrollRef.current) topScrollRef.current.scrollLeft = e.target.scrollLeft;
  };

  const filteredData = data.filter(
    (row) =>
      row.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="container">
      <h1 className="main-heading">Employee Salary Leave</h1>

      <input
        type="text"
        placeholder="Search by Employee ID or Name"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-input"
      />

      <div className="scroll-container">
        <div ref={topScrollRef} className="scrollbar-top" onScroll={handleTopScroll}>
          <div className="scrollbar-width" />
        </div>

        <div ref={bottomScrollRef} className="scrollbar-bottom" onScroll={handleBottomScroll}>
          <table className="data-table">
            <thead>
              <tr>
                {["Employee ID", "Employee Name", "Year", "Month", "Working Days", "Billed Days", "Total Leave Taken", "From Dates", "To Dates", "Approved Dates", "Sick Leave", "Casual Leave", "Paid Leave", "LOP", "Approved By", "Remarks", "Actions"].map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => {
                const dataIndex = startIndex + index;
                return (
                  <tr key={`${row.employee_id}-${row.year}-${row.month}`}>
                    <td>{row.employee_id}</td>
                    <td>{row.employee_name}</td>
                    <td>{row.isEditing ? (
                      <select
                        value={row.year}
                        onChange={(e) => handleInputChange(dataIndex, "year", e.target.value)}
                        className="input-field"
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    ) : row.year}</td>
                    <td>
                      {row.isEditing ? (
                        <select
                          value={row.month}
                          onChange={(e) => handleInputChange(dataIndex, "month", e.target.value)}
                          className="input-field"
                        >
                          {months.map((month) => (
                            <option key={month} value={month}>{month}</option>
                          ))}
                        </select>
                      ) : (() => {
                        const parsedMonth = new Date(row.month).toLocaleString('default', { month: 'short' });
                        return isNaN(Date.parse(row.month)) ? row.month : parsedMonth;
                      })()}
                    </td>

                    {["working_days", "billed_days"].map((field) => (
                      <td key={field}>
                        {row.isEditing ? (
                          <input
                            type="number"
                            value={row[field] || ""}
                            onChange={(e) => handleInputChange(dataIndex, field, e.target.value)}
                            className="input-field"
                          />
                        ) : row[field]}
                      </td>
                    ))}

                    <td>{row.isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={row.total_leave_taken || ""}
                        onChange={(e) => handleInputChange(dataIndex, "total_leave_taken", e.target.value)}
                        className="input-field"
                      />
                    ) : row.total_leave_taken}</td>

                    {["from_dates", "to_dates"].map((field) => (
                      <td key={field}>
                        {row.isEditing ? (
                          <div className="leave-date-inputs">
                            {row[field]?.map((date, i) => (
                              <input
                                key={i}
                                type="date"
                                value={date}
                                onChange={(e) => handleInputChange(dataIndex, field, e.target.value, i)}
                                className="input-field"
                              />
                            ))}
                          </div>
                        ) : row[field]?.join(", ")}
                      </td>
                    ))}

                    <td>
                      {row.isEditing ? (
                        <input
                          type="text"
                          value={row.approved_dates || ""}
                          onChange={(e) => handleInputChange(dataIndex, "approved_dates", e.target.value)}
                          className="input-field"
                          placeholder="e.g. 21-01-2025 is casual, 22-01-2025 is paid"
                        />
                      ) : (
                        row.approved_dates
                      )}
                    </td>

                    {["sick_leave", "casual_leave", "paid_leaves", "lop", "approved_by", "remarks"].map((field) => (
                      <td key={field}>
                        {row.isEditing ? (
                          <input
                            type="text"
                            value={row[field] || ""}
                            onChange={(e) => handleInputChange(dataIndex, field, e.target.value)}
                            className="input-field"
                          />
                        ) : row[field]}
                      </td>
                    ))}

                    <td>
                      {row.isEditing ? (
                        <Button
                          onClick={() => handleSave({ employee_id: row.employee_id, year: row.year, month: row.month })}
                          className="btn save-btn"
                        >Save</Button>
                      ) : (
                        <Button
                          onClick={() => handleEdit({ employee_id: row.employee_id, year: row.year, month: row.month })}
                          className="btn edit-btn"
                        >Edit</Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan="17" className="no-data-text">No data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pagination-controls">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="pagination-btn"
        >Prev</button>
        <span>{`Page ${currentPage} of ${totalPages}`}</span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >Next</button>
      </div>
    </div>
  );
};

export default EmployeeSalaryLeave;
