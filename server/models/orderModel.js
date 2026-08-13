// orderModel.js

const {
    ScanCommand,
    GetCommand,
    UpdateCommand
} = require("@aws-sdk/lib-dynamodb");

const dynamoDB = require("../database/dynamodb");

const TABLE_NAME = process.env.DYNAMODB_TABLE || "EcommerceDB";


// Get all orders
exports.getAllOrders = async () => {

    const result = await dynamoDB.send(
        new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: "entityType = :type",
            ExpressionAttributeValues: {
                ":type": "ORDER"
            }
        })
    );

    const orders = result.Items || [];

    const response = [];

    for (const order of orders) {

        const userResult = await dynamoDB.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `USER#${order.userId}`,
                    SK: "PROFILE"
                }
            })
        );

        const user = userResult.Item || {};

        response.push({
            orderId: order.orderId,
            fname: user.fname || "",
            lname: user.lname || "",
            createdDate: order.createdDate,
            totalPrice: order.totalPrice
        });
    }

    return response;
};


// Get order by ID
exports.getOrderById = async (orderId) => {

    const result = await dynamoDB.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `ORDER#${orderId}`,
                SK: "ORDER"
            }
        })
    );

    const order = result.Item;

    if (!order) {
        return [];
    }

    const userResult = await dynamoDB.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `USER#${order.userId}`,
                SK: "PROFILE"
            }
        })
    );

    const user = userResult.Item || {};

    return [{
        fname: user.fname || "",
        lname: user.lname || "",
        totalPrice: order.totalPrice,
        createdDate: order.createdDate,
        address: order.address || ""
    }];
};


// Get products belonging to an order
exports.getProductsByOrder = async (orderId) => {

    const result = await dynamoDB.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `ORDER#${orderId}`,
                SK: "ORDER"
            }
        })
    );

    const order = result.Item;

    if (!order || !order.items) {
        return [];
    }

    return order.items.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        totalPrice: item.totalPrice
    }));
};


// Update order
exports.updateOrder = async (orderId, newData) => {

    const fields = Object.keys(newData);

    if (fields.length === 0) {
        return {};
    }

    const expressionParts = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    fields.forEach((field, index) => {

        const nameKey = `#field${index}`;
        const valueKey = `:value${index}`;

        expressionParts.push(
            `${nameKey} = ${valueKey}`
        );

        expressionAttributeNames[nameKey] = field;
        expressionAttributeValues[valueKey] = newData[field];
    });

    const result = await dynamoDB.send(
        new UpdateCommand({
            TableName: TABLE_NAME,

            Key: {
                PK: `ORDER#${orderId}`,
                SK: "ORDER"
            },

            UpdateExpression:
                "SET " + expressionParts.join(", "),

            ExpressionAttributeNames:
                expressionAttributeNames,

            ExpressionAttributeValues:
                expressionAttributeValues,

            ReturnValues: "ALL_NEW"
        })
    );

    return result.Attributes;
};


// Get customer's past orders
exports.getPastOrdersByCustomerID = async (userId) => {

    const result = await dynamoDB.send(
        new ScanCommand({
            TableName: TABLE_NAME,

            FilterExpression:
                "entityType = :type AND userId = :userId",

            ExpressionAttributeValues: {
                ":type": "ORDER",
                ":userId": userId
            }
        })
    );

    const orders = result.Items || [];

    const response = [];

    for (const order of orders) {

        if (order.items) {

            for (const item of order.items) {

                response.push({
                    orderId: order.orderId,
                    name: item.name,
                    createdDate: order.createdDate,
                    quantity: item.quantity,
                    totalPrice: item.totalPrice
                });
            }
        }
    }

    return response;
};

