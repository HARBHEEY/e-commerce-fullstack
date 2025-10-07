import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dummyProducts } from "../assets/assets";
import toast from "react-hot-toast";
import axios from "axios"   //for making api call for frontend

axios.defaults.withCredentials = true     //is used to send cookies in the api request
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;    //this is set as the defult baseurl for any api call made through axios package

 const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    const currency = import.meta.env.VITE_CURRENCY;
    const navigate = useNavigate();
    const [user, setUser] = useState(null)
    const [isSeller, setIsSeller] = useState(false)
    const [showUserLogin, setShowUserLogin] = useState(false)
    const [products, setProducts] = useState([])
    const [cartItems, setCartItems] = useState({})
    const [searchQuery, setSearchQuery] = useState({});


    //fetch seller status
    const fetchSeller = async () =>{
        try {
            const { data } = await axios.get('/api/seller/is-auth')
            if(data.success){
                setIsSeller(true)
            }else{
                setIsSeller(false)
            }
        } catch (error) {
           setIsSeller(false) 
        }
    }

    //Fetch User Auth status, User Data and Cart Items
    const fetchUser = async () =>{
        try {
            const { data } = await axios.get('/api/user/is-auth')
            if (data.success) {
                setUser(data.user)
                setCartItems(data.user.cartItems)
            }
        } catch (error) {
            setUser(null)
        }
    }
    // fetch All Products
    const fetchProducts = async() =>{
        try {
            const { data } = await axios.get('/api/product/list')
            if (data.success) {
                setProducts(data.products)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(()=>{
        fetchUser()
        fetchSeller()
        fetchProducts()
    },[])
      //Update Database Cart Items
    useEffect(() =>{
        const updateCart = async () =>{
            try {
                const { data } = await axios.post('/api/cart/update', { userId: user._id,cartItems})
                if (!data.success) {
                  toast.error(data.message)  
                }
            } catch (error) {
                toast.error(error.message) 
            }
        }
        if (user) {
            updateCart()
        }
    },[cartItems, user])

    //Add Products to cart
    const addToCart =(itemId)=>{
        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
            cartData[itemId] += 1;
        }else {
            cartData[itemId] = 1;
        }
        setCartItems(cartData);
        toast.success("Added to Cart");
        console.log(cartData);
    }

    // update cart item quantity
    const updateCartItem = (itemId, quantity) => {
        let cartData = structuredClone(cartItems);
        cartData[itemId] = quantity;
        setCartItems(cartData);
        toast.success("Cart Updated");
        console.log(cartData);
    }

    //remove product from cart
    const removeFromCart = (itemId) => {
        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
             cartData[itemId] -= 1;
             if (cartData[itemId] === 0) {
                 delete cartData[itemId];
             }
        }
        setCartItems(cartData);
        toast.success("Removed from Cart");
        console.log(cartData);
    }

    // Get Cart Item Count
    const getCartCount = () => {
        let totalCount = 0;
        for(const item in cartItems){
            totalCount += cartItems[item];
        }
        return totalCount;
    }
    // Get Cart Total Amount
    const getCartAmount = () => {
        let totalAmount = 0;
        for(const items in cartItems){
            let itemInfo = products.find((product)=> product._id === items);
            if (cartItems[items] > 0 && itemInfo) {
                totalAmount += cartItems[items] * itemInfo.offerPrice;
            }
        }
        return Math.floor(totalAmount * 100) / 100;
    }

    const value = { user, setUser, isSeller, setIsSeller, navigate, showUserLogin, setShowUserLogin, products, fetchProducts, currency, addToCart, updateCartItem, removeFromCart, cartItems, setCartItems, searchQuery, setSearchQuery, getCartCount, getCartAmount, axios };
    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = ()=>{
    return useContext(AppContext);
}