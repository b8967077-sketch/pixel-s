const express = require("express");
const fs = require("fs");
const Stripe = require("stripe");

const stripe = Stripe("sk_test_51TKOR7BG30xtTBQx3M9LjWzqp5WVDaS4kcEuYRh3mekP3P9VO4zM9dnbaYIBrSJcHDwnwVzJAOknsAu1ljozir1U007fZSAMtZ");

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// 🔥 تحميل أو إنشاء
let users = {};
let pixels = {};

try{
  users = JSON.parse(fs.readFileSync("users.json"));
}catch{}

try{
  pixels = JSON.parse(fs.readFileSync("data.json"));
}catch{}

function save(){
  fs.writeFileSync("users.json", JSON.stringify(users));
  fs.writeFileSync("data.json", JSON.stringify(pixels));
}

// 📝 تسجيل
app.post("/register",(req,res)=>{
  const {username,password} = req.body;

  if(!username || !password) return res.send("EMPTY");

  if(users[username]) return res.send("EXISTS");

  users[username] = {password};
  save();

  res.send("OK");
});

// 🔐 تسجيل دخول
app.post("/login",(req,res)=>{
  const {username,password} = req.body;

  if(users[username] && users[username].password === password){
    res.send("OK");
  } else {
    res.send("NO");
  }
});

// 📦 جلب المربعات
app.get("/pixels",(req,res)=>{
  res.json(pixels);
});

// 💳 الدفع
app.post("/create-checkout-session", async (req,res)=>{

  const {id, link, image, owner} = req.body;

  const session = await stripe.checkout.sessions.create({
    payment_method_types:["card"],
    line_items:[{
      price_data:{
        currency:"usd",
        product_data:{name:"Pixel "+id},
        unit_amount:100
      },
      quantity:1
    }],
    mode:"payment",

    metadata:{ id, link, image, owner },

    success_url:"https://YOUR-SITE.onrender.com/success.html?session_id={CHECKOUT_SESSION_ID}",
    cancel_url:"https://YOUR-SITE.onrender.com"
  });

  res.json({url:session.url});
});

// ✅ تحقق بعد الدفع
app.get("/verify-payment", async (req,res)=>{

  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);

  if(session.payment_status === "paid"){

    const {id, link, image, owner} = session.metadata;

    pixels[id] = {link,image,owner};
    save();

    return res.send("saved");
  }

  res.send("not paid");
});

app.listen(3000,()=>{
  console.log("🔥 https://pixel-s-4.onrender.com");
});