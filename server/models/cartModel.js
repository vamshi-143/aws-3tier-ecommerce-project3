const {
    GetCommand,
    PutCommand,
    UpdateCommand,
    DeleteCommand,
    QueryCommand,
    BatchWriteCommand
} = require("@aws-sdk/lib-dynamodb");

const dynamoDB = require("../database/dynamodb");

const TABLE_NAME = process.env.DYNAMODB_TABLE || "EcommerceDB";

// Get shopping cart
exports.getShoppingCart = async (userId) => {
    const result = await dynamoDB.send(
        new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
                ":pk": `USER#${userId}`,
                ":sk": "CART#"
            }
        })
    );

    const cartItems = result.Items || [];
    const products = [];

    for (const cartItem of cartItems) {
        const productResult = await dynamoDB.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `PRODUCT#${cartItem.productId}`,
                    SK: "PRODUCT"
                }
            })
        );

        const product = productResult.Item;

        if (product) {
            products.push({
                quantity: cartItem.quantity,
                name: product.name,
                price: product.price,
                productId: product.productId
            });
        }
    }

    return products;
};

// Add product to cart
exports.addToCart = async (
    customerId,
    productId,
    quantity,
    isPresent
) => {
    const key = {
        PK: `USER#${customerId}`,
        SK: `CART#${productId}`
    };

    if (isPresent) {
        const result = await dynamoDB.send(
            new UpdateCommand({
                TableName: TABLE_NAME,
                Key: key,
                UpdateExpression: "SET quantity = quantity + :quantity",
                ExpressionAttributeValues: {
                    ":quantity": Number(quantity)
                },
                ReturnValues: "ALL_NEW"
            })
        );

        return result.Attributes;
    }

    const cartItem = {
        PK: `USER#${customerId}`,
        SK: `CART#${productId}`,
        entityType: "CART",
        userId: customerId,
        productId: productId,
        quantity: Number(quantity)
    };

    await dynamoDB.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: cartItem
        })
    );

    return cartItem;
};

// Remove product from cart
exports.removeFromCart = async (productId, userId) => {
    const result = await dynamoDB.send(
        new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
                PK: `USER#${userId}`,
                SK: `CART#${productId}`
            },
            ReturnValues: "ALL_OLD"
        })
    );

    return result.Attributes || {};
};

// Buy / checkout
exports.buy = async (customerId, address) => {
    const cartResult = await dynamoDB.send(
        new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression:
                "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
                ":pk": `USER#${customerId}`,
                ":sk": "CART#"
            }
        })
    );

    const cartItems = cartResult.Items || [];

    if (cartItems.length === 0) {
        throw new Error("Shopping cart is empty");
    }

    const orderId = `O${Date.now()}`;

    let totalPrice = 0;
    const orderItems = [];

    for (const cartItem of cartItems) {
        const productResult = await dynamoDB.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: {
                    PK: `PRODUCT#${cartItem.productId}`,
                    SK: "PRODUCT"
                }
            })
        );

        const product = productResult.Item;

        if (!product) {
            continue;
        }

        const itemTotal =
            Number(product.price) *
            Number(cartItem.quantity);

        totalPrice += itemTotal;

        orderItems.push({
            productId: product.productId,
            name: product.name,
            price: Number(product.price),
            quantity: Number(cartItem.quantity),
            totalPrice: itemTotal
        });
    }

    if (orderItems.length === 0) {
        throw new Error("No valid products found in cart");
    }

    const order = {
        PK: `ORDER#${orderId}`,
        SK: "ORDER",
        entityType: "ORDER",
        orderId: orderId,
        userId: customerId,
        address: address,
        totalPrice: totalPrice,
        createdDate: new Date().toISOString(),
        items: orderItems
    };

    await dynamoDB.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: order
        })
    );

    const deleteRequests = cartItems.map(item => ({
        DeleteRequest: {
            Key: {
                PK: item.PK,
                SK: item.SK
            }
        }
    }));

    for (let i = 0; i < deleteRequests.length; i += 25) {
        const batch = deleteRequests.slice(i, i + 25);

        await dynamoDB.send(
            new BatchWriteCommand({
                RequestItems: {
                    [TABLE_NAME]: batch
                }
            })
        );
    }

    return {
        order: order,
        message: "Order placed successfully"
    };
};