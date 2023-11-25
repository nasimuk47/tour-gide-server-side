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
        const palageBookingCollection = client
            .db("TourDb")
            .collection("Bookings");

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

        // wishlist releted api
        // app.get("/WishList", async (req, res) => {
        //     const email = req.query.email;
        //     const query = { email: email };
        //     const result = await WhisListCollection.find(query).toArray();
        //     res.send(result);
        // });

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

                const result = await palageBookingCollection.insertOne(
                    bookingData
                );

                res.send(result);
            } catch (error) {
                console.error("Error in BookPackage route:", error);
                res.status(500).send("Internal Server Error");
            }
        });

        // ...

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
