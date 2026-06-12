const dns = require("dns");

dns.resolveSrv(
  "_mongodb._tcp.cluster0.af558tn.mongodb.net",
  (err, addresses) => {
    console.log("ERROR:", err);
    console.log("ADDRESSES:", addresses);
  },
);
