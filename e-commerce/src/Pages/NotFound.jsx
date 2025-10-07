import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const NotFound = () => {
const navigate = useNavigate()
useEffect(() => {
    const timer = setTimeout(() => {
        navigate('/');
    },4000);
    return () => clearTimeout(timer);
},[]);

  return (
    <>
        <div>
            <h1>404: Not found page</h1>
            <p>Redirecting to the home page........</p>
        </div>
    </>
  )
}

export default NotFound