import express from "express";
import fs from "fs";
import cors from "cors";

const app = express();
const port = 3000;
app.use(cors());

const calculateCustomerData = (data) => {
  let oldTotal = 0;
  let newTotal = 0;

  data.forEach((entry) => {
    if (entry.Cust_Type === "Existing Customer") {
      oldTotal += entry.acv;
    } else if (entry.Cust_Type === "New Customer") {
      newTotal += entry.acv;
    }
  });

  return { oldTotal, newTotal };
};

fs.readFile("./data.json", (err, rawData) => {
  if (err) {
    console.error("Error reading data.json:", err);
    return;
  }
  const data = JSON.parse(rawData);

  // Define the route handler for /bardata
  app.get("/bardata", (req, res) => {
    const datatosend = [
      { quarter: "2023 Q3", oldCustomers: 0, newCustomers: 0 },
      { quarter: "2023 Q4", oldCustomers: 0, newCustomers: 0 },
      { quarter: "2024 Q1", oldCustomers: 0, newCustomers: 0 },
      { quarter: "2024 Q2", oldCustomers: 0, newCustomers: 0 },
    ];

    // Calculate old and new customers for each quarter
    data.forEach((entry) => {
      switch (entry.closed_fiscal_quarter) {
        case "2023-Q3":
          if (entry.Cust_Type === "Existing Customer") {
            datatosend[0].oldCustomers += entry.acv;
          } else if (entry.Cust_Type === "New Customer") {
            datatosend[0].newCustomers += entry.acv;
          }
          break;
        case "2023-Q4":
          if (entry.Cust_Type === "Existing Customer") {
            datatosend[1].oldCustomers += Math.ceil(entry.acv); // Use Math.ceil
          } else if (entry.Cust_Type === "New Customer") {
            datatosend[1].newCustomers += entry.acv;
          }
          break;
        case "2024-Q1":
          if (entry.Cust_Type === "Existing Customer") {
            datatosend[2].oldCustomers += entry.acv;
          } else if (entry.Cust_Type === "New Customer") {
            datatosend[2].newCustomers += entry.acv;
          }
          break;
        case "2024-Q2":
          if (entry.Cust_Type === "Existing Customer") {
            datatosend[3].oldCustomers += entry.acv;
          } else if (entry.Cust_Type === "New Customer") {
            datatosend[3].newCustomers += entry.acv;
          }
          break;
        default:
          break;
      }
    });

    // Convert numbers to 'k' format (e.g., 1000 to 1k)
    const formatNumber = (value) => {
      if (value >= 1000) {
        return `${(value / 1000).toFixed()}`;
      }
      return value;
    };

    // Format data before sending as JSON response
    const formattedData = datatosend.map(entry => ({
      quarter: entry.quarter,
      oldCustomers: formatNumber(entry.oldCustomers),
      newCustomers: formatNumber(entry.newCustomers)
    }));

    // Send the formatted data as JSON response
    res.json(formattedData);
  });

  // Define the route handler for /piedata
  app.get("/piedata", (req, res) => {
    const { oldTotal, newTotal } = calculateCustomerData(data);
    const piedata = [
      { label: 'Old', value: Math.ceil(oldTotal / 1000) },
      { label: 'New', value: Math.ceil(newTotal / 1000) }
    ];
    res.json(piedata);
  });
  

  // Start the server
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
});
