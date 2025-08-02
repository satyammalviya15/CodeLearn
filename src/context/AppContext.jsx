import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import {useAuth, useUser} from "@clerk/clerk-react"
import { toast } from "react-toastify";
import axios from "axios";

export const AppContext=createContext()

export const AppContextProvider =(props)=>{

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const currency = import.meta.env.VITE_CURRENCY

    const navigate = useNavigate()

    const {getToken} =useAuth()
    const {user} = useUser()

    const [allCourses,setAllCourses]=useState([])

    const [isEducator,setIsEducator]=useState(false)

    const [enrolledCourses,setEnrolledCourses]=useState([])

    const [userData, setUserData] = useState([])

    //Fetch All Courses
    const fecthAllCourses = async()=>{
        try {
           const {data} = await axios.get(backendUrl+'/api/course/all')
            if(data.success){
                setAllCourses(data.courses)
            }
        }
        catch (error) {
            toast.error("Failed to fetch courses. Please try again later.")
        }
    }

    //Fetch User Data
    const fetchUserData = async()=>{
        try {
            if(user.publicMetadata.role=== "educator"){
                setIsEducator(true)
            }

            const token = await getToken()
            const {data} = await axios.get(backendUrl+'/api/user/data',{headers: {
                Authorization: `Bearer ${token}`
            }})            

            if(data.success){
                setUserData(data.user)
            }else{
                toast.error(data.message || "Failed to fetch user data.")
            }
        } catch (error) {
            toast.error(error.message || "An error occurred while fetching user data.")
        }
    }

    //Function to calculate average rating of course
    const calculateRating = (course)=>{
        if(course.courseRatings.length === 0){
            return 0;
        }
        let totalRating = 0
        course.courseRatings.forEach(rating => {
            totalRating += rating.rating
        });
        return Math.floor(totalRating / course.courseRatings.length)
    }

    // Function to Calculate Course Chapter Time
    const calculateChapterTime = (chapter)=>{
        let time =0
        chapter.chapterContent.map((lecture)=> time +=lecture.lectureDuration)
        return humanizeDuration(time*60*1000 , {units:["h","m"]})
    }

    //Function to Calculate Course Duration
    const calculateCourseDuration = (course)=>{
        let time = 0
        course.courseContent.map((chapter)=> chapter.chapterContent.map(
            (lecture)=> time+= lecture.lectureDuration
        ))
        return humanizeDuration(time*60*1000 , {units:["h","m"]})
    }

    //Function calculate to No of Lectures in the course
    const calculateNoOfLeactures = (course)=>{
        let totalLectures=0;
        course.courseContent.forEach(chapter=>{
            if(Array.isArray(chapter.chapterContent)){
                totalLectures += chapter.chapterContent.length;
            }
        });
        return totalLectures;
    }

    // Fetch User Enrolled Courses
    const fetchUserEnrolledCourses = async()=>{
        const token = await getToken()
        const {data} = await axios.get(backendUrl+'/api/user/enrolled-courses', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        if(data.success){
            setEnrolledCourses(data.enrolledCourses.reverse())}
        else{
            toast.error(data.message || "Failed to fetch enrolled courses.")
        }
    }


    useEffect(()=>{
        fecthAllCourses()
    },[])
    
    useEffect(()=>{
        if(user){
            fetchUserData()
            fetchUserEnrolledCourses()
        }
    },[user])


    const value={
        currency, allCourses, navigate, calculateRating,isEducator, setIsEducator,calculateChapterTime,calculateCourseDuration,calculateNoOfLeactures,
        enrolledCourses,fetchUserEnrolledCourses,backendUrl, userData, setUserData,getToken,fecthAllCourses
    }

    return(
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}