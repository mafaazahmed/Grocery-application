import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import razorpayInstance from "../razorpay.js";
import crypto from 'crypto';



const razorPay = razorpayInstance();

// Place Order COD : /api/order/cod
export const placeOrderCOD = async (req,res) => {
    try {
        const {userId, items, address} = req.body;
        if(!address || items.length === 0){
            return res.json({success : false, message : 'Invalid data'});
        }

        // Calculate Amount Using Items
        let amount = await items.reduce(async (acc, item) => {
            const product = await Product.findById(item.product);
            return (await acc) + product.offerPrice * item.quantity
        }, 0)

        // Add Tax Charge (2%)
        //amount += Math.floor(amount * 0.02);

        await Order.create({
            userId,
            items,
            amount,
            address,
        });

        return res.json({success : true, message : 'Order Placed Successfully'});
    } catch (error) {
        return res.json({success : false, message : error.message});
    }
};


// Place Order Online through razorpay : /api/order/online


// 🛒 Place Order Online
export const placeOrderOnline = async (req, res) => {
  try {
    const { userId, items, address } = req.body;

    // 🔹 Validate request data
    if (!address || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order data. Please provide items and address.",
      });
    }

    // 🔹 Prepare product data and calculate total amount
    let productData = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }

      const price = product.offerPrice;
      const subtotal = price * item.quantity;
      totalAmount += subtotal;

      productData.push({
        name: product.name,
        price,
        quantity: item.quantity,
        subtotal,
      });
    }

    // 🔹 (Optional) Add Tax (Uncomment if needed)
    // totalAmount += Math.floor(totalAmount * 0.02);

    // 🔹 Save order in database
    const order = await Order.create({
      userId,
      items,
      amount: totalAmount,
      address,
      paymentType: "Online",
      status: "Pending", // Optional field
    });

    // 🔹 Generate dynamic receipt number
    const receiptId = `receipt_${Date.now()}`;

    // 🔹 Razorpay Order Options
    const options = {
      amount: totalAmount * 100, // Convert to paise
      currency: "INR",
      receipt: receiptId,
    };

    // 🔹 Create Razorpay Order
    const razorpayOrder = await razorPay.orders.create(options);

    // 🔹 Send response
    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      razorpayOrder,
      orderId: order._id,
      productData,
    });

  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// 🔑 Verify Razorpay Payment
export const verifyPayment = async (req, res) => {
  try {
    const { order_id, payment_id, signature, dbOrderId } = req.body;
    console.log(req.body);
    const secret = process.env.KEY_SECRET;

    if (!order_id || !payment_id || !signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment verification data",
      });
    }

    // 🔹 Generate signature
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${order_id}|${payment_id}`);
    const generatedSignature = hmac.digest("hex");

    // 🔹 Compare signatures
    if (generatedSignature === signature) {
      await Order.findByIdAndUpdate(dbOrderId, { isPaid : true }, {new : true});
      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


// Get Orders by UserId : /api/order/user

export const getUserOrders = async (req,res) => {
    try {
        const userId  = req.user.id;
        const orders = await Order.find({
            userId,
            $or : [{paymentType : 'COD'}, {isPaid : true}]
        }).populate('items.product address').sort({createdAt : -1});
        res.json({success : true, orders})
    

    } catch (error) {
        return res.json({success : false, message : error.message});
    }
};

// Get all Orders for seller and admin : /api/order/seller

export const getAllOrders = async (req,res) => {
    try {
        const orders = await Order.find().populate('items.product address').sort({createdAt : -1});

        res.json({success : true, orders})
    } catch (error) {
        return res.json({success : false, message : error.message});
    }
};