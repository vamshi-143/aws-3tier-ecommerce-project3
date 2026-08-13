// userModel.js

const {
    ScanCommand,
    PutCommand
} = require("@aws-sdk/lib-dynamodb");

const dynamoDB = require("../database/dynamodb");
const bcrypt = require("bcryptjs");
const {
    generateAccessAndRefreshToken
} = require("../utils/token");

const TABLE_NAME = process.env.DYNAMODB_TABLE || "EcommerceDB";

// Register user
exports.register = async (email, password, isAdmin, fname, lname) => {

    // Check whether email already exists
    const existingUsers = await dynamoDB.send(
        new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: "entityType = :type AND email = :email",
            ExpressionAttributeValues: {
                ":type": "USER",
                ":email": email
            }
        })
    );

    if (existingUsers.Items && existingUsers.Items.length > 0) {
        throw new Error("User already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate user ID
    const userId = `U${Date.now()}`;

    const user = {
        PK: `USER#${userId}`,
        SK: "PROFILE",
        entityType: "USER",

        userId: userId,
        email: email,
        password: hashedPassword,
        isAdmin: Boolean(isAdmin),
        fname: fname,
        lname: lname
    };

    // Save user to DynamoDB
    await dynamoDB.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: user
        })
    );

    return {
        userId: userId,
        email: email,
        isAdmin: Boolean(isAdmin),
        fname: fname,
        lname: lname
    };
};


// Login user
exports.login = async (email, password) => {

    // Find user by email
    const result = await dynamoDB.send(
        new ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: "entityType = :type AND email = :email",
            ExpressionAttributeValues: {
                ":type": "USER",
                ":email": email
            }
        })
    );

    if (!result.Items || result.Items.length === 0) {
        throw new Error("Invalid email or password");
    }

    const user = result.Items[0];

    // Compare password
    const isMatch = await bcrypt.compare(
        password,
        user.password
    );

    if (!isMatch) {
        throw new Error("Invalid email or password");
    }

    // User information for JWT
    const userData = {
        userId: user.userId,
        isAdmin: user.isAdmin
    };

    const {
        token,
        refreshToken
    } = generateAccessAndRefreshToken(userData);

    userData.token = token;
    userData.refreshToken = refreshToken;

    return [userData];
};

