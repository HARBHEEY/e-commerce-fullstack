import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Register user :/api/user/register
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body
        if (!name || !email || !password) {
            return res.json({success:false, message: 'Missing Details'})
        }
        const existingUser = await User.findOne({email})
        if (existingUser)
            return res.json({success:false, message: 'User already exists'})
        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await User.create({name, email, password: hashedPassword})
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'})

        res.cookie('token',token,{
            httpOnly: true, //prevent client side js to access the cookie
            secure: process.env.NODE_ENV === 'production', //use secure cookie in production
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', //CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000 //7 days(it means it was applied in milliseconds to give 7days)Cookie expiration time

        })
        return res.json({success: true, message: 'User Registered Successfully', user: {name: user.name, email: user.email}})
    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}

// Login user: /api/user/login
export const login = async (req, res)=>{
    try {
        const {email, password} = req.body;
        if (!email || !password) {
            return res.json({success:false, message: 'Email and password are required'});    
        }
        const user = await User.findOne({email});
        if (!user){
            return res.json({success: false, message: 'inavlid email or password'});
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.json({success: false, message: 'inavlid email or password'});
         const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'})

        res.cookie('token',token,{
            httpOnly: true, //prevent client side js to access the cookie
            secure: process.env.NODE_ENV === 'production', //use secure cookie in production
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', //CSRF protection
            maxAge: 7 * 24 * 60 * 60 * 1000 //7 days(it means it was applied in milliseconds to give 7days)Cookie expiration time

        })
        return res.json({success: true, message: 'User login successfully', user: {name: user.name, email: user.email}})
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

//check authentication status: /api/user/is-auth
export const isAuth = async (req, res) =>{
    try {
        const { userId } = req.user;
        const user = await User.findById(userId).select("-password")
        return res.json({ success: true, user})
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }

}

//logout user: /API/user/logout
export const logout = async (req, res) =>{
    try {
        res.clearCookie('token',{
            httpOnly:true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        return res.json({ success: true, message: 'User logged out successfully'
        })
    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}