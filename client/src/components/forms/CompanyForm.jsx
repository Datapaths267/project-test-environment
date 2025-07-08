import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Button from "../button/Button";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CompanyForm = ({ onClose }) => {
    const [formData, setFormData] = useState({
        companyName: "",
        companyType: "",
        companySeries: "",
        dateOfRegistration: "",
        status: "",
        multiLocation: "",
        registrationType: "",
        legalConnect: "",
        rateCardID: "",
        locationsPresence: "",
        countries: "",
        servicesOffer: "",
        registrationDocuments: null,
        companyProfileDeck: null,
        attachments: null,
        documents: null,
        caseStudies: null
    });
    const [location, setLocation] = useState([]);
    const [countries, setCountries] = useState([]);

    useEffect(() => {
        getData_from_city();
        getData();
    }, []);

    const getData = async () => {
        await axios.get(process.env.REACT_APP_API_URL + 'api/countryAll')
            .then(response => setCountries(response.data))
            .catch(error => console.error('Error fetching countries:', error));
    };

    const getData_from_city = async () => {
        await axios.get(process.env.REACT_APP_API_URL + 'api/city')
            .then(response => setLocation(response.data))
            .catch(error => console.error('Error fetching cities:', error));
    };

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
        console.log("Submitting form data:", formData);

        try {
            const formPayload = new FormData();
            Object.keys(formData).forEach((key) => {
                if (formData[key] !== null) {
                    formPayload.append(key.replace(/([A-Z])/g, "_$1").toLowerCase(), formData[key]); // Convert to snake_case
                }
            });

            const response = await axios.post(process.env.REACT_APP_API_URL + 'api/company/register', formPayload, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            toast.success("Company registered successfully!", { position: "top-center", autoClose: 3000 });
            console.log("Success:", response.data);

            setTimeout(() => {
                if (onClose) {
                    onClose(); // Close the form after submission
                }
            }, 1000);

        } catch (error) {
            console.error("Error:", error);
            toast.error("Error registering company", { position: "top-center", autoClose: 3000 });
        }
    };

    return (
        <div className="container mt-4">
            <ToastContainer />
            <form onSubmit={handleSubmit} className="g-3">

                {["companyName", "companySeries"].map((field) => (
                    <div className="mb-3" key={field}>
                        <label className="form-label">{field.replace(/([A-Z])/g, " $1").trim()} *</label>
                        <input type="text" className="form-control" name={field} value={formData[field]} onChange={handleChange} required />
                    </div>
                ))}


                <div className="mb-3">
                    <label className="form-label">Company Type </label>
                    <select className="form-select" name="companyType" value={formData.companyType} onChange={handleChange} required>
                        <option value="">Select</option>
                        <option value="IT Company">IT Company</option>
                        <option value="Retail">Retail</option>
                        <option value="Trading">Trading</option>
                    </select>
                </div>

                <div className="mb-3" key="dateOfRegistration">
                    <label className="form-label">Date Of Registration</label>
                    <input type="date" className="form-control" name="dateOfRegistration" value={formData.dateOfRegistration} onChange={handleChange} required />
                </div>

                <div className="mb-3">
                    <label className="form-label">Registration Type </label>
                    <select className="form-select" name="registrationType" value={formData.registrationType} onChange={handleChange} required>
                        <option value="">Select</option>
                        <option value="GST">GST</option>
                        <option value="MSME">MSME</option>
                        <option value="PF">PF</option>
                        <option value="PT">PT</option>
                    </select>
                </div>

                <div className="mb-3" key="registrationDocuments">
                    <label className="form-label">Registration Documents </label>
                    <input type="file" className="form-control" name="registrationDocuments" onChange={handleFileChange} required />
                </div>

                <div className="mb-3" key="companyProfileDeck">
                    <label className="form-label">Company ProfileDeck </label>
                    <input type="file" className="form-control" name="companyProfileDeck" onChange={handleFileChange} required />
                </div>

                <div className="mb-3">
                    <label className="form-label">Location </label>
                    <select className="form-select" name="locationsPresence" value={formData.locationsPresence} onChange={handleChange} required>
                        <option value="">Select</option>
                        {location.map((item) => (
                            <option key={item.com_id} value={item.com_city}>{item.com_city}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Countries *</label>
                    <select className="form-select" name="countries" value={formData.countries} onChange={handleChange} required>
                        <option value="">Select Country</option>
                        {countries.map((item) => (
                            <option key={item.id} value={item.name}>{item.name}</option>
                        ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Status </label>
                    <select className="form-select" name="status" value={formData.status} onChange={handleChange} required>
                        <option value="">Select</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Plan">Plan</option>
                        <option value="Closed">Closed</option>
                        <option value="TBD">TBD</option>
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Multi Location </label>
                    <select className="form-select" name="multiLocation" value={formData.multiLocation} onChange={handleChange} required>
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Services Offered (LOB) </label>
                    <select className="form-select" name="servicesOffer" value={formData.servicesOffer} onChange={handleChange} required>
                        <option value="">Select</option>
                        <option value="Salesforce">Salesforce</option>
                        <option value="SAP Hybris">SAP Hybris</option>
                        <option value="D 365">D 365</option>
                        <option value="Infrastructure">Infrastructure</option>
                        <option value="Cybersecurity">Cybersecurity</option>
                    </select>
                </div>

                {["legalConnect", "rateCardID"].map((field) => (
                    <div className="mb-3" key={field}>
                        <label className="form-label">{field.replace(/([A-Z])/g, " $1").trim()} *</label>
                        <input type="text" className="form-control" name={field} value={formData[field]} onChange={handleChange} required />
                    </div>
                ))}

                {["attachments", "documents", "caseStudies"].map((field) => (
                    <div className="mb-3" key={field}>
                        <label className="form-label">{field.replace(/([A-Z])/g, " $1").trim()} </label>
                        <input type="file" className="form-control" name={field} onChange={handleFileChange} required />
                    </div>
                ))}

                <div className="text-center">
                    <Button type="submit" className="btn btn-primary">Submit</Button>
                </div>
            </form>
        </div>
    );
};

export default CompanyForm;
