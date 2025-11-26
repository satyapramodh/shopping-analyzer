async function listOnlineOrders(startDate, endDate) {
    const pageSize = 50;
    let pageNumber = 1;
    let allOrders = [];
    let totalRecords = 0;

    do {
        const ordersData = await new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.responseType = 'json';
            xhr.open('POST', 'https://ecom-api.costco.com/ebusiness/order/v1/orders/graphql');
            xhr.setRequestHeader('Content-Type', 'application/json-patch+json');
            xhr.setRequestHeader('Costco.Env', 'ecom');
            xhr.setRequestHeader('Costco.Service', 'restOrders');
            xhr.setRequestHeader('Costco-X-Wcs-Clientid', localStorage.getItem('clientID'));
            xhr.setRequestHeader('Client-Identifier', '481b1aec-aa3b-454b-b81b-48187e28f205');
            xhr.setRequestHeader('Costco-X-Authorization', 'Bearer ' + localStorage.getItem('idToken'));
            
            const onlineOrdersQuery = {
                "query": `
                    query getOnlineOrders($startDate:String!, $endDate:String!, $pageNumber:Int , $pageSize:Int, $warehouseNumber:String! ){
                        getOnlineOrders(startDate:$startDate, endDate:$endDate, pageNumber : $pageNumber, pageSize :  $pageSize, warehouseNumber :  $warehouseNumber) {
                        pageNumber
                        pageSize
                        totalNumberOfRecords
                        bcOrders {
                            orderNumber : sourceOrderNumber 
                        }
                        }
                    }`.replace(/\s+/g,' '),
                "variables": {
                    "startDate": startDate,
                    "endDate": endDate,
                    "pageNumber": pageNumber,
                    "pageSize": pageSize,
                    "warehouseNumber": "847"
                }
            };
            
            xhr.onload = function() {
                if (xhr.status === 200) {
                    if (xhr.response.data && xhr.response.data.getOnlineOrders && xhr.response.data.getOnlineOrders.length > 0) {
                        resolve(xhr.response.data.getOnlineOrders[0]);
                    } else {
                        resolve(null);
                    }
                } else {
                    reject(xhr.status);
                }
            };
            
            xhr.onerror = function() {
                reject('Network Error');
            };
            
            xhr.send(JSON.stringify(onlineOrdersQuery));
        });

        if (ordersData) {
            totalRecords = ordersData.totalNumberOfRecords;
            if (ordersData.bcOrders) {
                allOrders = allOrders.concat(ordersData.bcOrders);
            }
            console.log(`Fetched page ${pageNumber}, got ${ordersData.bcOrders ? ordersData.bcOrders.length : 0} orders. Total so far: ${allOrders.length}/${totalRecords}`);
            
            if (allOrders.length >= totalRecords) {
                break;
            }
            pageNumber++;
        } else {
            break;
        }

    } while (true);

    return allOrders;
}

