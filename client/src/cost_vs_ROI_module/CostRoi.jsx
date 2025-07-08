import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

const CostRoiTable = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [file, setFile] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const allMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getMonthName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString("default", { month: "long" });
  };

  const fetchCostRoiData = () => {
    fetch("http://13.51.149.114:8000/api/cost-roi")
      .then((response) => response.json())
      .then((data) => {
        console.log("Raw Fetched Data:", data);

        const formattedData = data.map((row) => {
          const monthDate =
            row.month && typeof row.month === "string"
              ? row.month.split("T")[0]
              : "N/A";
          const monthName =
            monthDate !== "N/A" ? getMonthName(monthDate) : "N/A";

          return {
            ...row,
            month: monthDate,
            monthName,
            cummulative_sal_paid: row.cummulative_sal_paid || 0,
          };
        });

        setData(formattedData);
        setFilteredData(formattedData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCostRoiData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchCostRoiData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = data;
    if (monthFilter) {
      filtered = filtered.filter((row) => row.monthName === monthFilter);
    }
    if (employeeFilter) {
      filtered = filtered.filter((row) =>
        row.employee.toLowerCase().includes(employeeFilter.toLowerCase())
      );
    }
    setFilteredData(filtered);
  }, [monthFilter, employeeFilter, data]);

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cost Vs ROI");
    XLSX.writeFile(wb, "Cost_Vs_ROI.xlsx");
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an Excel file.");
      return;
    }

    const reader = new FileReader();
    reader.readAsBinaryString(file);

    reader.onload = async (e) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      console.log("Uploading Data:", jsonData);

      try {
        const response = await fetch("http://13.51.149.114:8000/api/upload-cost-roi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: jsonData }),
        });

        const result = await response.json();
        alert(result.message);
        fetchCostRoiData();
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Failed to upload data.");
      }
    };
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="ListofEmployee-container" style={{ 
      padding: "20px",
      fontFamily: "Brokman, Arial, sans-serif",
      background: darkMode ? "#121212" : "#fff",
      color: darkMode ? "#fff" : "#000",
      minHeight: "100vh"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Cost Vs ROI</h2>

      <button
        onClick={() => setDarkMode(!darkMode)}
        style={{
          marginBottom: "15px",
          padding: "5px 10px",
          cursor: "pointer",
          background: darkMode ? "#fff" : "#333",
          color: darkMode ? "#000" : "#fff",
          border: "none",
          borderRadius: "4px",
        }}
      >
        {darkMode ? "Light Mode 🌞" : "Dark Mode 🌙"}
      </button>

      <div className="filters-container" style={{ 
        marginBottom: "15px",
        display: "flex",
        gap: "10px"
      }}>
        <input
          type="text"
          placeholder="Search Employee"
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
          style={{
            padding: "5px 10px",
            border: "1px solid #ddd"
          }}
        />

        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          style={{
            padding: "5px 10px",
            border: "1px solid #ddd"
          }}
        >
          <option value="">All Months</option>
          {allMonths.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>

      <div className="buttons-container" style={{ 
        marginBottom: "15px",
        display: "flex",
        gap: "10px"
      }}>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileChange}
          style={{ display: "none" }}
          id="file-upload"
        />
        <label 
          htmlFor="file-upload"
          style={{
            padding: "5px 10px",
            background: "#222241",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Upload Excel
        </label>

        <button
          onClick={downloadExcel}
          style={{
            padding: "5px 10px",
            background: "#222241",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Download Excel
        </button>
      </div>

      <div className='employee-details' style={{ 
        marginRight: "10px",
        marginLeft:"-120px",
        display: "grid",
        gridTemplateColumns: "repeat(9, minmax(100px, auto))",
        gap: "0px",
        width: "max-content",
        color: darkMode ? "#fff" : "#000",
        border: "1px solid #ddd",
        overflowX: "auto"
      }}>
        <div className='employee-grid-header' style={{ display: "contents" }}>
          {["Month", "Employee", "Salary Gross", "Salary Net", "Cumulative Salary Paid", 
            "Status", "Min Returns Expected", "Returns Signed", "Returns Recognized"].map((header) => (
            <span key={header} style={{
              padding: "8px",
              border: "1px solid #ddd",
              textTransform: "uppercase",
              fontWeight: "600",
              backgroundColor: darkMode ? "#333" : "#fff",
              color: darkMode ? "#fff" : "#292929",
              fontSize: "15px"
            }}>
              {header}
            </span>
          ))}
        </div>

        {filteredData.map((row, index) => (
          <div key={index} className='employee-grid-row' style={{ 
            display: "contents",
            color: darkMode ? "#e0e0e0" : "#575757"
          }}>
            <span style={{ 
              padding: "5px 10px", 
              border: "1px solid #ddd",
              backgroundColor: darkMode 
                ? index % 2 === 0 ? "#1e1e1e" : "#2a2a2a" 
                : index % 2 === 0 ? "#ffffff" : "#f8f9fa"
            }}>{row.month}</span>
            <span style={{ 
              padding: "5px 10px", 
              border: "1px solid #ddd",
              color: "rgb(24, 172, 231)",
              backgroundColor: darkMode 
                ? index % 2 === 0 ? "#1e1e1e" : "#2a2a2a" 
                : index % 2 === 0 ? "#ffffff" : "#f8f9fa"
            }}>{row.employee}</span>
            <span style={{ 
              padding: "5px 10px", 
              border: "1px solid #ddd",
              backgroundColor: darkMode 
                ? index % 2 === 0 ? "#1e1e1e" : "#2a2a2a" 
                : index % 2 === 0 ? "#ffffff" : "#f8f9fa"
            }}>{row.salary_gross}</span>
            <span style={{ 
              padding: "5px 10px", 
              border: "1px solid #ddd",
              backgroundColor: darkMode 
                ? index % 2 === 0 ? "#1e1e1e" : "#2a2a2a" 
                : index % 2 === 0 ? "#ffffff" : "#f8f9fa"
            }}>{row.salary_net}</span>
            <span style={{ 
              padding: "5px 10px", 
              border: "1px solid #ddd",
              backgroundColor: darkMode 
                ? index % 2 === 0 ? "#1e1e1e" : "#2a2a2a" 
                : index % 2 === 0 ? "#ffffff" : "#f8f9fa"
            }}>{row.cummulative_sal_paid}</span>
            <span style={{ 
              padding: "5px 10px", 
              border: "1px solid #ddd",
              fontWeight: "bold",
              color: row.status === "Active" ? "green" : "red",
              backgroundColor: darkMode 
                ? index % 2 === 0 ? "#1e1e1e" : "#2a2a2a" 
                : index % 2 === 0 ? "#ffffff" : "#f8f9fa"
            }}>{row.status}</span>
            <span style={{ 
              padding: "5px 10px", 
              border: "1px solid #ddd",
              backgroundColor: darkMode 
                ? index % 2 === 0 ? "#1e1e1e" : "#2a2a2a" 
                : index % 2 === 0 ? "#ffffff" : "#f8f9fa"
            }}>{row.min_returns_expected}</span>
            <span style={{ 
              padding: "5px 10px", 
              border: "1px solid #ddd",
              backgroundColor: darkMode 
                ? index % 2 === 0 ? "#1e1e1e" : "#2a2a2a" 
                : index % 2 === 0 ? "#ffffff" : "#f8f9fa"
            }}>{row.returns_signed}</span>
            <span style={{ 
              padding: "5px 10px", 
              border: "1px solid #ddd",
              backgroundColor: darkMode 
                ? index % 2 === 0 ? "#1e1e1e" : "#2a2a2a" 
                : index % 2 === 0 ? "#ffffff" : "#f8f9fa"
            }}>
              {Math.max((row.returns_signed || 0) - (row.min_returns_expected || 0), 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CostRoiTable;
















{/*import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

const CostRoiTable = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [file, setFile] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const fetchCostRoiData = () => {
    fetch("http://13.51.149.114:8000/api/cost-roi")
      .then((response) => response.json())
      .then((data) => {
        console.log("Raw Fetched Data:", data);

        const formattedData = data.map((row) => ({
          ...row,
          month: row.month && typeof row.month === "string" ? row.month.split("T")[0] : "N/A",
          cummulative_sal_paid: row.cummulative_sal_paid || 0,
        }));

        setData(formattedData);
        setFilteredData(formattedData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCostRoiData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchCostRoiData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = data;
    if (monthFilter) {
      filtered = filtered.filter((row) => row.month.includes(monthFilter));
    }
    if (employeeFilter) {
      filtered = filtered.filter((row) =>
        row.employee.toLowerCase().includes(employeeFilter.toLowerCase())
      );
    }
    setFilteredData(filtered);
  }, [monthFilter, employeeFilter, data]);

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cost Vs ROI");
    XLSX.writeFile(wb, "Cost_Vs_ROI.xlsx");
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an Excel file.");
      return;
    }

    const reader = new FileReader();
    reader.readAsBinaryString(file);

    reader.onload = async (e) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      console.log("Uploading Data:", jsonData);

      try {
        const response = await fetch("http://13.51.149.114:8000/api/upload-cost-roi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: jsonData }),
        });

        const result = await response.json();
        alert(result.message);
        fetchCostRoiData();
      } catch (error) {
        console.error("Upload failed:", error);
        alert("Failed to upload data.");
      }
    };
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        background: darkMode ? "#121212" : "#fff",
        color: darkMode ? "#fff" : "#000",
        minHeight: "100vh",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Cost Vs ROI</h2>

      <button
        onClick={() => setDarkMode(!darkMode)}
        style={{
          marginBottom: "10px",
          padding: "10px",
          cursor: "pointer",
          background: darkMode ? "#fff" : "#333",
          color: darkMode ? "#000" : "#fff",
          border: "none",
          borderRadius: "5px",
        }}
      >
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>

      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        >
          <option value="">All Months</option>
          {[...new Set(data.map((row) => row.month))].map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search Employee"
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
        />
      </div>

      <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        style={{
          marginLeft: "10px",
          padding: "10px",
          cursor: "pointer",
          background: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
        }}
      >
        Upload Excel
      </button>

      <button
        onClick={downloadExcel}
        style={{
          marginLeft: "10px",
          padding: "10px",
          cursor: "pointer",
          background: "#28a745",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
        }}
      >
        Download Excel
      </button>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
          marginTop: "10px",
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: darkMode ? "#444" : "#007bff",
              color: "white",
              textAlign: "left",
            }}
          >
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Month</th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Employee</th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Salary Gross</th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Salary Net</th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Cumulative Salary Paid</th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Status</th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Min Returns Expected</th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Returns Signed</th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Returns Recognized</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, index) => (
            <tr
              key={index}
              style={{
                backgroundColor: darkMode
                  ? index % 2 === 0
                    ? "#333"
                    : "#222"
                  : index % 2 === 0
                    ? "#f8f9fa"
                    : "white",
              }}
            >
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>{row.month}</td>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>{row.employee}</td>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>{row.salary_gross}</td>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>{row.salary_net}</td>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>{row.cummulative_sal_paid}</td>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>{row.status}</td>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>{row.min_returns_expected}</td>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>{row.returns_signed}</td>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                {Math.max((row.returns_signed || 0) - (row.min_returns_expected || 0), 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CostRoiTable;   */}
