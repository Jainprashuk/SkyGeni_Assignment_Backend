import express from 'express'
import cors from 'cors'
const app = express();
const port = 4000;

app.use(cors())
// Sample JSON data
const data = [
    {"count": 46, "acv": 1322309.9899999998, "closed_fiscal_quarter": "2023-Q3", "Cust_Type": "Existing Customer"},
    {"count": 14, "acv": 983031.39, "closed_fiscal_quarter": "2023-Q3", "Cust_Type": "New Customer"},
    {"count": 45, "acv": 1124856.9500000002, "closed_fiscal_quarter": "2023-Q4", "Cust_Type": "Existing Customer"},
    {"count": 10, "acv": 387300, "closed_fiscal_quarter": "2023-Q4", "Cust_Type": "New Customer"},
    {"count": 51, "acv": 1360047.1599999997, "closed_fiscal_quarter": "2024-Q1", "Cust_Type": "Existing Customer"},
    {"count": 6, "acv": 313189.25, "closed_fiscal_quarter": "2024-Q1", "Cust_Type": "New Customer"},
    {"count": 23, "acv": 647821.48, "closed_fiscal_quarter": "2024-Q2", "Cust_Type": "Existing Customer"},
    {"count": 6, "acv": 224643.3, "closed_fiscal_quarter": "2024-Q2", "Cust_Type": "New Customer"}
  ];
  
  app.get('/', (req, res) => {
    // Process the data to create the required format
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

        // Calculate the sum for Existing Customer and New Customer in 2024-Q2
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


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
