const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const port = process.env.PORT || 4055;

app.use(bodyParser.urlencoded({ extended: true }));

const mongoUrl = "mongodb://localhost:27017";
const dbName = "mydatabase";
let db;

MongoClient.connect(mongoUrl)
    .then((client) => {
        db = client.db(dbName);
        console.log(`Connected to MongoDB: ${dbName}`);
    })
    .catch(err => {
        console.error("Error connecting to MongoDB:", err);
    });

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "crud.html"));
});

app.post("/insert", async (req, res) => {
    const { name, phone, email, password, motherTongue } = req.body;
    if (!db) {
        res.status(500).send("Database not initialized");
        return;
    }
    try {
        await db.collection("items").insertOne({ name, phone, email, password, motherTongue });
        res.redirect("/report");
    } catch (err) {
        console.error("Error inserting data:", err);
        res.status(500).send("Failed to insert data");
    }
});

app.get("/report", async (req, res) => {
    try {
        const items = await db.collection("items").find().toArray();

        let tableContent = `
            <h1>Report</h1>
            <table border="1" cellpadding="5" cellspacing="0">
                <tr>
                    <th>Name</th>
                    <th>Phone Number</th>
                    <th>Email ID</th>
                    <th>Password</th>
                    <th>Mother Tongue</th>
                    <th>Action</th>
                </tr>
        `;

        items.forEach(item => {
            tableContent += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.phone}</td>
                    <td>${item.email}</td>
                    <td>${item.password}</td>
                    <td>${item.motherTongue}</td>
                    <td>
                        <form action="/delete" method="POST" style="display: inline;">
                            <input type="hidden" name="id" value="${item._id}">
                            <button type="submit">Delete</button>
                        </form>
                        <form action="/update" method="GET" style="display: inline;">
                            <input type="hidden" name="id" value="${item._id}">
                            <button type="submit">Update</button>
                        </form>
                    </td>
                </tr>
            `;
        });

        tableContent += "</table><a href='/'>Back to form</a>";

        res.send(tableContent);
    } catch (err) {
        console.error("Error fetching data:", err);
        res.status(500).send("Failed to fetch data");
    }
});

app.post("/delete", async (req, res) => {
    const { id } = req.body;
    if (!db) {
        res.status(500).send("Database not initialized");
        return;
    }
    try {
        const objectId = new ObjectId(id);
        await db.collection("items").deleteOne({ _id: objectId });
        res.redirect("/report");
    } catch (err) {
        console.error("Error deleting data:", err);
        res.status(500).send("Failed to delete data");
    }
});

app.get("/update", async (req, res) => {
    const { id } = req.query;
    if (!db) {
        res.status(500).send("Database not initialized");
        return;
    }
    try {
        const objectId = new ObjectId(id);
        const item = await db.collection("items").findOne({ _id: objectId });

        if (item) {
            res.send(`
                <h1>Update Item</h1>
                <form action="/update" method="POST">
                    <input type="hidden" name="id" value="${item._id}">
                    <div>
                        <label>Name:</label>
                        <input type="text" name="name" value="${item.name}" required>
                    </div>
                    <div>
                        <label>Phone Number:</label>
                        <input type="tel" name="phone" value="${item.phone}" required>
                    </div>
                    <div>
                        <label>Email ID:</label>
                        <input type="email" name="email" value="${item.email}" required>
                    </div>
                    <div>
                        <label>Password:</label>
                        <input type="password" name="password" value="${item.password}" required>
                    </div>
                    <div>
                        <label>Mother Tongue:</label>
                        <input type="text" name="motherTongue" value="${item.motherTongue}" required>
                    </div>
                    <button type="submit">Update</button>
                </form>
                <a href="/report">Back to report</a>
            `);
        } else {
            res.status(404).send("Item not found");
        }
    } catch (err) {
        console.error("Error fetching item:", err);
        res.status(500).send("Failed to fetch item");
    }
});

app.post("/update", async (req, res) => {
    const { id, name, phone, email, password, motherTongue } = req.body;
    if (!db) {
        res.status(500).send("Database not initialized");
        return;
    }
    try {
        const objectId = new ObjectId(id);
        const result = await db.collection("items").updateOne(
            { _id: objectId },
            { $set: { name, phone, email, password, motherTongue } }
        );
        if (result.matchedCount === 1) {
            res.redirect("/report");
        } else {
            res.status(404).send("Item not found or not updated");
        }
    } catch (err) {
        console.error("Error updating data:", err);
        res.status(500).send("Failed to update data");
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

