import React, { useState, useEffect } from 'react';
import './loCustomer.css';
import axios from 'axios';

export default function LOCustomer() {
  const [customers, setCustomers] = useState([]);
    const [selectedRows, setSelectedRows] = useState(new Set());

//   useEffect(() => {
//     fetch('http://localhost:8000/customerList') // Replace with your API URL
//       .then(response => response.json())
//       .then(data => setCustomers(data))
//       .catch(error => console.error('Error fetching data:', error));
//   }, []);

const getData =  async () => {
    console.log("response geted1 ");
    await axios.get(process.env.REACT_APP_API_URL+'customerList')
    .then(Response => {    console.log("response get "+JSON.stringify(Response));
        setCustomers(Response.data);
    }) 
} 

const handleCheckboxChange = (employeeId) => {
  setSelectedRows((prevSelected) => {
    const newSelected = new Set(prevSelected);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    return newSelected;
  });
};

useEffect( () => {getData()} , []);

  return (
    <div className='ListofCustomer-container'>
      <h2>List of Customers</h2> <br />
      <div className='customer-details'>
        <div className='grid-header'>
        <span> </span>
          <span className='customer_country'>Country</span>
          <span>Customer ID</span>
          <span>Name</span>
          <span>Address</span>
          <span className='customer_status'>Status</span>
        </div>
        {customers.map(customer => (
          <div key={customer.customer_id} 
          className={`grid-row ${selectedRows.has(customer.customer_id) ? 'selected-row' : ''}`}>
            <span> <input type='checkbox' 
                onChange={() => handleCheckboxChange(customer.customer_id)}
                checked={selectedRows.has(customer.customer_id)} ></input> </span>
            <span className='customer_country'>{customer.customer_country}</span>
            <span>{customer.customer_id}</span>
            <span className='customer_name'>{customer.customer_name}</span>
            <span>{customer.customer_address}</span>
            <span className={customer.customer_status === 'Active' ? 'active' : 'inactive'}>
              {customer.customer_status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
