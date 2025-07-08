import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Button from "../button/Button";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ContactForm({ onClose }) {
    const token = localStorage.getItem("authToken");
    const companyId = localStorage.getItem("companyId");

    const [contactFormData, setContactFormData] = useState({
        contactName: "",
        contactCallName: "",
        contactType: "",
        mobileNumber: "",
        email: "",
        status: "",
        role: "",
        address: "",
        notes: "",
        company_name: "",
        customer_id: "",
        company_id: companyId, // Fixed typo
    });
    const [customerCompany, setCustomerCompany] = useState([]);
    const [contactImage, setContactImage] = useState(null);

    useEffect(() => { fetchCustomerCompany() }, []);

    const fetchCustomerCompany = async (e) => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}customer/customerCompany`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { companyId }
                }
            );
            setCustomerCompany(response.data)

            // toast.success("Contact added successfully!", { position: "top-center", autoClose: 3000 });
            console.log("Success:", response.data);
        } catch (error) {
            console.error("Error:", error);
            // toast.error("Error registering contact form", { position: "top-center", autoClose: 3000 });
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setContactFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        setContactImage(e.target.files[0]);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Submitting contact form data:", contactFormData);

        const data = new FormData();
        Object.entries(contactFormData).forEach(([key, value]) => {
            data.append(key, value);
        });
        if (contactImage) {
            data.append("contact_image", contactImage);
        }

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}contacts/addContacts`,
                data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Reset
            setContactFormData({
                contactName: "",
                contactCallName: "",
                contactType: "",
                mobileNumber: "",
                email: "",
                status: "",
                role: "",
                address: "",
                notes: "",
                company_name: "",
                customer_id: "",
                company_id: companyId,
            });
            setContactImage(null);

            toast.success("Contact added successfully!", { position: "top-center", autoClose: 3000 });
            console.log("Success:", response.data);
            setTimeout(() => {
                if (onClose) onClose();
            }, 1000);
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error registering contact form", { position: "top-center", autoClose: 3000 });
        }
    };


    return (
        <div className="container mt-4">
            <form onSubmit={handleSubmit} className="g-3">
                <div className="mb-3">
                    <label className="form-label">Contact Image</label>
                    <input
                        type="file"
                        name="contact_image"
                        className="form-control"
                        onChange={handleFileChange}
                        accept="image/*"
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Contact Name *</label>
                    <input
                        type="text"
                        className="form-control"
                        name="contactName"
                        value={contactFormData.contactName}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Call Name *</label>
                    <input
                        type="text"
                        className="form-control"
                        name="contactCallName"
                        value={contactFormData.contactCallName}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Company Name</label>
                    <select
                        className="form-select"
                        name="customer_id"  // Ensure it matches the state key
                        value={contactFormData.customer_id} // Correct state key
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select</option>
                        {customerCompany.map((customer) => (
                            <option key={customer.customer_id} value={customer.customer_id}>
                                {customer.customer_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Contact Type</label>
                    <select className="form-select" name="contactType" value={contactFormData.contactType} onChange={handleChange} required>
                        <option value="">Select</option>
                        <option value="Customer">Customer</option>
                        <option value="Lead">Lead</option>
                        <option value="Vendor">Vendor</option>
                        <option value="Channel Partner">Channel Partner</option>
                        <option value="Individual">Individual</option>
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select className="form-select" name="status" value={contactFormData.status} onChange={handleChange} required>
                        <option value="">Select</option>
                        <option value="active">Active</option>
                        <option value="not active">Not Active</option>
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Mobile Number</label>
                    <input
                        type="text"
                        className="form-control"
                        name="mobileNumber"
                        value={contactFormData.mobileNumber}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={contactFormData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Role</label>
                    <input
                        type="text"
                        className="form-control"
                        name="role"
                        value={contactFormData.role}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Address</label>
                    <input
                        type="text"
                        className="form-control"
                        name="address"
                        value={contactFormData.address}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Notes</label>
                    <textarea
                        className="form-control"
                        name="notes"
                        value={contactFormData.notes}
                        onChange={handleChange}
                        required
                    ></textarea>
                </div>

                <div className="text-center">
                    <Button type="submit" className="btn-contact-submit">
                        Submit
                    </Button>
                </div>
            </form>
        </div>
    );
}
