const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qtgfrql.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const PakageCollection = client.db("TourDb").collection("OurPakage");
        const GuiderListCollection = client
            .db("TourDb")
            .collection("GuiderList");
        const WhisListCollection = client.db("TourDb").collection("WishList");
        const TourpakageCollection = client
            .db("TourDb")
            .collection("Tourpakage");
        const pakageBookingCollection = client
            .db("TourDb")
            .collection("Bookings");
        const ReviwsCollection = client.db("TourDb").collection("reviews");
        const userCollection = client.db("TourDb").collection("users");

        // _______________________________________________________________

        app.post("/users", async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({
                    message: "user already exists",
                    insertedId: null,
                });
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        app.get("/users", async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });

        app.get("/users/admin/:email", async (req, res) => {
            const email = req.params.email;

            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === "admin";
            }
            res.send({ admin });
        });

        // get guider email

        app.get("/users/guide/:email", async (req, res) => {
            const email = req.params.email;

            const query = { email: email };
            const user = await userCollection.findOne(query);
            let guide = false; // Change variable name to 'guide'
            if (user) {
                guide = user?.role === "guide"; // Change 'admin' to 'guide'
            }
            res.send({ guide }); // Change 'admin' to 'guide' in the response
        });

        // make admin
        app.patch(
            "/users/admin/:id",

            async (req, res) => {
                const id = req.params.id;
                const filter = { _id: new ObjectId(id) };
                const updatedDoc = {
                    $set: {
                        role: "admin",
                    },
                };
                const result = await userCollection.updateOne(
                    filter,
                    updatedDoc
                );
                res.send(result);
            }
        );

        // make guide
        app.patch("/users/guide/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: "guide",
                },
            };
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        });

        app.delete("/users/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        });

        // get popoler pakage
        app.get("/UserPakage", async (req, res) => {
            const result = await PakageCollection.find().toArray();
            res.send(result);
        });
        // get guide list
        app.get("/GuiderList", async (req, res) => {
            const result = await GuiderListCollection.find().toArray();
            res.send(result);
        });

        // tourpakage get
        app.get("/TourPakage", async (req, res) => {
            const result = await TourpakageCollection.find().toArray();
            res.send(result);
        });

        // post TourPakage

        app.post("/TourPakage", async (req, res) => {
            try {
                const {
                    spotPhoto,
                    Type,
                    tripTitle,
                    price,
                    detailsPhoto,
                    detailsDescription,
                } = req.body;

                // Validate the required fields
                if (
                    !spotPhoto ||
                    !Type ||
                    !tripTitle ||
                    !price ||
                    !detailsPhoto ||
                    !detailsDescription
                ) {
                    return res
                        .status(400)
                        .json({ error: "Missing required fields." });
                }

                const pakagedata = {
                    spotPhoto: spotPhoto,
                    Type: Type,
                    tripTitle: tripTitle,
                    price: price,
                    detailsPhoto: detailsPhoto,
                    detailsDescription: detailsDescription,
                };

                const result = await TourpakageCollection.insertOne(pakagedata);

                console.log("New Package added successfully:", result);

                res.status(201).json({
                    message: "Package added successfully",
                    insertedId: result.insertedId,
                });
            } catch (error) {
                console.error("Error adding package:", error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });

        app.get("/reviews", async (req, res) => {
            const result = await ReviwsCollection.find().toArray();
            res.send(result);
        });

        // Move the specific route below the general one
        app.get("/reviews/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await ReviwsCollection.findOne(query);
            if (result) {
                res.send(result);
            } else {
                res.status(404).send("Review not found");
            }
        });

        app.post("/reviews", async (req, res) => {
            try {
                const { name, details, spotpicture, rating, description } =
                    req.body;
                console.log("Received data:", req.body);

                const reviewData = {
                    name: name,
                    details: details,
                    spotpicture: spotpicture,
                    rating: rating,
                    description: description,
                };

                const result = await ReviwsCollection.insertOne(reviewData);

                console.log("Review added successfully:", result);

                res.send(result);
            } catch (error) {
                console.error("Error adding review:", error);
                res.status(500).send("Internal Server Error");
            }
        });

        app.post("/AddToWishlist", async (req, res) => {
            try {
                const { email, packageId } = req.body;

                // Check if the package is already in the wishlist
                const existingItem = await WhisListCollection.findOne({
                    email: email,
                    packageId: packageId,
                });

                if (!existingItem) {
                    const result = await WhisListCollection.insertOne({
                        email: email,
                        packageId: packageId,
                        PakagePhoto: req.body.PakagePhoto,
                        price: req.body.price,
                    });
                    res.send(result);
                } else {
                    res.status(400).send("Package already in wishlist");
                }
            } catch (error) {
                console.error("Error in AddToWishlist route:", error);
                res.status(500).send("Internal Server Error");
            }
        });

        app.get("/WishList", async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await WhisListCollection.find(query).toArray();
            res.send(result);
        });

        app.delete("/WishList/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await WhisListCollection.deleteOne(query);
            res.send(result);
        });

        // bokings collection
        app.post("/BookPackage", async (req, res) => {
            try {
                const {
                    pakageName,
                    name,
                    email,
                    touristPhoto,
                    price,
                    tourDate,
                    guideName,
                    packageId,
                    status,
                } = req.body;

                const bookingData = {
                    pakageName: pakageName,
                    name: name,
                    email: email,
                    touristPhoto: touristPhoto,
                    price: price,
                    tourDate: new Date(tourDate),
                    guideName: guideName,
                    packageId: packageId,
                    status: status,
                };

                const result = await pakageBookingCollection.insertOne(
                    bookingData
                );

                res.send(result);
            } catch (error) {
                console.error("Error in BookPackage route:", error);
                res.status(500).send("Internal Server Error");
            }
        });

        // Server-side code (not provided)
        app.get("/Bookings", async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await pakageBookingCollection.find(query).toArray();
            res.send(result);
        });

        //    _____________________________________________________

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Tour is ready");
});

app.listen(port, () => {
    console.log(`Tour is Ready on port ${port}`);
});
