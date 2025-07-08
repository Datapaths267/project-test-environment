import React, { useState, useEffect } from 'react';
import './HomePage.css';
import CostRoi from '../../cost_vs_ROI_module/CostRoi';

export default function HomePage() {
  const role = localStorage.getItem('role');

  // State to manage visibility of CostRoi component
  const [showCostRoi, setShowCostRoi] = useState(false);

  // State to store data from the backend
  const [costRoiData, setCostRoiData] = useState([]);
  
  // State to track loading status
  const [loading, setLoading] = useState(false);

  // Fetch Cost vs ROI data from backend
  const fetchCostRoiData = async () => {
    setLoading(true);  // Show loading state
    try {
      const response = await fetch('http://localhost:8000/api/cost-vs-roi');
      const data = await response.json();
      setCostRoiData(data);
    } catch (error) {
      console.error("Error fetching Cost vs ROI data:", error);
    } finally {
      setLoading(false);  // Hide loading state
    }
  };

  // Fetch data only when component is visible
  useEffect(() => {
    if (showCostRoi && costRoiData.length === 0) {
      fetchCostRoiData();
    }
  }, [showCostRoi]); 

  return (
    <div className="home-container">
      <h2>{role === 'admin' ? 'Welcome Admin!' : 'Welcome User!'}</h2>
      <div>
        {/* Button that toggles the visibility of CostRoi */}
        <button className="home-button" onClick={() => setShowCostRoi(!showCostRoi)}>
          {showCostRoi ? 'Hide' : 'Calculate COST VS ROI'}
        </button>
        
        {/* Show loading message if data is being fetched */}
        {loading && <p>Loading data...</p>}

        {/* Conditionally render CostRoi component */}
        {showCostRoi && !loading && <CostRoi data={costRoiData} />}
      </div>
    </div>
  );
}

























// import React, { useState } from 'react';
// import './HomePage.css';
// import CostRoi from '../../cost_vs_ROI_module/CostRoi';

// export default function HomePage() {
//   const role = localStorage.getItem('role');
  
//   // State to manage visibility of CostRoi component
//   const [showCostRoi, setShowCostRoi] = useState(false);

//   // Toggle the visibility of CostRoi component
//   const handleButtonClick = () => {
//     setShowCostRoi(!showCostRoi);
//   };

//   return (
//     <>
//       <div className="home-container">
//         <h2>{role === 'admin' ? 'Welcome Admin!' : 'Welcome User!'}</h2>
//         <div>
//           {/* Button that toggles the visibility of CostRoi */}
//           <button className="home-button" onClick={handleButtonClick}>
//             Cost VS ROI
//           </button>
          
          
//           {/* Conditionally render CostRoi component */}
//           {showCostRoi && <CostRoi />}
          
//         </div>
//       </div>
//     </>
//   );
// }
