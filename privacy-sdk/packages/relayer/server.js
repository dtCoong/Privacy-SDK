import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const queue = [];
const status = {};

app.post("/api/v1/submit", (req, res) => {
  const id = `tx_${Date.now()}`;
  queue.push({ id, payload: req.body });
  status[id] = { state: "queued", receivedAt: Date.now() };
  res.json({ id, status: "queued" });
});

app.get("/api/v1/status/:id", (req, res) => {
  const s = status[req.params.id] || { state: "unknown" };
  res.json(s);
});

app.get("/api/v1/anonymity-set", (req, res) => {
  res.json({ set: ["pk_demo_1", "pk_demo_2", "pk_demo_3", "pk_demo_4"] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Relayer listening on ${PORT}`));