async function getOrderDetails(orderNumber) {
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
        
        const detailsQuery = {
            "query": `query getOrderDetails($orderNumbers: [String]) {
                getOrderDetails(orderNumbers:$orderNumbers) {
                    warehouseNumber
                    orderNumber : sourceOrderNumber 
                    orderPlacedDate : orderedDate
                    status
                    locale
                    orderReturnAllowed
                    shopCardAppliedAmount
                    walletShopCardAppliedAmount
                    giftOfMembershipAppliedAmount
                    orderCancelAllowed
                    orderPaymentFailed : orderPaymentEditAllowed
                    orderShippingEditAllowed
                    merchandiseTotal
                    retailDeliveryFee
                    shippingAndHandling
                    grocerySurcharge
                    frozenSurchargeFee
                    uSTaxTotal1
                    foreignTaxTotal1
                    foreignTaxTotal2
                    foreignTaxTotal3
                    foreignTaxTotal4  
                    orderTotal
                    firstName
                    lastName
                    line1
                    line2
                    line3
                    city
                    state
                    postalCode
                    countryCode
                    companyName
                    emailAddress
                    phoneNumber
                    membershipNumber
                    nonMemberSurchargeAmount
                    discountAmount
                    
                    retailDeliveryFees {
                    key
                    value
                    }
                    
                    developmentFees {
                        key
                        value
                    }
                    orderPayment {
                    paymentType
                    totalCharged
                    cardExpireMonth
                    cardExpireYear
                    nameOnCard
                    cardNumber
                    isGOMPayment
                    storedValueBucket
                    }
                    shipToAddress : orderShipTos {
                    referenceNumber
                    firstName
                    lastName
                    line1
                    line2
                    line3
                    city
                    state
                    postalCode
                    countryCode
                    companyName
                    emailAddress
                    phoneNumber : contactPhone
                    isShipToWarehouse
                    addressWarehouseName
                    giftMessage
                    giftToFirstName
                    giftToLastName
                    giftFromName
                    orderLineItems {
                        shipToWarehousePackageStatus
                        orderStatus
                        orderNumber
                        orderedDate
                        itemTypeId
                        isFeeItem
                        orderLineItemCancelAllowed
                        estimatedDeliveryDate
                        supplierAvailabilityDate
                        fulfilledBy  
                        itemNumber
                        itemDescription : sourceItemDescription
                        price : unitPrice
                        quantity : orderedTotalQuantity
                        merchandiseTotalAmount
                        lineItemId
                        sourceLineItemId
                        parentOrderLineItemId
                        itemId
                        isBuyAgainEligible
                        sequenceNumber : sourceSequenceNumber
                        parentOrderNumber
                        lineNumber
                        itemTypeId
                        replaceStatus
                        returnType
                        itemType
                        programType
                        minOrderDate
                        maxOrderDate
                        fSADescription
                        odsJobId
                        orderedShipMethodDescription
                        shippingChargeAmount
                        preferredArrivalDate
                        requestedDeliveryDate
                        returnStatus
                        productSerialNumber
                        configuredItemData
                        orderedShipMethod
                        isRescheduleEligible
                        deliveryReschedulingSite
                        scheduledDeliveryDate
                        scheduledDeliveryDateEnd
                        limitedReturnPolicyRule
                        isLimitedReturnPolicyExceeded
                        itemWeight
                        itemGroupNumber
                        isPerishable
                        carrierItemCategory
                        carrierContactPhone
                        isUPSMILabelEligible
                        parentLineNumber
                        isExchangeBlock
                        shipToAddressReferenceNumber
                        isVerificationRequired
                        isDept24
                        returnableQuantity
                        totalReturnedQuantity
                        exchangeOrderNumber
                        returnType
                        isGiftMessageSupported
                        isReturnCalendarEligible
                        programTypeId
                        inventoryWarehouseId
                        
                        configuredItemData
                        foreignTax1
                        foreignTax2
                        foreignTax3
                        foreignTax4
                        itemStatus {
                        orderPlaced {
                            quantity
                            transactionDate
                            orderLineItemId
                            lineItemStatusId
                            orderLineItemCancelAllowed
                            orderLineItemReturnAllowed
                        }
                        
                            readyForPickup {
                            quantity
                            transactionDate
                            orderLineItemId
                            lineItemStatusId
                            orderLineItemCancelAllowed
                            orderLineItemReturnAllowed
                            }
                        shipped {
                            quantity
                            transactionDate
                            orderLineItemId
                            lineItemStatusId
                            orderLineItemCancelAllowed
                            orderLineItemReturnAllowed
                        }
                        cancelled {
                            quantity
                            transactionDate
                            orderLineItemId
                            lineItemStatusId
                            orderLineItemCancelAllowed
                            orderLineItemReturnAllowed
                        }
                        returned {
                            quantity
                            transactionDate
                            orderLineItemId
                            lineItemStatusId
                            orderLineItemCancelAllowed
                            orderLineItemReturnAllowed
                        }
                        delivered {
                            quantity
                            transactionDate
                            orderLineItemId
                            lineItemStatusId
                            orderLineItemCancelAllowed
                            orderLineItemReturnAllowed
                        }
                        cancellationRequested {
                            quantity
                            transactionDate
                            orderLineItemId
                            lineItemStatusId
                            orderLineItemCancelAllowed
                            orderLineItemReturnAllowed
                        }
                        }
                        shipment {
                        lineNumber
                        orderNumber                    
                        packageNumber
                        trackingNumber
                        pickUpCompletedDate
                        pickUpReadyDate
                        carrierName
                        trackingSiteUrl
                        shippedDate
                        estimatedArrivalDate
                        deliveredDate
                        isDeliveryDelayed
                        isEstimatedArrivalDateEligible
                        reasonCode
                        trackingEvent {
                            event
                            carrierName
                            eventDate
                            estimatedDeliveryDate
                            scheduledDeliveryDate
                            trackingNumber
                        }
                        }
                    }
                    }
                }
            }`,
            "variables": {
                "orderNumbers": [orderNumber]
            }
        };
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                resolve(xhr.response.data.getOrderDetails);                
            } else {
                console.error("Error fetching details for " + orderNumber, xhr.status);
                reject(xhr.status);
            }
        };
        
        xhr.onerror = function() {
            console.error("Network error for " + orderNumber);
            reject("Network error");
        };
        
        xhr.send(JSON.stringify(detailsQuery));
    });
}

