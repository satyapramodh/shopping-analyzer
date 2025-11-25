// 1. Go to https://www.costco.com/OrderStatusCmd
// 2. Open Developer Tools (F12) -> Console
// 3. Paste this entire script and run it.

const CONFIG = {
    startDate: '01/01/2020', // Unified start date for both
    endpoints: {
        url: 'https://ecom-api.costco.com/ebusiness/order/v1/orders/graphql',
        clientId: '481b1aec-aa3b-454b-b81b-48187e28f205'
    }
};

// Helper to make the API request
async function fetchGraphQL(query, variables) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open('POST', CONFIG.endpoints.url);
        xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
        xhr.setRequestHeader('Content-Type', 'application/json-patch+json');
        xhr.setRequestHeader('Costco.Env', 'ecom');
        xhr.setRequestHeader('Costco.Service', 'restOrders');
        xhr.setRequestHeader('Costco-X-Wcs-Clientid', localStorage.getItem('clientID'));
        xhr.setRequestHeader('Client-Identifier', CONFIG.endpoints.clientId);
        xhr.setRequestHeader('Costco-X-Authorization', 'Bearer ' + localStorage.getItem('idToken'));

        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve(xhr.response.data);
            } else {
                reject(`Error ${xhr.status}: ${xhr.statusText}`);
            }
        };
        xhr.onerror = () => reject('Network Error');
        
        xhr.send(JSON.stringify({ query, variables }));
    });
}

const QUERIES = {
    standard: `
        query receipts($startDate: String!, $endDate: String!) {
            receipts(startDate: $startDate, endDate: $endDate) {
                warehouseName
                documentType
                transactionDateTime
                transactionDate
                companyNumber
                warehouseNumber
                operatorNumber
                warehouseShortName
                registerNumber
                transactionNumber
                transactionType
                transactionBarcode
                total
                warehouseAddress1
                warehouseAddress2
                warehouseCity
                warehouseState
                warehouseCountry
                warehousePostalCode
                totalItemCount
                subTotal
                taxes
                itemArray {
                    itemNumber
                    itemDescription01
                    frenchItemDescription1
                    itemDescription02
                    frenchItemDescription2
                    itemIdentifier
                    unit
                    amount
                    taxFlag
                    merchantID
                    entryMethod
                }
                tenderArray {
                    tenderTypeCode
                    tenderDescription
                    amountTender
                    displayAccountNumber
                    sequenceNumber
                    approvalNumber
                    responseCode
                    transactionID
                    merchantID
                    entryMethod
                }
                couponArray {
                    upcnumberCoupon
                    voidflagCoupon
                    refundflagCoupon
                    taxflagCoupon
                    amountCoupon
                }
                subTaxes {
                    tax1
                    tax2
                    tax3
                    tax4
                    aTaxPercent
                    aTaxLegend
                    aTaxAmount
                    bTaxPercent
                    bTaxLegend
                    bTaxAmount
                    cTaxPercent
                    cTaxLegend
                    cTaxAmount
                    dTaxAmount
                }
                instantSavings
                membershipNumber
            }
        }`.replace(/\s+/g, ' '),
    
    gas: `
        query receiptsWithCounts($startDate: String!, $endDate: String!) {
            receiptsWithCounts(startDate: $startDate, endDate: $endDate) {
                receipts {
                    warehouseName
                    receiptType
                    documentType
                    transactionDateTime
                    transactionDate
                    companyNumber
                    warehouseNumber
                    operatorNumber
                    warehouseShortName
                    registerNumber
                    transactionNumber
                    transactionType
                    transactionBarcode
                    total
                    warehouseAddress1
                    warehouseAddress2
                    warehouseCity
                    warehouseState
                    warehouseCountry
                    warehousePostalCode
                    totalItemCount
                    subTotal
                    taxes
                    invoiceNumber
                    sequenceNumber
                    itemArray {
                        itemNumber
                        itemDescription01
                        frenchItemDescription1
                        itemDescription02
                        frenchItemDescription2
                        itemIdentifier
                        itemDepartmentNumber
                        unit
                        amount
                        taxFlag
                        merchantID
                        entryMethod
                        transDepartmentNumber
                        fuelUnitQuantity
                        fuelGradeCode
                        itemUnitPriceAmount
                        fuelUomCode
                        fuelUomDescription
                        fuelUomDescriptionFr
                        fuelGradeDescription
                        fuelGradeDescriptionFr
                    }
                    tenderArray {
                        tenderTypeCode
                        tenderSubTypeCode
                        tenderDescription
                        amountTender
                        displayAccountNumber
                        sequenceNumber
                        approvalNumber
                        responseCode
                        tenderTypeName
                        transactionID
                        merchantID
                        entryMethod
                        tenderAcctTxnNumber
                        tenderAuthorizationCode
                        tenderTypeNameFr
                        tenderEntryMethodDescription
                        walletType
                        walletId
                        storedValueBucket
                    }
                    subTaxes {
                        tax1
                        tax2
                        tax3
                        tax4
                        aTaxPercent
                        aTaxLegend
                        aTaxAmount
                        bTaxPercent
                        bTaxLegend
                        bTaxAmount
                        cTaxPercent
                        cTaxLegend
                        cTaxAmount
                        dTaxAmount
                    }
                    instantSavings
                    membershipNumber
                }
            }
        }`.replace(/\s+/g, ' ')
};

function triggerDownload(data, filename) {
    const a = document.createElement('a');
    a.download = filename;
    a.href = window.URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'text/plain' }));
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

async function downloadAllReceipts() {
    const endDate = new Date();
    const endDateStr = endDate.toLocaleDateString('en-US', { year: "numeric", month: "2-digit", day: "2-digit" });
    const variables = { startDate: CONFIG.startDate, endDate: endDateStr };

    console.log(`Starting download for range: ${CONFIG.startDate} to ${endDateStr}...`);

    try {
        // Fetch both in parallel
        const [standardData, gasData] = await Promise.all([
            fetchGraphQL(QUERIES.standard, variables),
            fetchGraphQL(QUERIES.gas, variables)
        ]);

        const standardReceipts = standardData.receipts || [];
        const gasReceipts = gasData.receiptsWithCounts?.receipts || [];

        console.log(`Found ${standardReceipts.length} standard receipts.`);
        console.log(`Found ${gasReceipts.length} gas receipts.`);

        if (standardReceipts.length > 0) {
            triggerDownload(standardReceipts, `costco-${endDate.toISOString()}.json`);
        }
        
        if (gasReceipts.length > 0) {
            triggerDownload(gasReceipts, `costco-gas-${endDate.toISOString()}.json`);
        }

        console.log("Download complete.");

    } catch (error) {
        console.error("Error fetching receipts:", error);
    }
}

await downloadAllReceipts();
