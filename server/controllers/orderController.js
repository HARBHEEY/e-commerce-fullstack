import Order from "../models/Order.js"
import Product from "../models/product.js"
import stripe from "stripe"
import User from "../models/User.js"


//place Order COD : /api/order/cod
export const placeOrderCOD = async (req, res) =>{
    try {
        const { items, address } = req.body
        const userId = req.user.userId;    //  get userId from middleware
        if(!address || items.length === 0){
            return res.json({ success: false, message: "Invalid data"})
        }
        //calculate amount using items
        let amount = await items.reduce(async (acc, item) =>{
            const product = await Product.findById(item.product)
            return (await acc) + product.offerPrice * item.quantity
        }, 0)
        //Add Tax Charge (2%)
        amount += Math.floor(amount * 0.02)
        await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "COD",
        })
        return res.json({ success: true, message: "Order Placed Successfully"})
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

//place Order Stripe : /api/order/stripe
export const placeOrderStripe = async (req, res) =>{
    try {
        const { items, address } = req.body
        const userId = req.user.userId;    //  get userId from middleware
        const {origin} = req.headers;
        if(!address || items.length === 0){
            return res.json({ success: false, message: "Invalid data"})
        }
        let productData = [];
        //calculate amount using items
        let subTotal = await items.reduce(async (acc, item) =>{
            const product = await Product.findById(item.product)
            productData.push({
                name: product.name,
                price: product.offerPrice,
                quantity: item.quantity
            })
            return (await acc) + product.offerPrice * item.quantity
        }, 0)
        //Add Tax Charge (2%)
        let tax = Math.floor(subTotal * 0.02)
        let amount = subTotal + tax
        const order = await Order.create({
            userId,
            items,
            amount,
            address,
            paymentType: "Online",
        })

        //Stripe Gateway Initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

        //create line items for stripe
        const line_items = productData.map((item) => {
            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: item.price * 100,  //amount in cents
                },
                quantity: item.quantity,
            }
        })

        // 4. Add tax as a separate Stripe line item
line_items.push({
  price_data: {
    currency: 'usd',
    product_data: { name: "Tax (2%)" },
    unit_amount: tax * 100, // cents
  },
  quantity: 1,
})

        //create session
        const session = await stripeInstance.checkout.sessions.create({
            line_items,
            mode: "payment",
            success_url: `${origin}/loader?next=my-orders`,
            cancel_url: `${origin}/cart`,
            metadata: {
                orderId: order._id.toString(),
                userId,
            }
        })

        return res.json({ success: true,  url: session.url })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}


//Stripe webhooks to verify payments action : /stripe
export const stripeWebhooks = async (req, res) =>{
    //Stripe Gateway Initialize
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripeInstance.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
        console.log("Webhook signature verification failed:", error.message);
        return res.status(400),send(`Webhook Error: ${error.message}`);
    }
    //Handle the event
    switch (event.type) {
        case "checkout.session.completed":{
            const session = event.data.object;
            const { orderId, userId } = session.metadata;

            //Mark payment as paid
            await Order.findByIdAndUpdate(orderId, { isPaid: true })

            //Clear user cart
            await User.findByIdAndUpdate(userId, { cartItems: {} })

            console.log(`Payment for order ${orderId} succeeded.`);
            break;
        }
        case "checkout.session.async_payment_failed":
        case "payment_intent.payment_failed":{
            const session = event.data.object;
            const {orderId } = session.metadata;
            await Order.findByIdAndDelete(orderId)

            console.log(`Payment for order ${orderId} failed.`);
            break;
         } 
           
    
        default:
            console.error(`Unhandled event type ${event.type}`);
            break;
    }
    res.json({received: true})
}


//Get Orders by userId : /api/order/user
export const getUserOrders = async (req, res)=>{
    try {
        console.log("req.user =>", req.user);
        const userId = req.user.userId;  //  from middleware
        const orders = await Order.find({ 
            userId,
            $or: [{ paymentType: "COD"}, {isPaid: true}]
        }).populate("items.product address").sort({createdAt: -1})
        res.json({ success: true, orders})
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}


//Get All Orders( For seller/admin ) ; /api/order/seller
export const getAllOrders = async (req, res) =>{
    try {
        const orders = await Order.find({ 
            $or: [{ paymentType: "COD"}, {isPaid: true}]
        }).populate("items.product address").sort({createdAt: -1})
        res.json({ success: true, orders})
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}