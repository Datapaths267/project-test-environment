import React, { useEffect, useState } from "react";
import axios from "axios";
import Button from '../../components/button/Button';
import { FaDownload, FaEye, FaUpload, FaEdit, FaTrash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ConFig.css";

export default function ConfigTable() {
    const [configData, setConfigData] = useState({});
    const [loading, setLoading] = useState(true);
    const [newValue, setNewValue] = useState({});
    const [showForm, setShowForm] = useState(false);

    const token = localStorage.getItem("authToken");

    useEffect(() => {
        fetchConfigData();
    }, []);

    const fetchConfigData = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}config/getAllConfig`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setConfigData(res.data);
        } catch (err) {
            console.error("Error fetching config data:", err);
            toast.error("Failed to fetch config data");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (type) => {
        const value = newValue[type]?.trim();
        if (!value) return;

        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL}config/addConfig`,
                { column: type, value },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Added new option to ${type.replace(/_/g, " ")}`);
            setNewValue({ ...newValue, [type]: "" });
            fetchConfigData();
        } catch (err) {
            console.error("Error adding option:", err);
            toast.error(`Failed to add option to ${type.replace(/_/g, " ")}`);
        }
    };

    const handleDelete = async (type, id) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete this row from '${type.replace(/_/g, " ")}'?`);
        if (!confirmDelete) return;

        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}config/deleteConfig/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { column: type },
            });
            toast.success(`Deleted option from ${type.replace(/_/g, " ")}`);
            fetchConfigData();
        } catch (err) {
            console.error("Error deleting option:", err);
            toast.error(`Failed to delete option from ${type.replace(/_/g, " ")}`);
        }
    };

    const handleCreateColumn = async (e) => {
        e.preventDefault();
        const columnName = newValue.columnName?.trim();

        if (!columnName) {
            toast.error("Column name cannot be empty");
            return;
        }

        try {
            await axios.post(
                `${process.env.REACT_APP_API_URL}config/createColumn`,
                { columnName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Column '${columnName}' created successfully`);
            setNewValue({ ...newValue, columnName: "" });
            setShowForm(false);
            fetchConfigData();
        } catch (err) {
            console.error("Error creating column:", err);
            toast.error("Failed to create column");
        }
    };

    const handleDeleteColumn = async (columnName) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the entire column '${columnName.replace(/_/g, " ")}'? This action cannot be undone.`);
        if (!confirmDelete) return;

        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}config/deleteColumn`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { columnName }
            });
            toast.success(`Column '${columnName.replace(/_/g, " ")}' deleted successfully`);
            fetchConfigData();
        } catch (err) {
            console.error("Error deleting column:", err);
            toast.error(`Failed to delete column '${columnName.replace(/_/g, " ")}'`);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="config-container">
            <h2 className="config-title">Configuration Settings</h2>

            <Button className="add-column-btn" onClick={() => setShowForm(!showForm)}>
                {showForm ? <FaEye /> : <FaEdit />} {showForm ? "Hide Form" : "Add New Column"}
            </Button>

            {showForm && (
                <div className="modal show d-block">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Create New Column</h5>
                                <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
                            </div>
                            <div className="modal-body">
                                <form onSubmit={handleCreateColumn}>
                                    <div className="mb-3">
                                        <label htmlFor="columnName" className="form-label">Column Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="columnName"
                                            placeholder="Enter new column name"
                                            value={newValue.columnName || ""}
                                            onChange={(e) => setNewValue({ ...newValue, columnName: e.target.value })}
                                        />
                                    </div>
                                    <Button type="submit">Submit</Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <table className="config-table">
                <tbody>
                    {Object.entries(configData).map(([type, values]) => (
                        <tr key={type} className="config-row">
                            <td className="config-type-cell">
                                <strong>{type.replace(/_/g, " ")}</strong>

                            </td>
                            <td className="config-values-cell">
                                <ul className="config-list">
                                    {values.map(({ id, value }) => (
                                        <li key={id} className="config-list-item">
                                            <span>{value}</span>
                                            <button
                                                onClick={() => handleDelete(type, id)}
                                                className="config-delete-btn"
                                                title="Delete row"
                                            >
                                                ❌
                                            </button>
                                        </li>
                                    ))}
                                    <li style={{ marginTop: "8px" }}>
                                        <input
                                            type="text"
                                            placeholder={`Add new ${type.replace(/_/g, " ")}`}
                                            value={newValue[type] || ""}
                                            onChange={(e) => setNewValue({ ...newValue, [type]: e.target.value })}
                                            className="config-input"
                                        />
                                        <button onClick={() => handleAdd(type)} className="config-add-btn">
                                            Add
                                        </button>
                                        <Button
                                            onClick={() => handleDeleteColumn(type)}
                                            className="config-delete-column-btn"
                                            title="Delete entire column"
                                            style={{ marginLeft: "10px", color: "red", cursor: "pointer" }}
                                        >
                                            <FaTrash /> Delete column
                                        </Button>
                                    </li>
                                </ul>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <ToastContainer />
        </div>
    );
}
