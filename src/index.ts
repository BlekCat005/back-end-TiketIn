import express from "express";
import router from "./routes/api";
import bodyParser from "body-parser";
import db from "./utils/database";
import docs from "./docs/route";
import cors from "cors";
import errorMiddleware from "./middlewares/error.middleware";

async function init() {
  try {
    const result = await db();

    console.log("database status:", result);

    const PORT = 3000;
    const app = express();

    const allowedOrigins = [
      "http://localhost:3001",
      "https://front-end-acara-green-seven.vercel.app/", // ganti dengan URL frontend yang benar
    ];

    app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        credentials: true,
      })
    );

    app.use(bodyParser.json());

    app.get("/", (req, res) => {
      res.status(200).json({
        message: "Server is running successfully",
        data: null,
      });
    });

    app.use("/api", router);
    docs(app);

    app.use(errorMiddleware.serverRoute());
    app.use(errorMiddleware.serverError());

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
}

init();