async function downloadOnlineOrders() {
    var startDateStr = '01/01/2020';
    var endDate = new Date();
    var endDateStr = endDate.toLocaleDateString('en-US', {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });
    
    console.log(`Starting download of online orders from ${startDateStr} to ${endDateStr}...`);
    var basicOrders = await listOnlineOrders(startDateStr, endDateStr);
    console.log(`Found ${basicOrders.length} orders. Fetching details for each...`);
    
    var detailedOrders = [];
    for (let i = 0; i < basicOrders.length; i++) {
        const orderNum = basicOrders[i].orderNumber;
        console.log(`Fetching details for order ${orderNum} (${i+1}/${basicOrders.length})...`);
        
        // Add a small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 300));
        
        try {
            var details = await getOrderDetails(orderNum);            
            if (details) {
                detailedOrders.push(details);
            } else {
                console.warn(`Failed to get details for ${orderNum}`);
            }
        } catch (e) {
            console.error(`Exception fetching ${orderNum}`, e);
        }
    }
    
    console.log(`Got ${detailedOrders.length} detailed orders, saving.`);
    
    // Sanitize PII
    const sanitizedOrders = detailedOrders.map(o => {
        const clean = { ...o };
        // Remove PII fields
        delete clean.firstName;
        delete clean.lastName;
        delete clean.line1;
        delete clean.line2;
        delete clean.line3;
        delete clean.emailAddress;
        delete clean.phoneNumber;
        delete clean.membershipNumber;
        delete clean.postalCode;
        
        // Clean Payment
        if (clean.orderPayment) {
            clean.orderPayment = { ...clean.orderPayment };
            delete clean.orderPayment.nameOnCard;
        }
        
        // Clean ShipTo
        if (clean.shipToAddress && Array.isArray(clean.shipToAddress)) {
            clean.shipToAddress = clean.shipToAddress.map(addr => {
                const a = { ...addr };
                delete a.firstName;
                delete a.lastName;
                delete a.line1;
                delete a.line2;
                delete a.line3;
                delete a.emailAddress;
                delete a.phoneNumber;
                delete a.giftToFirstName;
                delete a.giftToLastName;
                delete a.giftFromName;
                delete a.postalCode;
                return a;
            });
        }
        return clean;
    });

    var a = document.createElement('a');
    a.download = `costco-online-orders-${endDate.toISOString()}.json`;
    a.href = window.URL.createObjectURL(new Blob([JSON.stringify(sanitizedOrders, null, 2)], {type: 'text/plain'}));
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
}

await downloadOnlineOrders();