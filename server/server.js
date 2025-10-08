import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import connectDB from './configs/db.js';
import 'dotenv/config';
import userRouter from './routes/userRoute.js';
import sellerRouter from './routes/sellerRoute.js';
import connectcloudinary from './configs/cloudinary.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import addressRouter from './routes/addressRoute.js';
import orderRouter from './routes/orderRoute.js';
import { stripeWebhooks } from './controllers/orderController.js';


//Initialize Express App
const app = express();

//Database Connection
await connectDB()
await connectcloudinary()

//CORS setup
// Allow Multiple Origins (url) that is allowed to access our bankend
// You can add more urls in the array if you want to allow more than one url
const allowedOrigins = ['http://localhost:5173','https://greencarrt.vercel.app/']

//Stripe webhook
app.post('/stripe', express.raw({type: 'application/json'}), stripeWebhooks);

//MiddleWare Configuration
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: allowedOrigins, credentials: true}));

app.get('/', (req, res)=> res.send('API is Working...'));
app.use('/api/user', userRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/address', addressRouter)
app.use('/api/order', orderRouter)

 if(process.env.NODE_ENV !=='production'){
    const port = process.env.PORT || 5050;
    app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`);
})
 }

 //Export to vercel
 export default app;
