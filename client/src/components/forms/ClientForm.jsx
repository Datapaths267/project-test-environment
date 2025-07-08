import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Button from "../button/Button";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const token = localStorage.getItem("authToken"); // Retrieve auth token
const companyId = localStorage.getItem("companyId"); // Extract selected customer IDs

const initialState = {
    customer: "",
    customerType: "",
    customerPOC: "",
    accountManagerPOC: "",
    address: "",
    nda: false,
    msa: false,
    country: "",
    billingCurrency: "",
    contacts: "",
    status: "",
    agreementType: "",
    fte_percentage: "",
    invoice_period: "",
    customerRating: "",
    rateFlag: "",
    reqRating: "",
    companyId: companyId || "",
    documents: null
};

const dropdownOptions = {
    customerType: ["Customer", "Lead", "Vendor", "Channel Partner", "Individual"],
    status: ["Active", "Not Active"],
    agreementType: ["FTE", "C2H", "C2C", "All"],
    customerRating: [1, 2, 3, 4],
    rateFlag: { 1: "Very Good", 2: "Good", 3: "Average", 4: "Tough" },
    reqRating: ["Good", "Average", "Tough"]
};

const ClientForm = ({ onClose }) => {
    const [formData, setFormData] = useState(initialState);
    const [countries, setCountries] = useState([]);

    useEffect(() => {
        axios.get(process.env.REACT_APP_API_URL + "api/countryAll")
            .then(response => setCountries(response.data))
            .catch(error => console.error("Error fetching countries:", error));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setFormData({ ...formData, [name]: files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Submitting form:", formData);

        try {
            const formPayload = new FormData();
            Object.keys(formData).forEach((key) => {
                if (formData[key] !== null) {
                    const formattedKey = key.replace(/([A-Z])/g, "_$1").toLowerCase(); // Convert to snake_case
                    formPayload.append(formattedKey, formData[key]);
                }
            });

            for (let [key, value] of formPayload.entries()) {
                console.log(`${key}:`, value);
            }

            // API request
            const response = await axios.post(`${process.env.REACT_APP_API_URL}customer/customer/register`, formPayload, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`
                },
            });
            console.log("API Response:", response.data);
            toast.success("Customer registered successfully!", { autoClose: 2000 });

            // Reset form & close modal
            setTimeout(() => {
                setFormData(initialState);
                onClose();
            }, 800);
            setFormData({ ...initialState, companyId });
        } catch (error) {
            console.error("Error:", error.response?.data || error.message);
            toast.error("Error registering customer", { autoClose: 2500 });
        }
    };

    return (
        <div className="container mt-4">
            <ToastContainer />
            <form onSubmit={handleSubmit} className="g-3">

                {["customer", "customerPOC", "accountManagerPOC", "address", "contacts"].map((field) => (
                    <div className="mb-3" key={field}>
                        <label className="form-label">{field.replace(/([A-Z])/g, " $1").trim()}</label>
                        <input type="text" className="form-control" name={field} value={formData[field]} onChange={handleChange} required />
                    </div>
                ))}

                {Object.entries(dropdownOptions).map(([key, options]) => (
                    <div className="mb-3" key={key}>
                        <label className="form-label">{key.replace(/([A-Z])/g, " $1").trim()} *</label>
                        <select className="form-select" name={key} value={formData[key]} onChange={handleChange} required>
                            <option value="">Select {key}</option>
                            {Array.isArray(options)
                                ? options.map(opt => <option key={opt} value={opt}>{opt}</option>)
                                : Object.entries(options).map(([val, label]) => <option key={val} value={val}>{label}</option>)
                            }
                        </select>
                    </div>
                ))}

                <div className="mb-3">
                    <label className="form-label">NDA Done?</label>
                    <input type="checkbox" className="form-check-input ms-2" name="nda" checked={formData.nda} onChange={handleChange} />
                </div>

                <div className="mb-3">
                    <label className="form-label">MSA Done?</label>
                    <input type="checkbox" className="form-check-input ms-2" name="msa" checked={formData.msa} onChange={handleChange} />
                </div>

                <div className="mb-3">
                    <label className="form-label">Country</label>
                    <select className="form-select" name="country" value={formData.country} onChange={handleChange} required>
                        <option value="">Select Country</option>
                        {countries.map(({ id, name }) => <option key={id} value={name}>{name}</option>)}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Billing Currency</label>
                    <select
                        className="form-select"
                        name="billingCurrency"
                        value={formData.billingCurrency}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Currency</option>
                        <option value="INR">₹ INR</option>   {/* India */}
                        <option value="USD">$ USD</option>   {/* USA */}
                        <option value="ZAR">R ZAR</option>   {/* South Africa */}
                        <option value="GBP">£ GBP</option>   {/* UK */}
                        {/* If needed, you can also add Africa (South Africa uses ZAR): */}

                    </select>
                </div>


                <div className="mb-3">
                    <label className="form-label"> FTE_Percentage (%) </label>
                    <input type="number" className="form-control" name="fte_percentage" value={formData.fte_percentage} onChange={handleChange} required />
                </div>

                <div className="mb-3">
                    <label className="form-label">Invoice Period</label>
                    <input type="number" className="form-control" name="invoice_period" value={formData.invoice_period} onChange={handleChange} required />
                </div>


                <div className="mb-3">
                    <label className="form-label">Documents</label>
                    <input type="file" className="form-control" name="documents" multiple onChange={handleFileChange} required />
                </div>

                <div className="text-center">
                    <Button type="submit" className="btn btn-primary">Submit</Button>
                </div>

            </form>
        </div>
    );
};

export default ClientForm;
