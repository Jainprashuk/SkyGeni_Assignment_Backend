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

// Read data from data.json
fs.readFile("./data.json", (err, rawData) => {
  if (err) {
    console.error("Error reading data.json:", err);
    return;
  }
  const data = JSON.parse(rawData);

  app.get("/" , (req,res)=>{
    let routeobj = {
     "for  pie chart data" : "/piedata",
    " for bar graph data" : "/bardata",
      " for table data" : "/tabe data"
    }
    res.send(routeobj)
  })

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

  // Define the route handler for /
  app.get("/tabledata", (req, res) => {
    const quarters = ["2023-Q3", "2023-Q4", "2024-Q1", "2024-Q2"];
    const customerTypes = ["Existing Customer", "New Customer"];
    const processedData = [
      ["Closed Fiscal Quarter", ...quarters, "Total"],
      ["Customer type", "# of oops", "Acv", "% of Total", "# of oops", "Acv", "% of Total", "# of oops", "Acv", "% of Total", "# of oops", "Acv", "% of Total", "# of oops", "Acv", "% of Total"]
    ];

    const totalSummary = { count: 0, acv: 0 };
    const summaries = customerTypes.map(type => {
      return quarters.map(quarter => {
        const entry = data.find(d => d.closed_fiscal_quarter === quarter && d.Cust_Type === type) || { count: 0, acv: 0 };
        totalSummary.count += entry.count;
        totalSummary.acv += entry.acv;
        return entry;
      });
    });

    const existingCustomerData = ["Existing Customer"];
    const newCustomerData = ["New Customer"];
    const totalData = ["Total"];

    let totalACV = 0;
    quarters.forEach((quarter, index) => {
      const existing = summaries[0][index];
      const newCust = summaries[1][index];
      const quarterTotalACV = Math.ceil(existing.acv + newCust.acv);
      totalACV += quarterTotalACV;

      const existingACVPercentage = Math.ceil((existing.acv / quarterTotalACV) * 100);
      const newCustomerACVPercentage = Math.ceil((newCust.acv / quarterTotalACV) * 100);

      existingCustomerData.push(
        existing.count,
        Math.ceil(existing.acv),
        `${existingACVPercentage}%`
      );
      newCustomerData.push(
        newCust.count,
        Math.ceil(newCust.acv),
        `${newCustomerACVPercentage}%`
      );

      if (quarter === "2024-Q2") {
        const existingSum = summaries[0].reduce((acc, val) => acc + val.acv, 0);
        const newCustomerSum = summaries[1].reduce((acc, val) => acc + val.acv, 0);

        existingCustomerData.push(
          summaries[0].reduce((acc, val) => acc + val.count, 0),
          Math.ceil(existingSum),
          `${Math.ceil((existingSum / totalACV) * 100)}%`
        );

        newCustomerData.push(
          summaries[1].reduce((acc, val) => acc + val.count, 0),
          Math.ceil(newCustomerSum),
          `${Math.ceil((newCustomerSum / totalACV) * 100)}%`
        );
      }

      totalData.push(existing.count + newCust.count, quarterTotalACV, '100%');
    });

    totalData.push(totalSummary.count, Math.ceil(totalACV), '100%');
    processedData.push(existingCustomerData, newCustomerData, totalData);

    res.json(processedData);
  });

  // Start the server
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});
