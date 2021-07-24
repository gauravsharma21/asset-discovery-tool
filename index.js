const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const app = express();
const output = require("./output.json");
const PORT = 8000;
app.use(express.json());

app.get("/", (req, res) => {
  res.send("hemlo");
});

const execPromise = (ipAddress) =>
  new Promise((resolve, reject) => {
    exec(`sh script.sh ${ipAddress}`, (error, stdout, stderr) => {
      if (error !== null) {
        reject(ipAddress);
      }
      resolve(`${ipAddress}\n${stdout}`);
    });
  });

const updateOutput = async (ipAddresses) => {
  const promises = ipAddresses.map((ipAddress) => execPromise(ipAddress));
  const responses = await Promise.allSettled(promises);
  const time = new Date();

  for (const response of responses) {
    if (response.status === "fulfilled") {
      const values = response.value.split("\n");
      const newObject = output[values[0]] ?? {};

      newObject.mac_address = values[2];
      switch (values[1]) {
        case "64":
          newObject.os = "Linux";
          break;
        case "128":
          newObject.os = "Windows";
          break;
        default:
          newObject.os = "Unknown";
      }
      newObject.os = values[1] === "64" ? "Linux" : "Windows";
      if (!newObject.last_seen || newObject.last_seen.status === "offline")
        newObject.last_seen = { status: "online", time };

      output[values[0]] = newObject;
    } else {
      const newObject = output[response.reason] ?? {};
      if (!newObject.last_seen || newObject.last_seen.status === "online")
        newObject.last_seen = { status: "offline", time };

      output[response.reason] = newObject;
    }
  }

  fs.writeFileSync("output.json", JSON.stringify(output));
};

app.post("/", async (req, res) => {
  const ipAddresses = req.body.ip_addresses;
  await updateOutput(ipAddresses);
  res.send(output);
});

setInterval(() => {
  updateOutput(Object.keys(output));
}, 60000);

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
