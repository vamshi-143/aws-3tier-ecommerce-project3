const {
    ScanCommand,
    GetCommand,
    PutCommand,
    UpdateCommand,
    DeleteCommand
} = require("@aws-sdk/lib-dynamodb");

const dynamoDB = require("../database/dynamodb");

const TABLE_NAME = process.env.DYNAMODB_TABLE || "EcommerceDB";

// Get all products
exports.getAllProducts = async () => {
    const result = await dynamoDB.send(
        new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: "entityType = :type",
            ExpressionAttributeValues: {
                ":type": "PRODUCT"
            }
        })
    );

    return result.Items || [];
};

// Get product by ID
exports.getProductDetailsById = async (productId) => {
    const result = await dynamoDB.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `PRODUCT#${productId}`,
                SK: "PRODUCT"
            }
        })
    );

    return result.Item || {};
};

// Create product
exports.createProduct = async (name, price, description) => {
    const productId = `P${Date.now()}`;

    const product = {
        PK: `PRODUCT#${productId}`,
        SK: "PRODUCT",
        entityType: "PRODUCT",
        productId: productId,
        name: name,
        price: Number(price),
        description: description,
        imageUrl: ""
    };

    await dynamoDB.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: product
        })
    );

    return product;
};

// Update product
exports.updateProduct = async (productId, name, price, description) => {
    const result = await dynamoDB.send(
        new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `PRODUCT#${productId}`,
                SK: "PRODUCT"
            },
            UpdateExpression:
                "SET #name = :name, price = :price, description = :description",
            ExpressionAttributeNames: {
                "#name": "name"
            },
            ExpressionAttributeValues: {
                ":name": name,
                ":price": Number(price),
                ":description": description
            },
            ReturnValues: "ALL_NEW"
        })
    );

    return result.Attributes;
};

// Delete product
exports.deleteProduct = async (productId) => {
    const result = await dynamoDB.send(
        new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `PRODUCT#${productId}`,
                SK: "PRODUCT"
            },
            ReturnValues: "ALL_OLD"
        })
    );

    return result.Attributes || {};
};

// Orders by product
exports.allOrderByProductId = async () => {
    return [];
};