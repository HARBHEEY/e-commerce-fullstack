import jwt from "jsonwebtoken"

const authUser = async (req, res, next) =>{
    const {token} = req.cookies;
    if(!token){
        return res.json({ success: false, message: 'Not Authorized' })
    }
    // if the token is available....then we will decode it
     try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET)
        // assign the id to the token
        if(tokenDecode.id){
            req.user = { userId: tokenDecode.id }   //here the tokendecode.id will be added to the requestobject
        }else{
            return res.json({ success: false, message: 'Not Authorized' })
        }
        next(); //if everything is fine then we will call the next middleware or controller function
     } catch (error) {
        return res.json({ success: false, message: error.message })
     }
}

export default authUser;