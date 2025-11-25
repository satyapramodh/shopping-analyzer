async function listGasReceipts(startDate, endDate) {
    return await new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open('POST', 'https://ecom-api.costco.com/ebusiness/order/v1/orders/graphql');
        xhr.setRequestHeader('Content-Type', 'application/json-patch+json');
        xhr.setRequestHeader('Costco.Env', 'ecom');
        xhr.setRequestHeader('Costco.Service', 'restOrders');
        xhr.setRequestHeader('Costco-X-Wcs-Clientid', localStorage.getItem('clientID'));
        xhr.setRequestHeader('Client-Identifier', '481b1aec-aa3b-454b-b81b-48187e28f205');
        xhr.setRequestHeader('Costco-X-Authorization', 'Bearer ' + localStorage.getItem('idToken'));
        
        const gasReceiptsQuery = {
            "query": `
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
                }`.replace(/\s+/g,' '),
            "variables": {
                "startDate": startDate,
                "endDate": endDate
            }
        };
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                resolve(xhr.response.data.receiptsWithCounts.receipts);
            } else {
                reject(xhr.status);
            }
        };
        
        xhr.onerror = function() {
            reject('Network Error');
        };
        
        xhr.send(JSON.stringify(gasReceiptsQuery));
    });
}

async function downloadGasReceipts() {
    var startDateStr = '01/01/2020';
    var endDate = new Date();
    var endDateStr = endDate.toLocaleDateString('en-US', {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
    
    var receipts = await listGasReceipts(startDateStr, endDateStr);
    console.log(`Got ${receipts.length} gas receipts, saving.`);
    
    var a = document.createElement('a');
    a.download = `costco-gas-${endDate.toISOString()}.json`;
    a.href = window.URL.createObjectURL(new Blob([JSON.stringify(receipts, null, 2)], {type: 'text/plain'}));
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
}

await downloadGasReceipts();