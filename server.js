const express = require("express");
const fs = require("fs");
const Stripe = require("stripe");

const stripe = Stripe("sk_test_51TJh3OCVNgIhHwoDhMdh41p79j1aQ0OOBiOCTi7T6Wxa7JCKt0LGijTLJvWz9sFIR6Mofx3yisreXh5KFFoQM4WD00eBD6mASf"); // حط مفتاحك

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// تحميل
let pixels = fs.existsSync("data.json") ? JSON.parse(fs.readFileSync("data.json")) : {};

function save(){
  fs.writeFileSync("data.json", JSON.stringify(pixels));
}

// جلب
app.get("/pixels",(req,res)=>{
  res.json(pixels);
});

// إنشاء الدفع
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

    success_url:"https://pixel-project.onrender.com/success.html"
    ,cancel_url:"http://localhost:3000"
  });

  res.json({url:session.url});
});

// ✅ التحقق بعد الدفع (بدون webhook)
app.get("/verify-payment", async (req,res)=>{

  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);

  if(session.payment_status === "paid"){

    const {id, link, image, owner} = session.metadata;

    pixels[id] = {link, image, owner};
    save();

    return res.send("saved");
  }

  res.send("not paid");
});

app.listen(3000,()=>{
  console.log("🔥 READY http://localhost:3000/login.html");
});