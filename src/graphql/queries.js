/**
 * GraphQL query definitions for Costco API
 * @module graphql/queries
 */

/**
 * GraphQL query to fetch warehouse receipts (gas and merchandise)
 * @constant {string}
 */
export const RECEIPTS_WITH_COUNTS_QUERY = `
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
  }
`.replace(/\s+/g, ' ');

/**
 * GraphQL query to fetch online orders list
 * @constant {string}
 */
export const GET_ONLINE_ORDERS_QUERY = `
  query getOnlineOrders($startDate:String!, $endDate:String!, $pageNumber:Int, $pageSize:Int, $warehouseNumber:String!) {
    getOnlineOrders(startDate:$startDate, endDate:$endDate, pageNumber:$pageNumber, pageSize:$pageSize, warehouseNumber:$warehouseNumber) {
      pageNumber
      pageSize
      totalNumberOfRecords
      bcOrders {
        orderNumber: sourceOrderNumber 
      }
    }
  }
`.replace(/\s+/g, ' ');

/**
 * GraphQL query to fetch detailed order information
 * @constant {string}
 */
export const GET_ORDER_DETAILS_QUERY = `
  query getOrderDetails($orderNumbers: [String]) {
    getOrderDetails(orderNumbers:$orderNumbers) {
      warehouseNumber
      orderNumber: sourceOrderNumber 
      orderPlacedDate: orderedDate
      status
      locale
      orderReturnAllowed
      shopCardAppliedAmount
      walletShopCardAppliedAmount
      currency
      totalShippingTax
      estDeliveryMinDate
      estDeliveryMaxDate
      shippingTaxOnOrder
      shipments {
        shipmentNumber
        estDeliveryMinDate
        estDeliveryMaxDate
        shippingAddress {
          addressLine1
          addressLine2
          addressLine3
          city
          state
          country
          zipCode
          phone1
        }
        trackingNumbers {
          trackingNumber
        }
        lineItems {
          orderItemId
          itemNumber
          itemDescription
          partNumber
          itemQuantity
          lineExtension
          status
          itemUnitPrice
          itemTaxAmount
          itemTotalPrice
          itemShippingAmount
          shippingTax
          itemDeliveryHandlingCharge
          itemSavingsAmount
          itemInstallAmount
          quantityShipped
          inventoryStatus
          inventoryStatusCode
        }
      }
    }
  }
`.replace(/\s+/g, ' ');
