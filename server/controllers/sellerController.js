import jwt from "jsonwebtoken"

//login seller : /api/seller/login
export const sellerLogin = async (req, res) =>{
   try {
     const { email, password } = req.body;
        if(email === process.env.SELLER_EMAIL && password === process.env.SELLER_PASSWORD){
            const token = jwt.sign({email}, process.env.JWT_SECRET, {expiresIn: '7d'})
              res.cookie('sellerToken', token,{
               httpOnly: true, //prevent client side js to access the cookie
               secure: process.env.NODE_ENV === 'production', //use secure cookie in production
               sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', //CSRF protection
               maxAge: 7 * 24 * 60 * 60 * 1000 //7 days(it means it was applied in milliseconds to give 7days)Cookie expiration time
          })
          return res.json({ success: true, message: 'Seller login successfully' })
        }else{
          return res.json({ success: false, message: 'Invalid Seller Credentials' })
        }
    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
   }
}

//Seller isAuth: /api/seller/is-auth
export const isSellerAuth = async (req, res) =>{
    try {
        return res.json({ success: true })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }

}

//Seller Logout: /API/seller/logout
export const sellerlogout = async (req, res) =>{
    try {
        res.clearCookie('sellerToken',{
            httpOnly:true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        return res.json({ success: true, message: 'Seller logged out successfully'
        })
    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}