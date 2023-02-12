// App for nodemailer oppgave
const express = require("express");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("./models/User");

const app = express();

dotenv.config();

app.set("view engine", "ejs");

// Database connection
mongoose.set("strictQuery", false);
const dbURI = "mongodb+srv://JosteinLL:ForSkole@cluster0.nqsbe58.mongodb.net/nodem?retryWrites=true&w=majority";
mongoose.connect(dbURI)
  .then(() => {
    app.listen(3000);
    console.log("listeining on port 3000")
  })
  .catch((err) => {
    console.log(err)
  });

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.render("index.ejs", { user: "" })
})

app.get("/login", (req, res) => {
    let info = "";
    res.render("login.ejs", { info: info })

})

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password);
    let lhost = req.hostname;
    let info = "";

    if (req.body.what == "Logg inn") {
       const user = await User.findOne({ email: email });
       if (user) {
            if (user.password == password) {
                res.render("index.ejs", { user: email })
            } else {
                res.render("login.ejs", { info: "Passord feil" })
            }
        } else {
            console.log("Brukeren finnes ikke i systemet")
       }
    } else {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD,
                clientId: process.env.OAUTH_CLIENTID,
                clientSecret: process.env.OAUTH_CLIENT_SECRET,
                refreshToken: process.env.OAUTH_REFRESH_TOKEN
            }
        });

        let mailOptions = {
            from: process.env.MAIL_USERNAME,
            to: email,
            subject: "Reset passord",
            text: "http://" + lhost + ":3000/nyttpassord?id=" + email
        };
    
        transporter.sendMail(mailOptions, (err, data) => {
            if (err) {
              console.log("Error " + err);
              info = "Sending av mail feilet";
              res.render("login.ejs", { info: info })
            } else {
              console.log("Email sendt uten noe problem, til: " + email);
              info = "Sending av mail vellykket";
              res.render("login.ejs", { info: info })
            }
        });
    } 
})

app.get("/sendmail", (req, res) => {
    let info = "";
    res.render("sendmail.ejs", { info: info })
})

app.post("/sendmail", (req, res) => {
    const { to, subject, text } = req.body;
    let info = "";

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD,
          clientId: process.env.OAUTH_CLIENTID,
          clientSecret: process.env.OAUTH_CLIENT_SECRET,
          refreshToken: process.env.OAUTH_REFRESH_TOKEN
        }
      });

      let mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: to,
        subject: subject,
        text: text
      };

      transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
          info = "Klarer ikke å sende mail";
          console.log("Error " + err);
          res.render("sendmail.ejs", { info: info })
        } else {
          info = "Klarer å sende mail";
          console.log("Email sendt uten noe problem, til: " + to);
          res.render("sendmail.ejs", { info: info })
        }
      });
})

app.get("/nyttpassord", (req, res) => {
    const id = req.query.id;

    res.render("nyttpassord.ejs", { email: id })
})

app.post("/nyttpassord", async (req, res) => {
    const { email, password } = req.body; 
    console.log(email, password);
    let info = "";

    const user = await User.findOne({ email: email });
    if (user) {
        let myqery = { email: email };
        let newpwd = { $set: { password: password }}; 
        User.updateOne(myqery, newpwd, function(err, result){
            if (err) {
                let info = "Klarte ikke å lage nytt passord";
                console.log(err)
                res.render("nyttpassord.ejs", { email: info })
            } else {
                let info = "Nytt passord opprettet";
                console.log(info)
                res.render("login.ejs", { info: info })
            }
        })
    } else {
        console.log("Brukeren finnes ikke i systemet")
    }
})

app.get("/lagbruker", (req, res) => {
    console.log("Lag bruker")
    let info = "";
    res.render("lagbruker.ejs", { info: info });
})

app.post("/lagbruker", async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password);
    let info = "";

    try {
        const user = await User.create({ email, password });
        res.render("index.ejs", { user: email })
    }
    catch (err) {
        console.log(err.message)
        let info = err.message;
        res.render("lagbruker", { info: info })
    }
})